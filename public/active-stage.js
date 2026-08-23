(() => {
  const STAGES = [
    { id: 'stage-1', label: 'Etapa 1', dates: '22 ago — 03 sep', status: 'ACTIVA' },
    { id: 'stage-2', label: 'Etapa 2', dates: '04 sep — 17 sep', status: 'PRÓXIMA' },
    { id: 'stage-3', label: 'Etapa 3', dates: '18 sep — 01 oct', status: 'PRÓXIMA' },
  ];

  const style = document.createElement('style');
  style.textContent = `
    .r17-stage-wrap{position:relative;display:inline-block}
    .r17-stage-trigger{display:flex;align-items:center;gap:9px;border:1px solid rgba(7,33,68,.10);background:#fff;border-radius:12px;padding:7px 10px;cursor:pointer;color:inherit;font:inherit;box-shadow:0 2px 10px rgba(7,33,68,.05)}
    .r17-stage-trigger:hover{border-color:rgba(47,111,237,.28);box-shadow:0 4px 14px rgba(7,33,68,.08)}
    .r17-stage-copy{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
    .r17-stage-copy small{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.58}
    .r17-stage-copy strong{font-size:12px;margin-top:2px}
    .r17-stage-status{font-size:9px;font-weight:800;letter-spacing:.05em;border-radius:999px;padding:4px 7px;background:#eef1f5;color:#667085}
    .r17-stage-status.active{background:#e7f7ed;color:#16834b}
    .r17-stage-chevron{transition:transform .18s ease}
    .r17-stage-chevron.open{transform:rotate(180deg)}
    .r17-stage-menu{position:absolute;right:0;top:calc(100% + 8px);width:230px;background:#fff;border:1px solid rgba(7,33,68,.10);border-radius:14px;padding:6px;box-shadow:0 14px 35px rgba(7,33,68,.16);z-index:1000}
    .r17-stage-option{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;background:transparent;border-radius:10px;padding:10px;cursor:pointer;text-align:left;color:#172033}
    .r17-stage-option:hover{background:#f4f7fb}
    .r17-stage-option.selected{background:#eef5ff}
    .r17-stage-option-copy{display:flex;flex-direction:column;gap:3px}
    .r17-stage-option-copy strong{font-size:12px}
    .r17-stage-option-copy small{font-size:11px;opacity:.62}
    .r17-stage-check{font-weight:800;color:#2f6fed}
  `;
  document.head.appendChild(style);

  let selectedId = 'stage-1';
  let open = false;

  const render = () => {
    const target = document.querySelector('.period');
    if (!target || target.dataset.r17StageReady === 'true') return;
    target.dataset.r17StageReady = 'true';
    target.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'r17-stage-wrap';
    target.appendChild(wrap);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'r17-stage-trigger';
    wrap.appendChild(trigger);

    const menu = document.createElement('div');
    menu.className = 'r17-stage-menu';
    menu.hidden = true;
    wrap.appendChild(menu);

    const draw = () => {
      const stage = STAGES.find(item => item.id === selectedId) || STAGES[0];
      trigger.innerHTML = `<span class="r17-stage-copy"><small>Etapa activa</small><strong>${stage.dates}</strong></span><span class="r17-stage-status ${stage.status === 'ACTIVA' ? 'active' : ''}">${stage.status}</span><span class="r17-stage-chevron ${open ? 'open' : ''}">⌄</span>`;
      menu.hidden = !open;
      menu.innerHTML = STAGES.map(item => `<button type="button" class="r17-stage-option ${item.id === selectedId ? 'selected' : ''}" data-stage="${item.id}"><span class="r17-stage-option-copy"><strong>${item.label}</strong><small>${item.dates} · ${item.status}</small></span><span class="r17-stage-check">${item.id === selectedId ? '✓' : ''}</span></button>`).join('');
    };

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      open = !open;
      draw();
    });

    menu.addEventListener('click', event => {
      const option = event.target.closest('[data-stage]');
      if (!option) return;
      selectedId = option.dataset.stage;
      open = false;
      draw();
    });

    document.addEventListener('click', event => {
      if (open && !wrap.contains(event.target)) {
        open = false;
        draw();
      }
    });

    draw();
  };

  const observer = new MutationObserver(render);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
