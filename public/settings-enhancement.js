(() => {
  const KEY = 'r17-settings-v3';
  const defaults = {
    theme: 'light',
    density: 'comfortable',
    animations: true,
    showStats: true,
    showPositions: true,
    showAverages: true,
    showProgress: true,
    order: 'score'
  };

  const load = () => {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (current && typeof current === 'object') return { ...defaults, ...current };

      // Ignore previous theme versions so an old dark preference cannot
      // silently override the new default.
      localStorage.removeItem('r17-settings-v1');
      localStorage.removeItem('r17-settings-v2');
      return { ...defaults };
    } catch {
      return { ...defaults };
    }
  };

  let settings = load();
  let pending = { ...settings };

  const save = () => {
    settings = { ...pending };
    localStorage.setItem(KEY, JSON.stringify(settings));
    apply(settings);
    render();
    showSavedState('Cambios guardados correctamente.');
  };

  function apply(s) {
    const root = document.documentElement;
    const theme = ['light', 'dark', 'system'].includes(s.theme) ? s.theme : 'light';
    root.dataset.r17Theme = theme;
    root.dataset.r17Density = s.density;
    root.dataset.r17Animations = s.animations ? 'on' : 'off';
    root.dataset.r17ShowStats = s.showStats ? 'on' : 'off';
    root.dataset.r17ShowPositions = s.showPositions ? 'on' : 'off';
    root.dataset.r17ShowAverages = s.showAverages ? 'on' : 'off';
    root.dataset.r17ShowProgress = s.showProgress ? 'on' : 'off';
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  }

  function showSavedState(message) {
    const node = document.querySelector('[data-r17-save-state]');
    if (!node) return;
    node.textContent = message;
    node.dataset.visible = '1';
    clearTimeout(showSavedState.timer);
    showSavedState.timer = setTimeout(() => {
      node.dataset.visible = '0';
    }, 2200);
  }

  function option(label, value, options, key) {
    const wrap = document.createElement('label');
    wrap.className = 'r17-setting-control';
    const title = document.createElement('span');
    title.textContent = label;
    const select = document.createElement('select');
    options.forEach(([v, text]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = text;
      select.appendChild(o);
    });
    select.value = value;
    select.addEventListener('change', () => {
      pending[key] = select.value;
      markUnsaved();
    });
    wrap.append(title, select);
    return wrap;
  }

  function toggle(label, key) {
    const wrap = document.createElement('label');
    wrap.className = 'r17-setting-toggle';
    const text = document.createElement('span');
    text.textContent = label;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!valueFor(key);
    input.addEventListener('change', () => {
      pending[key] = input.checked;
      markUnsaved();
    });
    const visual = document.createElement('i');
    wrap.append(text, input, visual);
    return wrap;
  }

  function valueFor(key) {
    return pending[key];
  }

  function markUnsaved() {
    const button = document.querySelector('[data-r17-save-settings]');
    if (button) button.disabled = false;
    const state = document.querySelector('[data-r17-save-state]');
    if (state) {
      state.textContent = 'Tienes cambios sin guardar.';
      state.dataset.visible = '1';
    }
  }

  function card(title, description, controls) {
    const el = document.createElement('div');
    el.className = 'r17-settings-card';
    const head = document.createElement('div');
    head.className = 'r17-settings-card-head';
    const h = document.createElement('h3');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = description;
    head.append(h, p);
    el.appendChild(head);
    const body = document.createElement('div');
    body.className = 'r17-settings-card-body';
    controls.forEach(c => body.appendChild(c));
    el.appendChild(body);
    return el;
  }

  function saveControls() {
    const wrap = document.createElement('div');
    wrap.className = 'r17-settings-save-row';

    const state = document.createElement('span');
    state.className = 'r17-settings-save-state';
    state.dataset.r17SaveState = '1';
    state.dataset.visible = '0';
    state.textContent = 'Los cambios se aplican al guardar.';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'r17-settings-save-btn';
    button.dataset.r17SaveSettings = '1';
    button.textContent = 'Guardar cambios';
    button.disabled = true;
    button.addEventListener('click', save);

    wrap.append(state, button);
    return wrap;
  }

  function render() {
    const heading = [...document.querySelectorAll('h1')].find(x => x.textContent.trim() === 'Configuración');
    if (!heading) return;
    const section = heading.closest('section');
    if (!section) return;
    const grid = section.querySelector('.grid-eval');
    if (!grid || grid.dataset.r17Enhanced === '1') return;
    grid.dataset.r17Enhanced = '1';

    const left = grid.querySelector('.eval-card');
    if (!left) return;

    const list = left.querySelector('.settings-list');
    if (list) list.remove();
    const oldTitle = left.querySelector('.section-title');
    if (oldTitle) oldTitle.remove();

    pending = { ...settings };

    const title = document.createElement('div');
    title.className = 'r17-settings-title';
    const h = document.createElement('h2');
    h.textContent = 'Centro de configuración';
    const p = document.createElement('p');
    p.textContent = 'Personaliza la experiencia del ScoreBoard. Los cambios se aplican al pulsar Guardar cambios.';
    title.append(h, p);
    left.prepend(title);

    const cards = document.createElement('div');
    cards.className = 'r17-settings-grid';

    cards.append(
      card('🎨 Apariencia', 'Tema, densidad y movimiento de la interfaz.', [
        option('Tema', pending.theme, [['system','Automático'],['light','Claro'],['dark','Oscuro']], 'theme'),
        option('Densidad', pending.density, [['comfortable','Cómoda'],['compact','Compacta']], 'density'),
        toggle('Animaciones suaves', 'animations')
      ]),
      card('🏆 ScoreBoard', 'Controla qué información aparece en la pantalla de resultados.', [
        toggle('Mostrar estadísticas superiores', 'showStats'),
        toggle('Mostrar posiciones', 'showPositions'),
        toggle('Mostrar promedios', 'showAverages'),
        toggle('Mostrar barras de progreso', 'showProgress'),
        option('Orden del ranking', pending.order, [['score','Mayor puntuación'],['name','Nombre']], 'order')
      ]),
      card('📊 Visualización', 'Ajustes rápidos para una presentación limpia.', [
        toggle('Estadísticas visibles', 'showStats'),
        toggle('Barras de desempeño', 'showProgress'),
        toggle('Animaciones', 'animations')
      ])
    );

    left.appendChild(cards);
    left.appendChild(saveControls());

    const summary = grid.querySelector('.summary');
    if (summary) {
      const hint = summary.querySelector('.hint');
      if (hint) hint.textContent = 'Tus preferencias se guardan localmente en este navegador al pulsar Guardar cambios.';
      const total = summary.querySelector('.summary-total');
      if (total) {
        const strong = total.querySelector('strong');
        const small = total.querySelector('small');
        if (strong) strong.textContent = 'ACTIVO';
        if (small) small.textContent = 'PREFERENCIAS';
      }
    }
  }

  // Aplicar la preferencia guardada al arrancar.
  apply(settings);

  const observer = new MutationObserver(() => {
    if (document.visibilityState !== 'hidden') render();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', () => setTimeout(render, 0));
  window.addEventListener('storage', () => {
    settings = load();
    pending = { ...settings };
    apply(settings);
    render();
  });
})();
