import { supabase } from './lib/supabase';

const MODEL_KEY = 'r17:modelId';

function modelId() {
  return localStorage.getItem(MODEL_KEY) || null;
}

function labelText(label) {
  return label ? [...label.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent || '').join(' ').trim() : '';
}

function isCommissionSelect(select) {
  const label = select?.closest('label');
  if (!label) return false;
  return /comisi[oó]n/i.test(labelText(label)) || /comisi[oó]n/i.test(label.getAttribute('aria-label') || '');
}

function ensureStyles() {
  if (document.getElementById('r17-commission-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'r17-commission-ui-styles';
  style.textContent = `
    .r17-commission-wrap{position:relative;width:100%;margin-top:7px}
    .r17-commission-input{width:100%!important;height:38px!important;box-sizing:border-box;padding:8px 34px 8px 10px!important;border:1px solid #d0d5dd!important;border-radius:9px!important;background:#fff!important;color:#101828!important;font-size:12px!important}
    .r17-commission-input:focus{outline:none;border-color:#2f6fed!important;box-shadow:0 0 0 3px rgba(47,111,237,.12)!important}
    .r17-commission-menu{position:absolute;left:0;right:0;top:calc(100% + 5px);display:none;max-height:190px;overflow:auto;background:#fff;border:1px solid #e2e7ef;border-radius:10px;box-shadow:0 12px 28px rgba(20,30,50,.12);padding:4px;z-index:99999}
    .r17-commission-menu.open{display:block}
    .r17-commission-option{display:block;width:100%;border:0;background:transparent;text-align:left;border-radius:7px;padding:8px 9px;color:#344054;font-size:11px;cursor:pointer}
    .r17-commission-option:hover{background:#eef4ff;color:#2f6fed}
    .r17-commission-empty{padding:8px 9px;color:#98a2b3;font-size:10px}
    .r17-commission-select-hidden{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
    .r17-auto-commission{background:#f8fafc!important;color:#475467!important}
    .r17-delegate-commission-help{display:block;margin-top:5px;font-size:10px;color:#667085}
  `;
  document.head.appendChild(style);
}

async function loadCommissionOptions(select) {
  const mid = modelId();
  if (!mid || !select) return;
  const { data, error } = await supabase.from('scoreboard_commissions').select('id,nombre').eq('model_id', mid).eq('activo', true).order('orden').order('nombre');
  if (error) {
    console.error('No se pudieron cargar las comisiones:', error);
    return;
  }
  const current = select.value;
  select.innerHTML = '<option value="">Seleccionar comisión</option>';
  (data || []).forEach((commission) => {
    const option = document.createElement('option');
    option.value = commission.id;
    option.textContent = commission.nombre || '';
    select.appendChild(option);
  });
  if (current) select.value = current;
}

function installAutocomplete(select) {
  if (!select || select.dataset.commissionAutocomplete === '2' || !isCommissionSelect(select)) return;
  select.dataset.commissionAutocomplete = '2';
  const wrap = document.createElement('div');
  wrap.className = 'r17-commission-wrap';
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('r17-commission-select-hidden');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'r17-commission-input';
  input.autocomplete = 'off';
  input.placeholder = 'Buscar o seleccionar comisión';
  input.setAttribute('aria-label', 'Comisión');
  wrap.insertBefore(input, select);
  const menu = document.createElement('div');
  menu.className = 'r17-commission-menu';
  wrap.appendChild(menu);
  const options = () => [...select.options].filter((option) => option.value && option.textContent.trim());
  const sync = () => {
    const option = select.options[select.selectedIndex];
    input.value = option?.value ? option.textContent.trim() : '';
  };
  const choose = (option) => {
    if (!option) return;
    select.value = option.value;
    input.value = option.textContent.trim();
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    menu.classList.remove('open');
  };
  const render = () => {
    const query = input.value.trim().toLocaleLowerCase('es');
    const filtered = options().filter((option) => !query || option.textContent.toLocaleLowerCase('es').includes(query)).slice(0, 20);
    menu.innerHTML = '';
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'r17-commission-empty';
      empty.textContent = 'No hay coincidencias';
      menu.appendChild(empty);
      return;
    }
    filtered.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'r17-commission-option';
      button.textContent = option.textContent.trim();
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        choose(option);
        input.focus();
      });
      menu.appendChild(button);
    });
  };
  input.addEventListener('focus', () => { render(); menu.classList.add('open'); });
  input.addEventListener('input', () => { render(); menu.classList.add('open'); });
  input.addEventListener('blur', () => setTimeout(() => menu.classList.remove('open'), 150));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { sync(); menu.classList.remove('open'); }
    if (event.key === 'Enter') {
      const first = menu.querySelector('.r17-commission-option');
      if (first) {
        event.preventDefault();
        first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      }
    }
  });
  select.addEventListener('change', sync);
  sync();
}

