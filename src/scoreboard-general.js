import { supabase } from './lib/supabase';
import { RUBRIC, RUBRIC_TOTAL } from './data/rubric';

const STYLE_ID = 'r17-scoreboard-general-style';
const APP_ID = 'r17-scoreboard-general';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${APP_ID}{margin-top:16px;background:#fff;border:1px solid #e6e9ef;border-radius:14px;box-shadow:0 7px 24px rgba(28,39,58,.045);overflow:hidden}
    #${APP_ID} .r17-sheet-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid #e7e9ee;background:#fff}
    #${APP_ID} .r17-sheet-head h2{margin:0 0 4px;font-size:15px;color:#242a33}
    #${APP_ID} .r17-sheet-head p{margin:0;color:#6b7280;font-size:10px}
    #${APP_ID} .r17-sheet-badge{color:#2f6fed;background:#eaf1fe;border:1px solid #dce8fd;border-radius:20px;padding:7px 10px;font-size:9px;font-weight:750;white-space:nowrap}
    #${APP_ID} .r17-sheet-wrap{overflow:auto;max-width:100%}
    #${APP_ID} table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;font-size:10px}
    #${APP_ID} th,#${APP_ID} td{border-right:1px solid #edf0f4;border-bottom:1px solid #edf0f4;padding:10px 11px;white-space:nowrap;background:#fff}
    #${APP_ID} thead th{position:sticky;top:0;z-index:3;background:#f8fafc;color:#59616d;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;text-align:center}
    #${APP_ID} thead th:first-child,#${APP_ID} tbody td:first-child{position:sticky;left:0;z-index:4;background:#fff}
    #${APP_ID} thead th:first-child{z-index:5;background:#f8fafc}
    #${APP_ID} tbody tr:hover td{background:#fafbfe}
    #${APP_ID} .r17-rank{width:44px;text-align:center;color:#9ca3af;font-weight:800}
    #${APP_ID} .r17-name{min-width:190px;text-align:left}
    #${APP_ID} .r17-name strong{display:block;color:#303640;font-size:10px}
    #${APP_ID} .r17-name span{display:block;color:#8a919c;margin-top:3px;font-size:8px}
    #${APP_ID} .r17-score{text-align:center;min-width:74px}
    #${APP_ID} .r17-total{background:#f8faff!important;color:#2f6fed;font-weight:800;text-align:center}
    #${APP_ID} .r17-evals{text-align:center;color:#626a76}
    #${APP_ID} .r17-empty{text-align:center;color:#8a919c;padding:40px}
    #${APP_ID} .r17-sheet-foot{padding:11px 16px;color:#8a919c;font-size:9px;background:#fafbfc;border-top:1px solid #edf0f4}
    @media(max-width:800px){#${APP_ID} .r17-sheet-head{align-items:flex-start;flex-direction:column}.r17-sheet-badge{align-self:flex-start}}
  `;
  document.head.appendChild(style);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function aggregate(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const id = row.delegate_id;
    const current = map.get(id) || {
      id,
      name: row.delegates?.name || 'Delegado',
      country: row.delegates?.country || '',
      evaluations: 0,
      criteria: Object.fromEntries(RUBRIC.map((c) => [c.key, []])),
      totals: [],
    };
    current.evaluations += 1;
    current.totals.push(toNumber(row.total));
    const scores = row.scores || {};
    RUBRIC.forEach((criterion) => {
      current.criteria[criterion.key].push(toNumber(scores[criterion.key]));
    });
    map.set(id, current);
  });

  return [...map.values()].map((item) => {
    const criteria = {};
    RUBRIC.forEach((criterion) => {
      const values = item.criteria[criterion.key];
      criteria[criterion.key] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });
    const total = item.totals.length ? item.totals.reduce((a, b) => a + b, 0) / item.totals.length : 0;
    return { ...item, criteria, total };
  }).sort((a, b) => b.total - a.total);
}

async function renderGeneralScoreboard() {
  const heading = [...document.querySelectorAll('h1')].find((el) => el.textContent.trim() === 'ScoreBoard');
  if (!heading) return;

  const content = heading.closest('.content');
  if (!content) return;
  if (document.getElementById(APP_ID)) return;

  const existingTableCard = content.querySelector('.table-card');
  if (!existingTableCard) return;

  ensureStyles();

  let evaluations = [];
  try {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data, error } = await supabase
      .from('evaluations')
      .select('delegate_id,scores,total,delegates(name,country)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    evaluations = data || [];
  } catch (error) {
    console.error('[ScoreBoard general]', error);
    return;
  }

  const rows = aggregate(evaluations);
  const sheet = document.createElement('section');
  sheet.id = APP_ID;
  const headers = RUBRIC.map((criterion) => `<th>${criterion.key}</th>`).join('');
  const body = rows.length
    ? rows.map((row, index) => `
      <tr>
        <td class="r17-rank">${index + 1}</td>
        <td class="r17-name"><strong>${row.name}</strong><span>${row.country}</span></td>
        ${RUBRIC.map((criterion) => `<td class="r17-score">${row.criteria[criterion.key].toFixed(1)}<br><small>/ ${criterion.max}</small></td>`).join('')}
        <td class="r17-total">${row.total.toFixed(1)}<br><small>/ ${RUBRIC_TOTAL}</small></td>
        <td class="r17-evals">${row.evaluations}</td>
      </tr>`).join('')
    : `<tr><td class="r17-empty" colspan="${RUBRIC.length + 4}">Todavía no hay evaluaciones registradas.</td></tr>`;

  sheet.innerHTML = `
    <div class="r17-sheet-head">
      <div><h2>Matriz general de evaluación</h2><p>Vista consolidada de todos los delegados y los criterios de la rúbrica, como una hoja de Excel.</p></div>
      <span class="r17-sheet-badge">${rows.length} delegados · ${evaluations.length} evaluaciones</span>
    </div>
    <div class="r17-sheet-wrap">
      <table>
        <thead><tr><th>#</th><th>Delegado/a</th>${headers}<th>Total</th><th>Evaluaciones</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="r17-sheet-foot">Los valores de cada criterio muestran el promedio del delegado cuando tiene más de una evaluación.</div>
  `;

  existingTableCard.replaceWith(sheet);
}

let lastPath = '';
const observer = new MutationObserver(() => {
  const h = [...document.querySelectorAll('h1')].find((el) => el.textContent.trim() === 'ScoreBoard');
  if (h && lastPath !== location.pathname + h.textContent) {
    lastPath = location.pathname + h.textContent;
    renderGeneralScoreboard();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(renderGeneralScoreboard, 0);
