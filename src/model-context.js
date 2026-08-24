import { supabase } from './lib/supabase';
import { listModels, listDistricts, listPeriods, createModel, updateModel, deleteModel, listCommissions, createCommission, updateCommission, deleteCommission, createPeriod, updatePeriod, deletePeriod, listUsers, updateUserRole } from './lib/evaluations';

const MODEL_KEY='r17:modelId';
const MODEL_HOST='r17-model-context';
const CONFIG_HOST='r17-config-center';
const roles=['admin','coordinador','evaluador','voluntario'];

const esc=(v='')=>String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const getSelected=()=>localStorage.getItem(MODEL_KEY)||'';
const setSelected=(id)=>{localStorage.setItem(MODEL_KEY,id);window.dispatchEvent(new CustomEvent('r17:model-changed',{detail:{id}}));window.location.reload();};

async function currentUser(){ const {data}=await supabase.auth.getSession(); return data.session?.user||null; }
async function ensureModel(){
  if(!supabase)return [];
  const models=await listModels();
  const current=getSelected();
  if(!current && models[0]) localStorage.setItem(MODEL_KEY,models[0].id);
  else if(current && !models.some(m=>m.id===current) && models[0]) localStorage.setItem(MODEL_KEY,models[0].id);
  return models;
}

function addStyles(){
 if(document.getElementById('r17-context-style'))return;
 const s=document.createElement('style');s.id='r17-context-style';s.textContent=`
 .r17-model-box{display:flex;align-items:center;gap:8px}.r17-model-label{font-size:9px;color:#8a94a3;font-weight:700}.r17-model-select{height:34px;min-width:240px;max-width:360px;border:1px solid #dce3eb;border-radius:9px;background:#fff;color:#2d3748;padding:0 10px;font-size:10px;font-weight:700;outline:none}.r17-model-select:focus{border-color:#9fbbf2;box-shadow:0 0 0 3px rgba(47,111,237,.07)}
 .r17-config-shell{margin-top:8px}.r17-config-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.r17-config-tab{border:1px solid #dfe6ef;background:#fff;color:#697587;border-radius:9px;padding:9px 12px;font-size:10px;font-weight:750;cursor:pointer}.r17-config-tab.active{background:#eaf2ff;border-color:#cfe0fa;color:#2f6fed}.r17-config-card{background:#fff;border:1px solid #e1e7ef;border-radius:14px;box-shadow:0 8px 22px rgba(28,39,58,.045);overflow:hidden}.r17-config-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid #edf0f4}.r17-config-head h3{margin:0;font-size:14px;color:#273142}.r17-config-head p{margin:4px 0 0;font-size:10px;color:#8a94a3}.r17-config-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px 18px;border-bottom:1px solid #edf0f4;background:#fbfcfe}.r17-config-form label{font-size:9px;font-weight:700;color:#606a78}.r17-config-form input,.r17-config-form select{width:100%;margin-top:6px;border:1px solid #dce3eb;border-radius:8px;background:#fff;color:#273142;padding:9px 10px;font-size:10px;outline:none}.r17-config-form .wide{grid-column:1/-1}.r17-config-list{padding:10px 14px}.r17-config-row{display:grid;grid-template-columns:minmax(0,1fr) 140px 120px auto;align-items:center;gap:10px;padding:11px 8px;border-bottom:1px solid #f0f2f5}.r17-config-row:last-child{border-bottom:0}.r17-config-row strong{font-size:10px;color:#2d3748}.r17-config-row span{display:block;font-size:8px;color:#8993a1;margin-top:2px}.r17-config-actions{display:flex;gap:5px;justify-content:flex-end}.r17-config-empty{padding:30px;text-align:center;color:#8a94a3;font-size:10px}.r17-config-badge{display:inline-flex;padding:4px 7px;border-radius:99px;background:#eef4ff;color:#2f6fed;font-size:8px;font-weight:750}.r17-config-danger{border:1px solid #f0c8c4;background:#fff5f4;color:#b83c35}.r17-model-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}.r17-model-meta span{background:#f5f7fa;border:1px solid #e6eaf0;border-radius:99px;padding:3px 6px;font-size:7px;color:#697587}.r17-config-note{padding:11px 14px;margin:0 14px 12px;border-radius:9px;background:#f8fbff;border:1px solid #e0eafb;color:#637187;font-size:9px}
 @media(max-width:850px){.r17-model-select{min-width:170px}.r17-config-form{grid-template-columns:1fr}.r17-config-row{grid-template-columns:1fr}.r17-config-actions{justify-content:flex-start}.r17-model-box{display:none}}
 `;document.head.appendChild(s);
}