function findDelegateModal() {
  return [...document.querySelectorAll('.modal form')].find((form) => /Nuevo delegado|Editar delegado/i.test(form.querySelector('h2')?.textContent || '')) || null;
}

async function ensureDelegateCommissionField() {
  const form = findDelegateModal();
  if (!form || form.querySelector('.r17-new-delegate-commission')) return;
  const modelLabel = [...form.querySelectorAll('label')].find((label) => /Modelo\s*\/\s*Comit[eé]/i.test(labelText(label)));
  if (!modelLabel) return;
  const label = document.createElement('label');
  label.className = 'r17-new-delegate-commission';
  label.innerHTML = '<span>Comisión</span><select required><option value="">Cargando comisiones…</option></select><small class="r17-delegate-commission-help">La comisión se asignará al delegado y aparecerá automáticamente en la evaluación.</small>';
  modelLabel.insertAdjacentElement('afterend', label);
  const select = label.querySelector('select');
  await loadCommissionOptions(select);
  installAutocomplete(select);
  if (/Editar delegado/i.test(form.querySelector('h2')?.textContent || '')) {
    const name = form.querySelector('input[placeholder*="Albert"]')?.value?.trim() || '';
    const nuid = form.querySelector('input[placeholder*="R17-"]')?.value?.trim() || '';
    if (name) {
      let query = supabase.from('scoreboard_delegates').select('commission_id').eq('model_id', modelId()).eq('nombre', name);
      if (nuid) query = query.eq('nuid', nuid);
      const { data } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data?.commission_id) {
        select.value = data.commission_id;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
}

let pendingCommission = null;
function captureDelegateSubmit() {
  document.addEventListener('submit', (event) => {
    const form = event.target.closest?.('.modal form');
    if (!form) return;
    const field = form.querySelector('.r17-new-delegate-commission select');
    if (!field || !field.value) return;
    pendingCommission = {
      commissionId: field.value,
      name: form.querySelector('input[placeholder*="Albert"]')?.value?.trim() || '',
      country: form.querySelector('input[placeholder*="República"]')?.value?.trim() || '',
      nuid: form.querySelector('input[placeholder*="R17-"]')?.value?.trim() || '',
      at: Date.now()
    };
    setTimeout(savePendingCommission, 700);
    setTimeout(savePendingCommission, 1400);
  }, true);
}

async function savePendingCommission() {
  const pending = pendingCommission;
  if (!pending || Date.now() - pending.at > 5000) return;
  const mid = modelId();
  if (!mid) return;
  let query = supabase.from('scoreboard_delegates').select('id,commission_id').eq('model_id', mid).eq('nombre', pending.name).eq('pais', pending.country);
  if (pending.nuid) query = query.eq('nuid', pending.nuid);
  else query = query.is('nuid', null);
  const { data } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data) return;
  if (data.commission_id !== pending.commissionId) await supabase.from('scoreboard_delegates').update({ commission_id: pending.commissionId, updated_at: new Date().toISOString() }).eq('id', data.id);
  pendingCommission = null;
}

function findEvaluationSelectors() {
  const delegateSelect = [...document.querySelectorAll('select')].find((select) => /Delegado\/a/i.test(labelText(select.closest('label'))));
  const commissionSelect = [...document.querySelectorAll('select')].find((select) => isCommissionSelect(select) && !select.closest('.r17-new-delegate-commission'));
  return { delegateSelect, commissionSelect };
}

let syncingEvaluation = false;
async function syncEvaluationCommission() {
  const { delegateSelect, commissionSelect } = findEvaluationSelectors();
  if (!delegateSelect || !commissionSelect || syncingEvaluation) return;
  syncingEvaluation = true;
  // Comisión vuelve a estar habilitada para selección manual.
  commissionSelect.disabled = false;
  commissionSelect.classList.remove('r17-auto-commission');
  const visibleInput = commissionSelect.closest('label')?.querySelector('.r17-commission-input');
  if (visibleInput) {
    visibleInput.disabled = false;
    visibleInput.readOnly = false;
    visibleInput.classList.remove('r17-auto-commission');
  }
  syncingEvaluation = false;
}

function observeEvaluationSelection() {
  const { delegateSelect } = findEvaluationSelectors();
  if (delegateSelect && !delegateSelect.dataset.r17CommissionSync) {
    delegateSelect.dataset.r17CommissionSync = '1';
    delegateSelect.addEventListener('change', () => setTimeout(syncEvaluationCommission, 0));
  }
  syncEvaluationCommission();
}

function install() {
  ensureStyles();
  document.querySelectorAll('select').forEach(installAutocomplete);
  ensureDelegateCommissionField();
  observeEvaluationSelection();
}

captureDelegateSubmit();
const observer = new MutationObserver(install);
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', install);
setTimeout(install, 100);
setTimeout(install, 500);
setTimeout(install, 1200);
setInterval(install, 1000);
