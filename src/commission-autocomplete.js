import { supabase } from './lib/supabase';

function ensureCommissionStyles(){
  if(document.getElementById('r17-commission-ui-styles'))return;
  const style=document.createElement('style');
  style.id='r17-commission-ui-styles';
  style.textContent=`
    .r17-commission-wrap{position:relative;margin-top:7px;width:100%}
    .r17-commission-wrap .r17-commission-input{margin-top:0!important;width:100%!important;height:38px!important;padding:8px 34px 8px 10px!important;border:1px solid #d0d5dd!important;border-radius:9px!important;font-size:12px!important;box-sizing:border-box;background:#fff!important;color:#101828!important;outline:none}
    .r17-commission-wrap .r17-commission-input:focus{border-color:#2f6fed!important;box-shadow:0 0 0 3px rgba(47,111,237,.12)!important}
    .r17-commission-chevron{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:#98a2b3;pointer-events:none}
    .r17-commission-menu{position:absolute;left:0;right:0;top:calc(100% + 5px);display:none;max-height:190px;overflow:auto;background:#fff;border:1px solid #e2e7ef;border-radius:10px;box-shadow:0 12px 28px rgba(20,30,50,.12);padding:4px;z-index:9999}
    .r17-commission-menu.open{display:block}
    .r17-commission-option{display:block;width:100%;border:0;background:transparent;text-align:left;border-radius:7px;padding:8px 9px;color:#344054;font-size:11px;cursor:pointer}
    .r17-commission-option:hover{background:#eef4ff;color:#2f6fed}
    .r17-commission-empty{padding:8px 9px;color:#98a2b3;font-size:10px}
    .r17-commission-select-hidden{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}
    .r17-delegate-commission-help{display:block;margin-top:5px;font-size:10px;color:#667085}
    .r17-auto-commission{background:#f8fafc!important;color:#475467!important;cursor:not-allowed!important}
  `;
  document.head.appendChild(style);
}

function modelId(){return localStorage.getItem('r17:modelId')||null;}
function labelText(label){return label?[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent||'').join(' ').trim():'';}
function isCommissionSelect(select){const label=select.closest('label');if(!label)return false;return /comisi[oó]n/i.test(labelText(label))||/comisi[oó]n/i.test(label.getAttribute('aria-label')||'');}

function installAutocomplete(select){
  if(!select||select.dataset.commissionAutocomplete==='2'||!isCommissionSelect(select))return;
  select.dataset.commissionAutocomplete='2';
  const wrap=document.createElement('div');
  wrap.className='r17-commission-wrap';
  select.parentNode.insertBefore(wrap,select);
  wrap.appendChild(select);
  select.classList.add('r17-commission-select-hidden');
  const input=document.createElement('input');
  input.type='text';input.className='r17-commission-input';input.autocomplete='off';input.placeholder='Buscar o seleccionar comisión';input.setAttribute('aria-label','Comisión');wrap.insertBefore(input,select);
  const chevron=document.createElement('span');chevron.className='r17-commission-chevron';chevron.textContent='▾';wrap.appendChild(chevron);
  const menu=document.createElement('div');menu.className='r17-commission-menu';wrap.appendChild(menu);
  const options=()=>[...select.options].filter(o=>o.value&&o.textContent.trim());
  const sync=()=>{const o=select.options[select.selectedIndex];input.value=o?.value?o.textContent.trim():'';};
  const choose=o=>{if(!o)return;select.value=o.value;input.value=o.textContent.trim();select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));menu.classList.remove('open');};
  const render=()=>{const q=input.value.trim().toLocaleLowerCase('es');const filtered=options().filter(o=>!q||o.textContent.toLocaleLowerCase('es').includes(q)).slice(0,20);menu.innerHTML='';if(!filtered.length){menu.innerHTML='<div class="r17-commission-empty">No hay coincidencias</div>';return;}filtered.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='r17-commission-option';b.textContent=o.textContent.trim();b.addEventListener('mousedown',e=>{e.preventDefault();choose(o);input.focus();});menu.appendChild(b);});};
  input.addEventListener('focus',()=>{render();menu.classList.add('open')});
  input.addEventListener('input',()=>{render();menu.classList.add('open')});
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){sync();menu.classList.remove('open');}if(e.key==='Enter'){const first=menu.querySelector('.r17-commission-option');if(first){e.preventDefault();first.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));}}});
  select.addEventListener('change',sync);sync();
}

