const EXPORT_ID = 'r17-general-export-actions';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function activeModelName() {
  const select = document.querySelector('#r17-model-selector select');
  if (!select) return 'Regional 17';
  const option = select.options[select.selectedIndex];
  return option?.textContent?.trim() || 'Regional 17';
}

function getTableHtml() {
  const table = document.querySelector('.general-table');
  if (!table) throw new Error('La matriz de Vista general todavía no está cargada.');
  return table.outerHTML;
}

function exportExcel() {
  try {
    const table = getTableHtml();
    const model = activeModelName();
    const title = `Rúbrica Oficial PLE-RD · ${model}`;
    const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${table}</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.replace(/[^a-z0-9áéíóúüñ _.-]/gi, '_')}_vista_general.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error(error);
    alert(error.message || 'No se pudo exportar a Excel.');
  }
}

function exportPdf() {
  const table = document.querySelector('.general-table');
  if (!table) {
    alert('La matriz de Vista general todavía no está cargada.');
    return;
  }

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '100%';
  printFrame.style.bottom = '100%';
  printFrame.style.width = '1px';
  printFrame.style.height = '1px';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentDocument;
  const model = activeModelName();
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(model)} · Vista general</title><style>
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#172333;margin:0;font-size:8px}
    h1{font-size:18px;margin:0 0 4px} .meta{font-size:9px;color:#657083;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;table-layout:fixed} th,td{border:1px solid #cfd7e2;padding:5px 4px;text-align:center;vertical-align:middle;word-break:break-word}
    thead th{background:#edf3fb;font-weight:700} thead th.group{background:#dce9fa;font-size:9px} tbody td:nth-child(2){text-align:left;font-weight:700} tbody td:nth-child(3){text-align:left}
    tfoot td{background:#f5f7fa;font-weight:700}.total-cell,.tfoot-total{font-weight:800;background:#e8f0ff}
  </style></head><body><h1>Rúbrica Oficial PLE-RD · Regional 17</h1><div class="meta">${escapeHtml(model)} · Vista general de evaluación</div>${table.outerHTML}</body></html>`);
  doc.close();

  const cleanup = () => setTimeout(() => printFrame.remove(), 500);
  printFrame.onload = () => {
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } finally {
        cleanup();
      }
    }, 250);
  };
}

function installButtons() {
  const actions = document.querySelector('.general-actions');
  if (!actions || actions.querySelector(`#${EXPORT_ID}`)) return;
  const wrap = document.createElement('div');
  wrap.id = EXPORT_ID;
  wrap.className = 'general-export-actions';
  wrap.innerHTML = '<button type="button" class="btn export-btn excel" title="Exportar vista general a Excel">Excel</button><button type="button" class="btn export-btn pdf" title="Exportar vista general a PDF">PDF</button>';
  actions.insertBefore(wrap, actions.firstChild);
  wrap.querySelector('.excel').addEventListener('click', exportExcel);
  wrap.querySelector('.pdf').addEventListener('click', exportPdf);
}

const observer = new MutationObserver(installButtons);
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', installButtons);
setInterval(installButtons, 700);