async function installModelSelector(){
 addStyles();
 const top=document.querySelector('.top-actions'); if(!top||document.getElementById(MODEL_HOST))return;
 const models=await ensureModel(); if(!models.length)return;
 const host=document.createElement('div');host.id=MODEL_HOST;host.className='r17-model-box';
 const label=document.createElement('span');label.className='r17-model-label';label.textContent='MODELO';
 const select=document.createElement('select');select.className='r17-model-select';select.title='Modelo activo';
 const cur=getSelected();
 select.innerHTML=models.map(m=>`<option value="${esc(m.id)}" ${m.id===cur?'selected':''}>${esc(m.nombre)} · ${esc(m.distrito)}</option>`).join('');
 select.addEventListener('change',e=>setSelected(e.target.value));host.append(label,select);
 const period=top.querySelector('.period'); top.insertBefore(host,period||top.firstChild);
}

function openTab(tab){ document.querySelectorAll('.r17-config-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); document.querySelectorAll('.r17-config-pane').forEach(p=>p.style.display=p.dataset.pane===tab?'block':'none'); }

async function installConfigCenter(){
 addStyles();
 const list=document.querySelector('.settings-list'); if(!list)return;
 let host=document.getElementById(CONFIG_HOST); if(host)return;
 host=document.createElement('div');host.id=CONFIG_HOST;host.className='r17-config-shell';
 list.replaceWith(host);
 host.innerHTML=`<div class="r17-config-tabs"><button class="r17-config-tab active" data-tab="models">Modelos</button><button class="r17-config-tab" data-tab="commissions">Comisiones</button><button class="r17-config-tab" data-tab="periods">Períodos evaluatorios</button><button class="r17-config-tab" data-tab="users">Usuarios y roles</button></div><div class="r17-config-pane" data-pane="models"></div><div class="r17-config-pane" data-pane="commissions" style="display:none"></div><div class="r17-config-pane" data-pane="periods" style="display:none"></div><div class="r17-config-pane" data-pane="users" style="display:none"></div>`;
 host.querySelectorAll('.r17-config-tab').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.tab)));
 await renderModels(host.querySelector('[data-pane=models]'),host);
 await renderCommissions(host.querySelector('[data-pane=commissions]'),host);
 await renderPeriods(host.querySelector('[data-pane=periods]'),host);
 await renderUsers(host.querySelector('[data-pane=users]'),host);
}