async function loadCommissionOptions(select){
  const mid=modelId();if(!mid||!select)return;
  const {data,error}=await supabase.from('scoreboard_commissions').select('id,nombre').eq('model_id',mid).eq('activo',true).order('orden').order('nombre');
  if(error)return;
  const current=select.value;
  select.innerHTML='<option value="">Seleccionar comisión</option>'+(data||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
  if(current)select.value=current;
}
function escapeHtml(value){
  return String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function findDelegateModal(){return [...document.querySelectorAll('.modal form')].find(form=>/Nuevo delegado|Editar delegado/i.test(form.querySelector('h2')?.textContent||''));}
async function ensureDelegateCommissionField(){
  const form=findDelegateModal();if(!form||form.querySelector('.r17-new-delegate-commission'))return;
  const modelLabel=[...form.querySelectorAll('label')].find(l=>/Modelo\s*\/\s*Comit[eé]/i.test(labelText(l)));if(!modelLabel)return;
  const label=document.createElement('label');
  label.className='r17-new-delegate-commission';
  label.innerHTML='<span>Comisión</span><select required><option value="">Cargando comisiones…</option></select><small class="r17-delegate-commission-help">La comisión se asignará al delegado y aparecerá automáticamente en la hoja de evaluación.</small>';
  modelLabel.insertAdjacentElement('afterend',label);
  const select=label.querySelector('select');
  await loadCommissionOptions(select);
  installAutocomplete(select);
  const name=form.querySelector('input[placeholder*="Albert"]')?.value?.trim()||'';
  const nuid=form.querySelector('input[placeholder*="R17-"]')?.value?.trim()||'';
  if(/Editar delegado/i.test(form.querySelector('h2')?.textContent||'')&&name){
    const q=supabase.from('scoreboard_delegates').select('commission_id').eq('model_id',modelId()).eq('nombre',name);
    const {data}=nuid?await q.eq('nuid',nuid).maybeSingle():await q.order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(data?.commission_id){select.value=data.commission_id;select.dispatchEvent(new Event('change',{bubbles:true}));}
  }
}

let pendingCommission=null;
function captureDelegateSubmit(){
  document.addEventListener('submit',e=>{
    const form=e.target.closest?.('.modal form');if(!form)return;
    const field=form.querySelector('.r17-new-delegate-commission select');if(!field)return;
    pendingCommission={commissionId:field.value||null,name:form.querySelector('input[placeholder*="Albert"]')?.value?.trim()||'',country:form.querySelector('input[placeholder*="República"]')?.value?.trim()||'',nuid:form.querySelector('input[placeholder*="R17-"]')?.value?.trim()||'',at:Date.now()};
    setTimeout(savePendingCommission,700);setTimeout(savePendingCommission,1400);
  },true);
}
async function savePendingCommission(){
  const p=pendingCommission;if(!p||Date.now()-p.at>5000||!p.commissionId)return;
  const mid=modelId();if(!mid)return;
  let q=supabase.from('scoreboard_delegates').select('id,commission_id').eq('model_id',mid).eq('nombre',p.name).eq('pais',p.country);
  q=p.nuid?q.eq('nuid',p.nuid):q.is('nuid',null);
  const {data}=await q.order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(!data)return;
  if(data.commission_id!==p.commissionId)await supabase.from('scoreboard_delegates').update({commission_id:p.commissionId,updated_at:new Date().toISOString()}).eq('id',data.id);
  pendingCommission=null;
}

function findEvaluationSelectors(){
  const delegateSelect=[...document.querySelectorAll('select')].find(s=>/Delegado\/a/i.test(labelText(s.closest('label'))));
  const commissionSelect=[...document.querySelectorAll('select')].find(s=>isCommissionSelect(s)&&!s.closest('.r17-new-delegate-commission'));
  return {delegateSelect,commissionSelect};
}
let syncingEvaluation=false;
async function syncEvaluationCommission(){
  const {delegateSelect,commissionSelect}=findEvaluationSelectors();if(!delegateSelect||!commissionSelect||syncingEvaluation)return;
  syncingEvaluation=true;
  commissionSelect.disabled=true;commissionSelect.classList.add('r17-auto-commission');
  const visibleInput=commissionSelect.closest('label')?.querySelector('.r17-commission-input');
  if(visibleInput){visibleInput.disabled=true;visibleInput.readOnly=true;visibleInput.classList.add('r17-auto-commission');}
  const id=delegateSelect.value;
  if(!id){commissionSelect.value='';commissionSelect.dispatchEvent(new Event('change',{bubbles:true}));syncingEvaluation=false;return;}
  const {data}=await supabase.from('scoreboard_delegates').select('commission_id').eq('id',id).maybeSingle();
  const value=data?.commission_id||'';
  commissionSelect.value=value;
  commissionSelect.dispatchEvent(new Event('change',{bubbles:true}));
  const label=commissionSelect.closest('label');
  if(label){let help=label.querySelector('.r17-auto-commission-help');if(!help){help=document.createElement('small');help.className='r17-auto-commission-help';help.style.cssText='display:block;margin-top:5px;color:#667085;font-size:10px;';label.appendChild(help);}help.textContent=value?'Comisión asignada al crear el delegado.':'Este delegado todavía no tiene una comisión asignada.';}
  syncingEvaluation=false;
}
function observeEvaluationSelection(){
  const {delegateSelect}=findEvaluationSelectors();
  if(delegateSelect&&!delegateSelect.dataset.r17CommissionSync){delegateSelect.dataset.r17CommissionSync='1';delegateSelect.addEventListener('change',()=>setTimeout(syncEvaluationCommission,0));}
  syncEvaluationCommission();
}

function install(){ensureCommissionStyles();document.querySelectorAll('select').forEach(installAutocomplete);ensureDelegateCommissionField();observeEvaluationSelection();}
captureDelegateSubmit();
const observer=new MutationObserver(install);
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('load',install);
setTimeout(install,100);setTimeout(install,500);setTimeout(install,1200);setInterval(install,1000);
