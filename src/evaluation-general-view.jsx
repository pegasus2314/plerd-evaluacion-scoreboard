import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, ClipboardCheck, RefreshCw, Search, X } from 'lucide-react';
import { RUBRIC, RUBRIC_TOTAL } from './data/rubric';
import { listDelegates, listEvaluations } from './lib/evaluations';
import './evaluation-general-view.css';

const ID = 'r17-general-view-host';
const NAV_ID = 'r17-general-nav';

function GeneralView() {
  const [delegates, setDelegates] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, e] = await Promise.all([listDelegates(), listEvaluations()]);
      setDelegates(d || []);
      setEvaluations(e || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la vista general.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const map = new Map();
    (delegates || []).forEach((d) => {
      map.set(String(d.id), {
        id: d.id,
        name: d.name || '',
        country: d.country || '',
        scores: Object.fromEntries(RUBRIC.map((c) => [c.key, []])),
        totals: [],
      });
    });
    (evaluations || []).forEach((e) => {
      const id = String(e.delegateId);
      if (!map.has(id)) map.set(id, {
        id: e.delegateId,
        name: e.delegateName || '',
        country: e.country || '',
        scores: Object.fromEntries(RUBRIC.map((c) => [c.key, []])),
        totals: [],
      });
      const row = map.get(id);
      row.totals.push(Number(e.total || 0));
      RUBRIC.forEach((criterion) => {
        const value = Number(e.scores?.[criterion.key]);
        if (Number.isFinite(value) && value >= 0) row.scores[criterion.key].push(value);
      });
    });

    return [...map.values()].map((row) => {
      const values = RUBRIC.map((criterion) => {
        const items = row.scores[criterion.key];
        return items.length ? items.reduce((a, b) => a + b, 0) / items.length : 0;
      });
      const total = row.totals.length ? row.totals.reduce((a, b) => a + b, 0) / row.totals.length : 0;
      return { ...row, values, total, count: row.totals.length };
    }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [delegates, evaluations]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.name} ${row.country}`.toLowerCase().includes(q));
  }, [rows, query]);

  const evaluated = rows.filter((r) => r.count > 0);
  const pending = rows.filter((r) => r.count === 0).length;
  const average = evaluated.length ? evaluated.reduce((sum, r) => sum + r.total, 0) / evaluated.length : 0;

  const groups = [];
  RUBRIC.forEach((criterion, index) => {
    const prev = RUBRIC[index - 1];
    if (!prev || prev.group !== criterion.group) {
      let span = 0;
      for (let i = index; i < RUBRIC.length && RUBRIC[i].group === criterion.group; i++) span++;
      groups.push({ name: criterion.group, span });
    }
  });

  return (
    <section className="general-page">
      <div className="general-breadcrumb">Inicio <span>·</span> <strong>Vista general</strong></div>

      <div className="general-hero">
        <div>
          <span className="general-eyebrow">Rúbrica Oficial PLE-RD · Regional 17</span>
          <h1>Vista general de evaluación</h1>
          <p>Consulta en una sola pantalla las calificaciones de todos los delegados y los 9 criterios de la rúbrica.</p>
        </div>
        <div className="general-actions">
          <button className="btn secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'general-spin' : ''}/> Actualizar</button>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('r17:close-general'))}><X size={15}/> Cerrar vista</button>
        </div>
      </div>

      <div className="general-stats">
        <div className="general-stat"><div className="general-stat-icon blue"><ClipboardCheck size={18}/></div><div><span>Evaluados</span><strong>{evaluated.length}</strong></div></div>
        <div className="general-stat"><div className="general-stat-icon purple"><BarChart3 size={18}/></div><div><span>Promedio general</span><strong>{average.toFixed(1)} / 100</strong></div></div>
        <div className="general-stat"><div className="general-stat-icon amber"><ClipboardCheck size={18}/></div><div><span>Pendientes</span><strong>{pending}</strong></div></div>
        <div className="general-stat"><div className="general-stat-icon slate"><BarChart3 size={18}/></div><div><span>Delegados</span><strong>{rows.length}</strong></div></div>
      </div>

      <div className="general-card">
        <div className="general-toolbar">
          <div><h2>Matriz de calificaciones</h2><p>Promedia automáticamente las evaluaciones existentes de cada delegado.</p></div>
          <div className="general-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar delegado o país..."/></div>
        </div>
        {error && <div className="general-error">{error}</div>}
        <div className="general-table-wrap">
          {loading ? <div className="general-empty">Cargando calificaciones…</div> : (
            <table className="general-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="sticky no">No.</th>
                  <th rowSpan="2" className="sticky delegate">Delegado/a</th>
                  <th rowSpan="2" className="sticky country">País</th>
                  {groups.map((g) => <th key={g.name} colSpan={g.span} className="group">{g.name}</th>)}
                  <th rowSpan="2" className="total">TOTAL<br/><span>(100)</span></th>
                </tr>
                <tr>
                  {RUBRIC.map((criterion) => <th key={criterion.key} className="criterion">{criterion.key}<span>{criterion.max} pts</span></th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={row.id} className={row.count === 0 ? 'pending-row' : ''}>
                    <td className="sticky no">{index + 1}</td>
                    <td className="sticky delegate"><strong>{row.name || '—'}</strong></td>
                    <td className="sticky country">{row.country || '—'}</td>
                    {row.values.map((value, i) => <td key={RUBRIC[i].key}>{row.count ? value.toFixed(value % 1 ? 1 : 0) : '—'}</td>)}
                    <td className="total-cell"><strong>{row.total.toFixed(1).replace('.', ',')}</strong></td>
                  </tr>
                ))}
                {!filteredRows.length && <tr><td colSpan={RUBRIC.length + 4} className="general-empty">No hay resultados para la búsqueda.</td></tr>}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="tfoot-label">Promedio general</td>
                  {RUBRIC.map((criterion, index) => {
                    const values = evaluated.map((row) => row.values[index]);
                    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    return <td key={criterion.key}>{values.length ? avg.toFixed(1).replace('.', ',') : '—'}</td>;
                  })}
                  <td className="tfoot-total">{average.toFixed(1).replace('.', ',')}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div className="general-footer"><span>{evaluated.length} evaluados · {pending} pendientes</span><strong>Máximo {RUBRIC_TOTAL} puntos</strong></div>
      </div>
    </section>
  );
}

let root = null;
let host = null;
let previousContent = null;
let installed = false;

function ensurePage() {
  const main = document.querySelector('.main');
  const sidebar = document.querySelector('.sidebar');
  if (!main || !sidebar) return;

  if (!document.getElementById(ID)) {
    host = document.createElement('div');
    host.id = ID;
    host.style.display = 'none';
    main.appendChild(host);
  }
  if (!document.getElementById(NAV_ID)) {
    const buttons = [...sidebar.querySelectorAll('.nav-item')];
    const evaluationButton = buttons.find((b) => b.textContent.includes('Comisiones'));
    if (evaluationButton) {
      const navButton = document.createElement('button');
      navButton.id = NAV_ID;
      navButton.className = 'nav-item blue';
      navButton.innerHTML = '<span class="general-nav-icon">▦</span> Vista general';
      navButton.addEventListener('click', openPage);
      evaluationButton.insertAdjacentElement('afterend', navButton);
    }
  }
  if (!installed) {
    installed = true;
    window.addEventListener('r17:close-general', closePage);
    const observer = new MutationObserver(() => {
      if (document.getElementById(ID) && !document.getElementById(NAV_ID)) ensurePage();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

function openPage() {
  ensurePage();
  if (!host) return;
  previousContent = [...document.querySelectorAll('.main > .content')];
  previousContent.forEach((node) => node.style.display = 'none');
  host.style.display = 'block';
  document.querySelectorAll('.sidebar .nav-item').forEach((node) => node.classList.remove('active'));
  document.getElementById(NAV_ID)?.classList.add('active');
  if (!root) root = createRoot(host);
  root.render(<GeneralView/>);
  host.scrollIntoView({ block: 'start' });
}

function closePage() {
  if (!host) return;
  root?.render(null);
  host.style.display = 'none';
  previousContent?.forEach((node) => node.style.display = '');
  previousContent = null;
  document.getElementById(NAV_ID)?.classList.remove('active');
}

function watchNavigation() {
  document.querySelectorAll('.sidebar .nav-item').forEach((button) => {
    if (button.id === NAV_ID) return;
    if (button.dataset.generalNavigationBound === '1') return;
    button.dataset.generalNavigationBound = '1';
    button.addEventListener('click', closePage);
  });
}

const observer = new MutationObserver(() => { ensurePage(); watchNavigation(); });
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', () => { ensurePage(); watchNavigation(); });
setInterval(() => { ensurePage(); watchNavigation(); }, 500);
