(() => {
  const KEY = 'r17-settings-v1';
  const getSettings = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  };
  const setTheme = (theme) => {
    const next = { theme: theme === 'dark' ? 'dark' : 'light', ...getSettings() };
    next.theme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(KEY, JSON.stringify(next));
    document.documentElement.dataset.r17Theme = next.theme;
    document.documentElement.style.colorScheme = next.theme;
    document.documentElement.classList.toggle('r17-theme-dark', next.theme === 'dark');
    document.documentElement.classList.toggle('r17-theme-light', next.theme === 'light');
    document.querySelectorAll('.r17-setting-control').forEach(row => {
      const label = row.querySelector('span');
      const select = row.querySelector('select');
      if (label?.textContent.trim() === 'Tema' && select) select.value = next.theme;
    });
    const summarySmall = document.querySelector('.summary-total small');
    const summaryHint = document.querySelector('.summary .hint');
    if (summarySmall) summarySmall.textContent = next.theme === 'dark' ? 'MODO OSCURO' : 'MODO CLARO';
    if (summaryHint) summaryHint.textContent = next.theme === 'dark' ? 'La interfaz está utilizando el modo oscuro.' : 'La interfaz está utilizando el modo claro.';
  };
  const bind = () => {
    document.querySelectorAll('.r17-setting-control').forEach(row => {
      const label = row.querySelector('span');
      const select = row.querySelector('select');
      if (!label || !select || label.textContent.trim() !== 'Tema' || select.dataset.themeFix === '1') return;
      select.dataset.themeFix = '1';
      select.addEventListener('change', () => setTheme(select.value));
    });
    const settings = getSettings();
    setTheme(settings.theme === 'dark' ? 'dark' : 'light');
  };
  const observer = new MutationObserver(bind);
  const start = () => { bind(); observer.observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
