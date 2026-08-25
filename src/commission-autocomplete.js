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
  `;
  document.head.appendChild(style);
}

function isCommissionSelect(select){
  const label=select.closest('label');
  if(!label)return false;
  const directText=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent||'').join(' ').trim();
  return /comisi[oó]n/i.test(directText) || /comisi[oó]n/i.test(label.getAttribute('aria-label')||'');
}

function installOne(select){
  if(!select || select.dataset.commissionAutocomplete==='2' || !isCommissionSelect(select))return;
  select.dataset.commissionAutocomplete='2';
  const wrap=document.createElement('div');
  wrap.className='r17-commission-wrap';
  select.parentNode.insertBefore(wrap,select);
  wrap.appendChild(select);
  select.classList.add('r17-commission-select-hidden');

  const input=document.createElement('input');
  input.type='text';
  input.className='r17-commission-input';
  input.autocomplete='off';
  input.placeholder='Buscar o seleccionar comisión';
  input.setAttribute('aria-label','Comisión');
  wrap.insertBefore(input,select);

  const chevron=document.createElement('span');
  chevron.className='r17-commission-chevron';
  chevron.textContent='▾';
  wrap.appendChild(chevron);

  const menu=document.createElement('div');
  menu.className='r17-commission-menu';
  wrap.appendChild(menu);

  const options=()=>[...select.options].filter(o=>o.value && o.textContent.trim());
  const syncFromSelect=()=>{
    const option=select.options[select.selectedIndex];
    input.value=option?.value?option.textContent.trim():'';
  };
  const choose=(option)=>{
    if(!option)return;
    select.value=option.value;
    input.value=option.textContent.trim();
    select.dispatchEvent(new Event('input',{bubbles:true}));
    select.dispatchEvent(new Event('change',{bubbles:true}));
    menu.classList.remove('open');
  };
  const render=()=>{
    const query=input.value.trim().toLocaleLowerCase('es');
    const filtered=options().filter(o=>!query||o.textContent.toLocaleLowerCase('es').includes(query)).slice(0,20);
    menu.innerHTML='';
    if(!filtered.length){menu.innerHTML='<div class="r17-commission-empty">No hay coincidencias</div>';return;}
    filtered.forEach(option=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='r17-commission-option';
      btn.textContent=option.textContent.trim();
      btn.addEventListener('mousedown',event=>{event.preventDefault();choose(option);input.focus();});
      menu.appendChild(btn);
    });
  };
  input.addEventListener('focus',()=>{render();menu.classList.add('open')});
  input.addEventListener('input',()=>{render();menu.classList.add('open')});
  input.addEventListener('keydown',event=>{
    if(event.key==='Escape'){syncFromSelect();menu.classList.remove('open');}
    if(event.key==='Enter'){
      const first=menu.querySelector('.r17-commission-option');
      if(first){event.preventDefault();first.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));}
    }
  });
  select.addEventListener('change',syncFromSelect);
  syncFromSelect();
}

function installCommissionAutocomplete(){
  ensureCommissionStyles();
  document.querySelectorAll('select').forEach(installOne);
}

const observer=new MutationObserver(installCommissionAutocomplete);
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('load',installCommissionAutocomplete);
setTimeout(installCommissionAutocomplete,100);
setTimeout(installCommissionAutocomplete,500);
setTimeout(installCommissionAutocomplete,1200);