async function renderModels(pane,root){
 const [models,districts,periods]=await Promise.all([listModels(),listDistricts(),listPeriods()]);
 pane.innerHTML=`<div class="r17-config-card"><div class="r17-config-head"><div><h3>Modelos / eventos</h3><p>Cada modelo queda aislado por distrito, incluso cuando hay dos en el mismo distrito.</p></div></div><form class="r17-config-form" id="r17-model-form"><label>Nombre del modelo<input name="nombre" required placeholder="Ej. Modelo Distrital 17-04 — Agosto"/></label><label>Distrito<select name="distrito_id" required>${districts.map(d=>`<option value="${esc(d.id)}">${esc(d.id)} · ${esc(d.nombre)}</option>`).join('')}</select></label><label>Período<select name="periodo_id">${periods.map(p=>`<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('')}</select></label><label>Fecha<input type="date" name="fecha"/></label><label>Estado<select name="estado"><option value="borrador">Borrador</option><option value="activo">Activo</option><option value="finalizado">Finalizado</option><option value="archivado">Archivado</option></select></label><label class="wide">Descripción<input name="descripcion" placeholder="Descripción breve del modelo"/></label><div class="wide"><button class="btn primary">Crear modelo</button></div></form><div class="r17-config-list">${models.length?models.map(m=>`<div class="r17-config-row"><div><strong>${esc(m.nombre)}</strong><span>${esc(m.descripcion||'Sin descripción')}</span><div class="r17-model-meta"><span>${esc(m.distrito)}</span><span>${esc(m.periodo||'Sin período')}</span><span>${esc(m.estado)}</span></div></div><div><span class="r17-config-badge">${m.id===getSelected()?'ACTIVO':'Modelo'}</span></div><div></div><div class="r17-config-actions"><button class="btn secondary" data-select-model="${m.id}">Usar</button><button class="btn secondary" data-edit-model="${m.id}">Editar</button><button class="btn r17-config-danger" data-del-model="${m.id}">Eliminar</button></div></div>`).join(''):'<div class="r17-config-empty">No hay modelos.</div>'}</div></div>`;
 pane.querySelector('#r17-model-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await createModel({nombre:f.get('nombre'),descripcion:f.get('descripcion'),distrito_id:f.get('distrito_id'),periodo_id:f.get('periodo_id')||null,fecha:f.get('fecha')||null,estado:f.get('estado')});await renderModels(pane,root);}catch(err){alert(err.message);}});
 pane.querySelectorAll('[data-select-model]').forEach(b=>b.addEventListener('click',()=>setSelected(b.dataset.selectModel)));
 pane.querySelectorAll('[data-del-model]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('¿Eliminar este modelo y sus datos?'))return;try{await deleteModel(b.dataset.delModel);if(getSelected()===b.dataset.delModel)localStorage.removeItem(MODEL_KEY);await renderModels(pane,root);}catch(err){alert(err.message);}}));
 pane.querySelectorAll('[data-edit-model]').forEach(b=>b.addEventListener('click',async()=>{const model=models.find(m=>m.id===b.dataset.editModel);if(!model)return;const nombre=prompt('Nombre del modelo',model.nombre);if(nombre===null)return;const estado=prompt('Estado: borrador, activo, finalizado o archivado',model.estado);if(estado===null)return;try{await updateModel(model.id,{nombre,estado});await renderModels(pane,root);}catch(err){alert(err.message);}}));
}

async function renderCommissions(pane,root){
 const models=await listModels();const current=models.find(m=>m.id===getSelected())||models[0];const rows=await listCommissions(current?.id);
 pane.innerHTML=`<div class="r17-config-card"><div class="r17-config-head"><div><h3>Comisiones del modelo activo</h3><p>${current?esc(current.nombre):'Selecciona un modelo'}</p></div></div><p class="r17-config-note">Las comisiones se guardan dentro del modelo activo; dos modelos del mismo distrito pueden tener comisiones diferentes.</p><form class="r17-config-form" id="r17-commission-form"><label>Nombre<input name="nombre" required placeholder="Ej. Consejo de Seguridad"/></label><label>Orden<input name="orden" type="number" min="0" value="0"/></label><label class="wide">Descripción<input name="descripcion" placeholder="Descripción opcional"/></label><div class="wide"><button class="btn primary" ${current?'':'disabled'}>Añadir comisión</button></div></form><div class="r17-config-list">${rows.length?rows.map(c=>`<div class="r17-config-row"><div><strong>${esc(c.nombre)}</strong><span>${esc(c.descripcion||'Sin descripción')}</span></div><div></div><div></div><div class="r17-config-actions"><button class="btn secondary" data-edit-commission="${c.id}">Editar</button><button class="btn r17-config-danger" data-del-commission="${c.id}">Eliminar</button></div></div>`).join(''):'<div class="r17-config-empty">Este modelo todavía no tiene comisiones.</div>'}</div></div>`;
 pane.querySelector('#r17-commission-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await createCommission({model_id:current?.id,nombre:f.get('nombre'),descripcion:f.get('descripcion'),orden:Number(f.get('orden')||0)});await renderCommissions(pane,root);}catch(err){alert(err.message);}});
 pane.querySelectorAll('[data-del-commission]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('¿Eliminar esta comisión?'))return;try{await deleteCommission(b.dataset.delCommission);await renderCommissions(pane,root);}catch(err){alert(err.message);}}));
 pane.querySelectorAll('[data-edit-commission]').forEach(b=>b.addEventListener('click',async()=>{const c=rows.find(x=>x.id===b.dataset.editCommission);if(!c)return;const nombre=prompt('Nombre de la comisión',c.nombre);if(nombre===null)return;try{await updateCommission(c.id,{nombre});await renderCommissions(pane,root);}catch(err){alert(err.message);}}));
}

async function renderPeriods(pane,root){
 const rows=await listPeriods();
 pane.innerHTML=`<div class="r17-config-card"><div class="r17-config-head"><div><h3>Períodos evaluatorios</h3><p>Controla las etapas en las que trabajan los modelos.</p></div></div><form class="r17-config-form" id="r17-period-form"><label>Nombre<input name="nombre" required placeholder="Ej. Regional 17 · Agosto 2026"/></label><label>Estado<select name="estado"><option value="borrador">Borrador</option><option value="activo">Activo</option><option value="finalizado">Finalizado</option></select></label><label>Fecha inicio<input type="date" name="fecha_inicio"/></label><label>Fecha fin<input type="date" name="fecha_fin"/></label><label class="wide">Descripción<input name="descripcion" placeholder="Descripción del período"/></label><div class="wide"><button class="btn primary">Crear período</button></div></form><div class="r17-config-list">${rows.length?rows.map(p=>`<div class="r17-config-row"><div><strong>${esc(p.nombre)}</strong><span>${esc(p.descripcion||'Sin descripción')}</span></div><div><span class="r17-config-badge">${esc(p.estado)}</span></div><div></div><div class="r17-config-actions"><button class="btn secondary" data-edit-period="${p.id}">Editar</button><button class="btn r17-config-danger" data-del-period="${p.id}">Eliminar</button></div></div>`).join(''):'<div class="r17-config-empty">No hay períodos.</div>'}</div></div>`;
 pane.querySelector('#r17-period-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await createPeriod({nombre:f.get('nombre'),descripcion:f.get('descripcion'),estado:f.get('estado'),fecha_inicio:f.get('fecha_inicio')||null,fecha_fin:f.get('fecha_fin')||null});await renderPeriods(pane,root);}catch(err){alert(err.message);}});
 pane.querySelectorAll('[data-del-period]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('¿Eliminar este período?'))return;try{await deletePeriod(b.dataset.delPeriod);await renderPeriods(pane,root);}catch(err){alert(err.message);}}));
 pane.querySelectorAll('[data-edit-period]').forEach(b=>b.addEventListener('click',async()=>{const p=rows.find(x=>x.id===b.dataset.editPeriod);if(!p)return;const nombre=prompt('Nombre del período',p.nombre);if(nombre===null)return;try{await updatePeriod(p.id,{nombre});await renderPeriods(pane,root);}catch(err){alert(err.message);}}));
}

async function renderUsers(pane){
 const [users,districts]=await Promise.all([listUsers(),listDistricts()]);
 pane.innerHTML=`<div class="r17-config-card"><div class="r17-config-head"><div><h3>Usuarios y roles</h3><p>Administra los roles y distritos de las cuentas existentes.</p></div></div><p class="r17-config-note">La creación de credenciales se mantiene en Supabase Auth; aquí se administra el rol funcional y el distrito de cada cuenta.</p><div class="r17-config-list">${users.map(u=>`<div class="r17-config-row"><div><strong>${esc(u.full_name||'Sin nombre')}</strong><span>${esc(u.email||'')}</span></div><div><select data-role-user="${u.id}">${roles.map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r}</option>`).join('')}</select></div><div><select data-district-user="${u.id}"><option value="">Sin distrito</option>${districts.map(d=>`<option value="${d.id}" ${u.distrito_id===d.id?'selected':''}>${d.id} · ${d.nombre}</option>`).join('')}</select></div><div class="r17-config-actions"><button class="btn secondary" data-save-user="${u.id}">Guardar</button></div></div>`).join('')}</div></div>`;
 pane.querySelectorAll('[data-save-user]').forEach(b=>b.addEventListener('click',async()=>{const id=b.dataset.saveUser;const role=pane.querySelector(`[data-role-user="${id}"]`).value;const distrito_id=pane.querySelector(`[data-district-user="${id}"]`).value||null;try{await updateUserRole(id,{role,distrito_id});b.textContent='Guardado';setTimeout(()=>b.textContent='Guardar',1200);}catch(err){alert(err.message);}}));
}

async function boot(){
 try{ if(!supabase)return; addStyles(); const {data}=await supabase.auth.getSession(); if(!data.session)return; await ensureModel(); }
 catch(e){console.error('R17 model context',e);}
}

const observer=new MutationObserver(async()=>{ await installModelSelector(); const settings=document.querySelector('.settings-list'); if(settings&&!document.getElementById(CONFIG_HOST)) await installConfigCenter(); });
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('load',boot);setTimeout(boot,250);setInterval(async()=>{await installModelSelector();const settings=document.querySelector('.settings-list');if(settings&&!document.getElementById(CONFIG_HOST))await installConfigCenter();},1200);
