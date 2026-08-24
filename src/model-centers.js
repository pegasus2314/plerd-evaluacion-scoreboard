import { supabase } from './lib/supabase';

const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const qs = (s, r = document) => r.querySelector(s);

const STAGES = ['Registro', 'Convocatoria', 'Preparación', 'Participación', 'Evaluación', 'Cierre'];
const STATES = ['Pendiente', 'Activo', 'Completado'];
let channel = null;
let centersChannel = null;
let mountedModelId = null;
let started = false;
let mounting = false;

function activeModelId() {
  return localStorage.getItem('r17:modelId');
}

async function getModel() {
  const id = activeModelId();
  if (!id) return null;
  const { data, error } = await supabase
    .from('scoreboard_models')
    .select('id,nombre,distrito_id,distritos(id,nombre)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function ensureCard() {
  const grid = document.querySelector('.r17-admin-grid');
  const modelsCard = document.querySelector('#r17-models-card');
  if (!grid || !modelsCard) return null;

  let card = document.querySelector('#r17-model-centers-card');
  if (card) return card;

  card = document.createElement('div');
  card.id = 'r17-model-centers-card';
  card.className = 'r17-admin-card wide r17-centers-card';
  modelsCard.insertAdjacentElement('afterend', card);
  return card;
}

function renderShell(card, model) {
  card.innerHTML = `
    <div class="r17-admin-card-head r17-centers-head">
      <div>
        <div class="r17-centers-kicker">CENTROS DEL MODELO</div>
        <h2>Etapas de centros educativos</h2>
        <p>${model ? `Organiza los centros de ${esc(model.distritos?.nombre || model.distrito_id)} dentro de <strong>${esc(model.nombre)}</strong>.` : 'Selecciona un modelo activo para administrar sus centros.'}</p>
      </div>
      <div class="r17-centers-live"><span></span> EN VIVO</div>
    </div>
    <div class="r17-admin-body">
      ${model ? `
        <div class="r17-centers-form">
          <label>Centro educativo<select id="r17-center-select"><option value="">Selecciona un centro…</option></select></label>
          <label>Etapa<select id="r17-center-stage">${STAGES.map(x => `<option value="${x}">${x}</option>`).join('')}</select></label>
          <label>Estado<select id="r17-center-state">${STATES.map(x => `<option value="${x}">${x}</option>`).join('')}</select></label>
          <button class="r17-btn primary r17-center-add" id="r17-center-add">+ Agregar al modelo</button>
        </div>
        <div id="r17-center-message" class="r17-center-message" hidden></div>
        <div class="r17-centers-summary" id="r17-centers-summary"></div>
        <div id="r17-centers-list" class="r17-centers-list"></div>
      ` : `<div class="r17-empty">Selecciona un modelo en la parte superior para comenzar.</div>`}
    </div>`;
}

async function loadCenters(model) {
  const select = qs('#r17-center-select');
  if (!select) return;

  const { data, error } = await supabase
    .from('centros_educativos')
    .select('id,nombre,nivel,municipio,distrito_id')
    .eq('distrito_id', model.distrito_id)
    .eq('is_active', true)
    .order('nombre');

  if (error) throw error;

  select.innerHTML = '<option value="">Selecciona un centro…</option>' + (data || [])
    .map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}${c.nivel ? ` · ${esc(c.nivel)}` : ''}</option>`)
    .join('');
}

function showMessage(text, error = false) {
  const box = qs('#r17-center-message');
  if (!box) return;
  box.hidden = false;
  box.className = `r17-center-message ${error ? 'error' : 'ok'}`;
  box.textContent = text;
  window.clearTimeout(showMessage._timer);
  showMessage._timer = window.setTimeout(() => { box.hidden = true; }, 2600);
}

function renderRows(rows) {
  const list = qs('#r17-centers-list');
  const summary = qs('#r17-centers-summary');
  if (!list || !summary) return;

  const counts = Object.fromEntries(STAGES.map(s => [s, 0]));
  rows.forEach(r => { counts[r.etapa] = (counts[r.etapa] || 0) + 1; });
  summary.innerHTML = STAGES
    .map(s => `<div><span>${esc(s)}</span><strong>${counts[s] || 0}</strong></div>`)
    .join('');

  if (!rows.length) {
    list.innerHTML = '<div class="r17-empty">Todavía no hay centros asignados a este modelo.</div>';
    return;
  }

  list.innerHTML = rows.map(row => `
    <div class="r17-center-row" data-center-row="${esc(row.id)}">
      <div class="r17-center-main">
        <strong>${esc(row.centro?.nombre || 'Centro educativo')}</strong>
        <span>${esc(row.centro?.nivel || 'Centro')} · ${esc(row.centro?.municipio || '')}</span>
      </div>
      <label><span>Etapa</span><select data-center-stage="${esc(row.id)}">${STAGES.map(s => `<option value="${s}" ${row.etapa === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label><span>Estado</span><select data-center-state="${esc(row.id)}">${STATES.map(s => `<option value="${s}" ${row.estado === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <button class="r17-btn danger" data-center-delete="${esc(row.id)}">Quitar</button>
    </div>`).join('');

  list.querySelectorAll('[data-center-stage]').forEach(select => {
    select.addEventListener('change', e => updateRow(e.target.dataset.centerStage, { etapa: e.target.value }));
  });

  list.querySelectorAll('[data-center-state]').forEach(select => {
    select.addEventListener('change', e => updateRow(e.target.dataset.centerState, { estado: e.target.value }));
  });

  list.querySelectorAll('[data-center-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('¿Quitar este centro del modelo?')) return;
      const { error } = await supabase
        .from('scoreboard_model_centers')
        .delete()
        .eq('id', button.dataset.centerDelete);
      if (error) return showMessage(error.message, true);
      showMessage('Centro quitado del modelo.');
      await loadAssignments();
    });
  });
}

async function loadAssignments() {
  const model = await getModel();
  if (!model) return;

  const { data, error } = await supabase
    .from('scoreboard_model_centers')
    .select('id,model_id,centro_id,etapa,estado,notas,centro:centros_educativos(id,nombre,nivel,municipio)')
    .eq('model_id', model.id)
    .order('created_at');

  if (error) throw error;
  renderRows(data || []);
}

async function updateRow(id, patch) {
  const { error } = await supabase
    .from('scoreboard_model_centers')
    .update(patch)
    .eq('id', id);
  if (error) return showMessage(error.message, true);
  showMessage('Cambio guardado en tiempo real.');
}

async function addCenter() {
  const model = await getModel();
  const centerId = qs('#r17-center-select')?.value;
  const etapa = qs('#r17-center-stage')?.value || 'Registro';
  const estado = qs('#r17-center-state')?.value || 'Pendiente';

  if (!model || !centerId) return showMessage('Selecciona un centro educativo.', true);

  const { error } = await supabase
    .from('scoreboard_model_centers')
    .insert({ model_id: model.id, centro_id: centerId, etapa, estado });

  if (error) {
    if (error.code === '23505') return showMessage('Ese centro ya está agregado a este modelo.', true);
    return showMessage(error.message, true);
  }

  qs('#r17-center-select').value = '';
  showMessage('Centro agregado al modelo.');
  await loadAssignments();
}

async function subscribe(modelId) {
  if (channel) {
    await supabase.removeChannel(channel);
    channel = null;
  }
  if (centersChannel) {
    await supabase.removeChannel(centersChannel);
    centersChannel = null;
  }
  if (!modelId) return;

  channel = supabase
    .channel(`model-centers-${modelId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'scoreboard_model_centers',
      filter: `model_id=eq.${modelId}`
    }, () => loadAssignments().catch(console.error))
    .subscribe();

  centersChannel = supabase
    .channel(`education-centers-${modelId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'centros_educativos',
      filter: `distrito_id=eq.${modelId}`
    }, () => {
      getModel().then(loadCenters).catch(console.error);
    })
    .subscribe();
}

async function mount() {
  if (mounting) return;
  const model = await getModel();
  const card = ensureCard();
  if (!card) return;

  const modelId = model?.id || null;
  if (mountedModelId === modelId && card.dataset.r17Mounted === '1') return;

  mounting = true;
  try {
    renderShell(card, model);
    card.dataset.r17Mounted = '1';
    mountedModelId = modelId;

    if (!model) return;

    await subscribe(model.id);
    await loadCenters(model);
    await loadAssignments();
    qs('#r17-center-add')?.addEventListener('click', () => addCenter().catch(e => showMessage(e.message, true)));
  } finally {
    mounting = false;
  }
}

function watchAdminPanel() {
  const observer = new MutationObserver(() => {
    const grid = document.querySelector('.r17-admin-grid');
    const card = document.querySelector('#r17-model-centers-card');
    if (grid && !card) mount().catch(console.error);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function start() {
  if (started) return;
  started = true;

  watchAdminPanel();
  window.addEventListener('storage', e => {
    if (e.key === 'r17:modelId') {
      mountedModelId = null;
      mount().catch(console.error);
    }
  });
  window.addEventListener('beforeunload', () => {
    if (channel) supabase.removeChannel(channel);
    if (centersChannel) supabase.removeChannel(centersChannel);
  });

  mount().catch(console.error);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
