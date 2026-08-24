import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X, Table2, RefreshCw } from 'lucide-react';
import { RUBRIC, RUBRIC_TOTAL } from './data/rubric';
import { listDelegates, listEvaluations } from './lib/evaluations';
import './evaluation-general-view.css';

const keyOf = (value) => String(value ?? '').trim().toLowerCase();

function GeneralEvaluationModal({ onClose }) {
  const [delegates, setDelegates] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [delegatesRows, evaluationRows] = await Promise.all([listDelegates(), listEvaluations()]);
      setDelegates(delegatesRows || []);
      setEvaluations(evaluationRows || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la vista general.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const byDelegate = new Map();

    (delegates || []).forEach((delegate) => {
      byDelegate.set(String(delegate.id), {
        id: delegate.id,
        name: delegate.name || '',
        country: delegate.country || '',
        scores: Object.fromEntries(RUBRIC.map((criterion) => [criterion.key, []])),
        totals: [],
      });
    });

    (evaluations || []).forEach((evaluation) => {
      const id = String(evaluation.delegateId);
      if (!byDelegate.has(id)) {
        byDelegate.set(id, {
          id: evaluation.delegateId,
          name: evaluation.delegateName || '',
          country: evaluation.country || '',
          scores: Object.fromEntries(RUBRIC.map((criterion) => [criterion.key, []])),
          totals: [],
        });
      }

      const row = byDelegate.get(id);
      row.totals.push(Number(evaluation.total || 0));
      RUBRIC.forEach((criterion) => {
        const value = Number(evaluation.scores?.[criterion.key]);
        if (Number.isFinite(value) && value > 0) row.scores[criterion.key].push(value);
      });
    });

    return [...byDelegate.values()].map((row) => {
      const scoreValues = RUBRIC.map((criterion) => {
        const values = row.scores[criterion.key];
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      });
      const calculatedTotal = scoreValues.reduce((sum, value) => sum + value, 0);
      const savedTotal = row.totals.length ? row.totals.reduce((a, b) => a + b, 0) / row.totals.length : calculatedTotal;
      return {
        ...row,
        values: scoreValues,
        total: savedTotal,
        count: row.totals.length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [delegates, evaluations]);

  const groupedHeader = [];
  RUBRIC.forEach((criterion, index) => {
    const previous = RUBRIC[index - 1];
    if (!previous || previous.group !== criterion.group) {
      const span = RUBRIC.slice(index).findIndex((c) => c.group !== criterion.group);
      groupedHeader.push({ group: criterion.group, span: span === -1 ? RUBRIC.length - index : span });
    }
  });

  return (
    <div className="evaluation-general-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="evaluation-general-window">
        <div className="evaluation-general-head">
          <div>
            <div className="evaluation-general-kicker">Rúbrica Oficial PLE-RD — Regional 17</div>
            <h2>Vista general de evaluaciones</h2>
            <p>Todos los delegados y criterios en una sola vista.</p>
          </div>
          <div className="evaluation-general-actions">
            <button className="evaluation-general-refresh" onClick={load} disabled={loading} title="Actualizar"><RefreshCw size={15} className={loading ? 'spin' : ''} /></button>
            <button className="evaluation-general-close" onClick={onClose} title="Cerrar"><X size={18} /></button>
          </div>
        </div>

        {error && <div className="evaluation-general-error">{error}</div>}

        <div className="evaluation-general-table-wrap">
          {loading ? (
            <div className="evaluation-general-empty">Cargando evaluaciones…</div>
          ) : (
            <table className="evaluation-general-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="sticky-col no-col">No.</th>
                  <th rowSpan="2" className="sticky-col delegate-col">Delegado/a</th>
                  <th rowSpan="2" className="sticky-col country-col">País</th>
                  {groupedHeader.map((group) => <th key={group.group} colSpan={group.span} className="group-head">{group.group}</th>)}
                  <th rowSpan="2" className="total-head">TOTAL (100)</th>
                </tr>
                <tr>
                  {RUBRIC.map((criterion) => <th key={criterion.key} className="criterion-head">{criterion.key} <span>({criterion.max})</span></th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className={row.count === 0 ? 'not-evaluated' : ''}>
                    <td className="sticky-col no-cell">{index + 1}</td>
                    <td className="sticky-col delegate-cell">{row.name || '—'}</td>
                    <td className="sticky-col country-cell">{row.country || '—'}</td>
                    {row.values.map((value, valueIndex) => (
                      <td key={RUBRIC[valueIndex].key} className="score-cell">{row.count ? Number(value).toFixed(value % 1 ? 1 : 0) : ''}</td>
                    ))}
                    <td className="total-cell"><strong>{Number(row.total || 0).toFixed(1).replace('.', ',')}</strong></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={RUBRIC.length + 4} className="evaluation-general-empty">No hay delegados registrados.</td></tr>}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="tfoot-label">Promedio general</td>
                  {RUBRIC.map((criterion, index) => {
                    const values = rows.filter((row) => row.count).map((row) => row.values[index]);
                    const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    return <td key={criterion.key} className="tfoot-score">{values.length ? average.toFixed(1).replace('.', ',') : ''}</td>;
                  })}
                  <td className="tfoot-total">{rows.filter((row) => row.count).length ? (rows.filter((row) => row.count).reduce((sum, row) => sum + row.total, 0) / rows.filter((row) => row.count).length).toFixed(1).replace('.', ',') : '0,0'}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div className="evaluation-general-foot">{rows.filter((row) => row.count).length} evaluados · {rows.filter((row) => !row.count).length} pendientes · Máximo {RUBRIC_TOTAL} puntos</div>
      </div>
    </div>
  );
}

let root = null;
let lastHost = null;
let lastPage = false;

function installGeneralView() {
  const evaluationPage = Boolean(document.querySelector('.rubric-title'));
  const pageHeading = evaluationPage ? document.querySelector('.page-heading') : null;
  if (!pageHeading) return;

  if (lastHost && !document.body.contains(lastHost)) lastHost = null;
  if (lastPage === evaluationPage && pageHeading.querySelector('.general-view-trigger')) return;
  lastPage = evaluationPage;

  if (pageHeading.querySelector('.general-view-trigger')) return;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'btn secondary general-view-trigger';
  trigger.innerHTML = '<span class="general-view-trigger-icon">▦</span> Vista general';
  trigger.addEventListener('click', () => {
    if (!lastHost) {
      lastHost = document.createElement('div');
      document.body.appendChild(lastHost);
    }
    if (!root) root = createRoot(lastHost);
    root.render(<GeneralEvaluationModal onClose={() => root.render(null)} />);
  });

  const titleSide = pageHeading.querySelector('.commission-pill');
  if (titleSide?.parentElement === pageHeading) {
    titleSide.replaceWith(document.createElement('div'));
  }
  pageHeading.appendChild(trigger);
}

const observer = new MutationObserver(() => installGeneralView());
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', installGeneralView);
setInterval(installGeneralView, 400);
