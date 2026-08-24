(() => {
  const KEY = 'r17-settings-v4';
  const validThemes = ['light', 'dark', 'system'];

  const getStored = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      return data && validThemes.includes(data.theme) ? data : { theme: 'light' };
    } catch {
      return { theme: 'light' };
    }
  };

  let saved = getStored();
  let pending = { ...saved };

  const applyTheme = (theme) => {
    const value = validThemes.includes(theme) ? theme : 'light';
    document.documentElement.dataset.r17Theme = value;
    document.documentElement.style.colorScheme = value === 'dark' ? 'dark' : 'light';
    return value;
  };

  const persist = () => {
    saved = { ...saved, ...pending };
    localStorage.setItem(KEY, JSON.stringify(saved));
    applyTheme(saved.theme);
    updateSaveButton();
    updateStatus('Cambios guardados correctamente.');
  };

  const updateStatus = (message) => {
    const state = document.querySelector('[data-r17-save-state]');
    if (!state) return;
    state.textContent = message;
    state.dataset.visible = '1';
  };

  const updateSaveButton = () => {
    const button = document.querySelector('[data-r17-save-settings]');
    if (!button) return;
    button.disabled = pending.theme === saved.theme;
  };

  const wire = () => {
    const selectors = [...document.querySelectorAll('select')].filter((select) =>
      [...select.options].some((option) => validThemes.includes(option.value))
    );

    const themeSelect = selectors.find((select) => select.closest('.r17-settings-card'));
    if (themeSelect && !themeSelect.dataset.r17ThemeWired) {
      themeSelect.dataset.r17ThemeWired = '1';
      themeSelect.value = pending.theme;
      themeSelect.addEventListener('change', () => {
        pending.theme = themeSelect.value;
        updateSaveButton();
        updateStatus('Tienes cambios sin guardar.');
      });
    }

    const saveButton = document.querySelector('[data-r17-save-settings]');
    if (saveButton && !saveButton.dataset.r17ThemeWired) {
      saveButton.dataset.r17ThemeWired = '1';
      saveButton.addEventListener('click', persist);
    }

    updateSaveButton();
  };

  applyTheme(saved.theme);
  wire();

  const observer = new MutationObserver(wire);
  observer.observe(document.body, { childList: true, subtree: true });
})();
