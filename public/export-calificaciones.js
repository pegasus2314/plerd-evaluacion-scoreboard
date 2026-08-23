(() => {
  const BUTTON_ID = 'export-calificaciones-btn';

  const escapeCsv = (value) => {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    return `"${text.replace(/"/g, '""')}"`;
  };

  const exportTable = () => {
    const table = document.querySelector('.table-card table');
    if (!table) return;

    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
    const rows = [...table.querySelectorAll('tbody tr')].map(tr =>
      [...tr.querySelectorAll('td')].map(td => td.textContent.replace(/\s+/g, ' ').trim())
    );

    if (!headers.length || !rows.length) {
      window.alert('No hay calificaciones disponibles para exportar.');
      return;
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `calificaciones-plerd-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const addButton = () => {
    const card = document.querySelector('.table-card');
    if (!card || card.querySelector(`#${BUTTON_ID}`)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.className = 'btn primary export-calificaciones-btn';
    button.textContent = 'Exportar calificaciones';
    button.title = 'Descargar las calificaciones visibles en CSV';
    button.addEventListener('click', exportTable);

    card.style.position = 'relative';
    card.appendChild(button);
  };

  const observer = new MutationObserver(addButton);
  observer.observe(document.body, { childList: true, subtree: true });
  addButton();
})();
