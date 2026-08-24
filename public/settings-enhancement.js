(() => {
  const KEY = 'r17-settings-v4';
  const defaults = {
    theme: 'light', density: 'comfortable', animations: true,
    showStats: true, showPositions: true, showAverages: true, showProgress: true, order: 'score'
  };

  const normalize = (value) => {
    if (!value || typeof value !== 'object') return { ...defaults };
    return { ...defaults, ...value, theme: ['light', 'dark', 'system'].includes(value.theme) ? value.theme : 'light' };
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
      // Migrate only non-theme preferences; always start in light mode.
      const old = JSON.parse(localStorage.getItem('r17-settings-v3') || localStorage.getItem('r17-settings-v2') || '{}');
      const migrated = normalize({ ...old, theme: 'light' });
      localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      return { ...defaults };
    }
  };

  let settings = load();
  let pending = { ...settings };

  function apply(s) {
    const root = document.documentElement;
    const theme = ['light', 'dark', 'system'].includes(s.theme) ? s.theme : 'light';
    root.dataset.r17Theme = theme;
    root.dataset.r17Density = s.density || 'comfortable';
    root.dataset.r17Animations = s.animations ? 'on' : 'off';
    root.dataset.r17ShowStats = s.showStats ? 'on' : 'off';
    root.dataset.r17ShowPositions = s.showPositions ? 'on' : 'off';
    root.dataset.r17ShowAverages = s.showAverages ? 'on' : 'off';
    root.dataset.r17ShowProgress = s.showProgress ? 'on' : 'off';
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  }

  function save() {
    settings = normalize({ ...pending });
    localStorage.setItem(KEY, JSON.stringify(settings));
    apply(settings);
    const state = document.querySelector('[data-r17-save-state]');
    if (state) {
      state.textContent = '✓ Cambios guardados correctamente.';
      state.dataset.visible = '1';
    }
    const button = document.querySelector('[data-r17-save-settings]');
    if (button) button.disabled = true;
  }

  function markUnsaved() {
    const button = document.querySelector('[data-r17-save-settings]');
    if (button) button.disabled = false;
    const state = document.querySelector('[data-r17-save-state]');
    if (state) {
      state.textContent = 'Cambios sin guardar.';
      state.dataset.visible = '1';
    }
  }

  function option(label, value, options, key) {
    const wrap = document.createElement('label');
    wrap.className = 'r17-setting-control';
    const title = document.createElement('span'); title.textContent = label;
    const select = document.createElement('select');
    options.forEach(([v, text]) => { const o = document.createElement('option'); o.value = v; o.textContent = text; select.appendChild(o); });
    select.value = value;
    select.addEventListener('change', () => { pending[key] = select.value; markUnsaved(); });
    wrap.append(title, select);
    return wrap;
  }

  function toggle(label, key) {
    const wrap = document.createElement('label'); wrap.className = 'r17-setting-toggle';
    const text = document.createElement('span'); text.textContent = label;
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!pending[key];
    input.addEventListener('change', () => { pending[key] = input.checked; markUnsaved(); });
    const visual = document.createElement('i'); wrap.append(text, input, visual);
    return wrap;
  }

  function card(title, description, controls) {
    const el = document.createElement('div'); el.className = 'r17-settings-card';
    const head = document.createElement('div'); head.className = 'r17-settings-card-head';
    const h = document.createElement('h3'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = description;
    head.append(h, p); el.appendChild(head);
    const body = document.createElement('div'); body.className = 'r17-settings-card-body'; controls.forEach(c => body.appendChild(c));
    el.appendChild(body); return el;
  }

  function saveControls() {
    const row = document.createElement('div'); row.className = 'r17-settings-save-row';
    const state = document.createElement('span'); state.className = 'r17-settings-save-state'; state.dataset.r17SaveState = '1'; state.dataset.visible = '0'; state.textContent = 'Los cambios se guardan al pulsar el botón.';
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'r17-settings-save-btn'; button.dataset.r17SaveSettings = '1'; button.textContent = 'Guardar cambios'; button.disabled = true;
    button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); save(); });
    row.append(state, button); return row;
  }

  function render() {
    const heading = [...document.querySelectorAll('h1')].find(x => x.textContent.trim() === 'Configuración');
    if (!heading) return;
    const section = heading.closest('section'); if (!section) return;
    const grid = section.querySelector('.grid-eval'); if (!grid || grid.dataset.r17Enhanced === '1') return;
    grid.dataset.r17Enhanced = '1';
    const left = grid.querySelector('.eval-card'); if (!left) return;

    const oldList = left.querySelector('.settings-list'); if (oldList) oldList.remove();
    const oldTitle = left.querySelector('.section-title'); if (oldTitle) oldTitle.remove();
    pending = { ...settings };

    const title = document.createElement('div'); title.className = 'r17-settings-title';
    const h = document.createElement('h2'); h.textContent = 'Centro de configuración';
    const p = document.createElement('p'); p.textContent = 'Elige tus opciones y pulsa Guardar cambios para aplicarlas.';
    title.append(h, p); left.prepend(title);

    const cards = document.createElement('div'); cards.className = 'r17-settings-grid';
    cards.append(
      card('🎨 Apariencia', 'Tema, densidad y movimiento de la interfaz.', [
        option('Tema', pending.theme, [['light','Claro'],['dark','Oscuro'],['system','Automático']], 'theme'),
        option('Densidad', pending.density, [['comfortable','Cómoda'],['compact','Compacta']], 'density'),
        toggle('Animaciones suaves', 'animations')
      ]),
      card('🏆 ScoreBoard', 'Controla qué información aparece en resultados.', [
        toggle('Mostrar estadísticas superiores', 'showStats'),
        toggle('Mostrar posiciones', 'showPositions'),
        toggle('Mostrar promedios', 'showAverages'),
        toggle('Mostrar barras de progreso', 'showProgress'),
        option('Orden del ranking', pending.order, [['score','Mayor puntuación'],['name','Nombre']], 'order')
      ])
    );
    left.appendChild(cards);
    left.appendChild(saveControls());
  }

  apply(settings);

  // Global delegation makes the save action reliable even when React replaces part of the DOM.
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-r17-save-settings]');
    if (button) { event.preventDefault(); event.stopPropagation(); save(); return; }
    setTimeout(render, 0);
  });

  const observer = new MutationObserver(() => render());
  observer.observe(document.body, { childList: true, subtree: true });
  render();
})();
