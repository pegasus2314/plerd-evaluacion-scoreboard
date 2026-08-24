import { supabase } from './lib/supabase';

const MODEL_KEY = 'r17:modelId';
const STYLE_ID = 'r17-system-repair-style';
let lastModelId = null;
let lastCommissionIds = '';

function esc(v = '') {
  return String(v).replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[c]));
}

function style() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    .r17-live-select{appearance:auto!important;-webkit-appearance:auto!important;background:#fff!important;color:#1f2937!important;border:1px solid #d7dee8!important;border-radius:11px!important;min-height:44px!important;padding:0 13px!important;box-shadow:0 2px 7px rgba(24,39,75,.04)!important;font-size:12px!important;font-weight:650!important;opacity:1!important;visibility:visible!important;color-scheme:light!important}
    .r17-live-select:focus{border-color:#2f6fed!important;box-shadow:0 0 0 4px rgba(47,111,237,.10)!important}
    .r17-live-select option{background:#fff!important;color:#1f2937!important;font-size:12px!important}
    .r17-context-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:#eef4ff;color:#2f6fed;border:1px solid #dbe7fc;font-size:9px;font-weight:800}
    .r17-sync-badge{font-size:8px;font-weight:800;color:#168451;background:#e9f8f0;border:1px solid #d3efdf;border-radius:999px;padding:4px 7px}
  `;
  document.head.appendChild(el);
}

async function getModelId() {
  let id = localStorage.getItem(MODEL_KEY) || '';
  const { data, error } = await supabase.from('scoreboard_models').select('id,nombre,distrito_id,estado').order('created_at', { ascending: true });
  if (error) return id;
  if (!id && data?.[0]) {
    id = data[0].id;
    localStorage.setItem(MODEL_KEY, id);
  }
  if (id && data && !data.some(m => m.id === id) && data[0]) {
    id = data[0].id;
    localStorage.setItem(MODEL_KEY, id);
  }
  return id;
}

async function loadCommissions() {
  const modelId = await getModelId();
  if (!modelId) return [];
  const { data, error } = await supabase
    .from('scoreboard_commissions')
    .select('id,nombre,descripcion,activo,orden,model_id')
    .eq('model_id', modelId)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });
  if (error) {
    console.error('[R17] No se pudieron cargar las comisiones', error);
    return [];
  }
  return (data || []).filter(c => c.activo !== false);
}

function findSelectByLabel(text) {
  const labels = [...document.querySelectorAll('label')];
  const label = labels.find(l => l.textContent.trim().toLowerCase().startsWith(text.toLowerCase()));
  return label?.querySelector('select') || null;
}

function replaceOptions(select, options, placeholder) {
  if (!select) return false;
  const current = select.value;
  const html = `<option value="">${esc(placeholder)}</option>` + options.map(o => `<option value="${esc(o.id)}">${esc(o.nombre)}</option>`).join('');
  if (select.innerHTML !== html) select.innerHTML = html;
  select.classList.add('r17-live-select');
  if (options.some(o => o.id === current)) select.value = current;
  return true;
}

async function syncCommissionSelect() {
  const commissions = await loadCommissions();
  const signature = commissions.map(c => c.id + ':' + c.nombre).join('|');
  const select = findSelectByLabel('Comisión');
  if (!select) return;
  if (signature === lastCommissionIds && lastModelId === localStorage.getItem(MODEL_KEY)) return;
  lastCommissionIds = signature;
  lastModelId = localStorage.getItem(MODEL_KEY);
  replaceOptions(select, commissions, commissions.length ? 'Seleccionar comisión' : 'No hay comisiones para este modelo');
  select.disabled = false;
  select.title = commissions.length ? `${commissions.length} comisiones disponibles` : 'No hay comisiones';
}

async function syncDistrictSelectors() {
  const { data, error } = await supabase.from('distritos').select('id,nombre').order('id');
  if (error || !data) return;
  document.querySelectorAll('select[name="distrito_id"], select[data-field="distrito_id"]').forEach(select => {
    replaceOptions(select, data.map(d => ({ id: d.id, nombre: `${d.id} · ${d.nombre}` })), 'Seleccionar distrito');
    select.classList.add('r17-live-select');
  });
}

async function syncModelSelectors() {
  const { data, error } = await supabase.from('scoreboard_models').select('id,nombre,distrito_id,estado').order('created_at', { ascending: true });
  if (error || !data) return;
  const current = localStorage.getItem(MODEL_KEY);
  document.querySelectorAll('select[name="model_id"], select[data-field="model_id"]').forEach(select => {
    replaceOptions(select, data.map(m => ({ id: m.id, nombre: `${m.nombre} · ${m.distrito_id}` })), 'Seleccionar modelo');
    if (current) select.value = current;
    select.classList.add('r17-live-select');
  });
}

function renderLiveIndicator() {
  const top = document.querySelector('.top-actions');
  if (!top || top.querySelector('.r17-sync-badge')) return;
  const badge = document.createElement('span');
  badge.className = 'r17-sync-badge';
  badge.textContent = '● EN VIVO';
  top.insertBefore(badge, top.firstChild);
}

async function refresh() {
  style();
  await syncCommissionSelect();
  await syncDistrictSelectors();
  await syncModelSelectors();
  renderLiveIndicator();
}

function subscribe() {
  if (!supabase) return;
  supabase.channel('r17-live-data')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboard_commissions' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboard_models' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'distritos' }, refresh)
    .subscribe();
}

const observer = new MutationObserver(() => refresh());

async function boot() {
  if (!supabase) return;
  await refresh();
  subscribe();
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(refresh, 3000);
}

window.addEventListener('r17:model-changed', refresh);
window.addEventListener('load', boot);
setTimeout(boot, 700);
