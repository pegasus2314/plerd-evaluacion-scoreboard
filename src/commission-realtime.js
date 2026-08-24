import { supabase } from './lib/supabase';

const MODEL_KEY = 'r17:modelId';
const CONFIG_SELECTOR = '.r17-config-form select[name="distrito_id"]';

function currentModelId() {
  return localStorage.getItem(MODEL_KEY) || '';
}

function findCommissionSelect() {
  const labels = [...document.querySelectorAll('.eval-card label')];
  const label = labels.find(node => node.textContent.trim().toLowerCase().startsWith('comisión'));
  return label?.querySelector('select') || null;
}

async function loadCommissions() {
  const modelId = currentModelId();
  const select = findCommissionSelect();
  if (!modelId || !select || !supabase) return;

  const previous = select.value;
  const { data, error } = await supabase
    .from('scoreboard_commissions')
    .select('id,nombre,activo,orden')
    .eq('model_id', modelId)
    .eq('activo', true)
    .order('orden')
    .order('nombre');

  if (error) {
    console.error('No se pudieron cargar las comisiones:', error);
    return;
  }

  const rows = data || [];
  select.innerHTML = '<option value="">Seleccionar comisión</option>' + rows
    .map(row => `<option value="${String(row.id).replace(/"/g, '&quot;')}">${String(row.nombre).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</option>`)
    .join('');
  if (rows.some(row => row.id === previous)) select.value = previous;
}

function styleDistrictSelectors() {
  document.querySelectorAll(CONFIG_SELECTOR).forEach(select => {
    select.classList.add('r17-district-select');
  });
}

function startRealtime() {
  if (!supabase || window.__r17CommissionChannel) return;
  window.__r17CommissionChannel = supabase
    .channel('r17-commission-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboard_commissions' }, async () => {
      await loadCommissions();
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') loadCommissions();
    });
}

const observer = new MutationObserver(() => {
  styleDistrictSelectors();
  loadCommissions();
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('r17:model-changed', () => setTimeout(loadCommissions, 50));
window.addEventListener('load', () => {
  styleDistrictSelectors();
  startRealtime();
  loadCommissions();
});
setTimeout(() => {
  styleDistrictSelectors();
  startRealtime();
  loadCommissions();
}, 500);
