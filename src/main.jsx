import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, ChevronDown, ClipboardCheck, Menu, Search, Settings, Trophy, Users } from 'lucide-react';
import './styles.css';
import { RUBRIC, RUBRIC_TOTAL, emptyScores } from './data/rubric';
import { listDelegates, listCommissions, listEvaluations, saveEvaluation } from './lib/evaluations';

function App() {
  const [page, setPage] = useState('evaluation');
  const [delegates, setDelegates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [commission, setCommission] = useState('');
  const [scores, setScores] = useState(emptyScores());
  const [comments, setComments] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const total = useMemo(() => Object.values(scores).reduce((sum, value) => sum + Number(value || 0), 0), [scores]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [delegateRows, commissionRows, evaluationRows] = await Promise.all([listDelegates(), listCommissions(), listEvaluations()]);
      setDelegates(delegateRows); setCommissions(commissionRows); setEvaluations(evaluationRows);
      setSelected(current => current || delegateRows[0] || null);
    } catch (err) { setError(err.message || 'No se pudieron cargar los datos.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const updateScore = (key, value, max) => setScores(current => ({ ...current, [key]: Math.min(max, Math.max(0, Number(value) || 0)) }));
  const handleSave = async () => {
    if (!selected || !commission || total <= 0) return;
    setError('');
    try {
      const { data: sessionData } = await import('./lib/supabase').then(({ supabase }) => supabase.auth.getSession());
      const evaluatorId = sessionData?.session?.user?.id;
      if (!evaluatorId) throw new Error('Debes iniciar sesión como evaluador para guardar una calificación.');
      const row = await saveEvaluation({ delegateId: selected.id, commissionId: commission, evaluatorId, scores, total: Number(total.toFixed(1)), comments });
      setSaved(true); setScores(emptyScores()); setCommission(''); setComments('');
      const fresh = await listEvaluations(); setEvaluations(fresh);
      setTimeout(() => setSaved(false), 2500);
      return row;
    } catch (err) { setError(err.message || 'No se pudo guardar la evaluación.'); }
  };

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">PL</div><div><strong>PLE-RD</strong><span>Sistema de evaluación</span></div></div><div className="side-label">GESTIÓN</div><button className={page === 'checkin' ? 'nav-item active blue' : 'nav-item'} onClick={() => setPage('checkin')}><ClipboardCheck size={18}/> Check-in</button><button className={page === 'evaluation' ? 'nav-item active blue' : 'nav-item'} onClick={() => setPage('evaluation')}><Users size={18}/> Comisiones · Evaluación</button><button className={page === 'scoreboard' ? 'nav-item active purple' : 'nav-item'} onClick={() => setPage('scoreboard')}><Trophy size={18}/> ScoreBoard</button><div className="sidebar-bottom"><button className="nav-item"><Settings size={18}/> Configuración</button></div></aside>
    <main className="main"><header className="topbar"><button className="mobile-menu"><Menu size={20}/></button><div className="search"><Search size={17}/><span>Buscar delegado o NUID</span><kbd>⌘K</kbd></div><div className="top-actions"><div className="period">Etapa activa <span>22 ago — 03 sep</span><b>ACTIVA</b><ChevronDown size={15}/></div><div className="avatar">AS</div></div></header>{error && <div className="error-banner">{error}</div>}{page === 'evaluation' && <Evaluation {...{delegates, commissions, selected, setSelected, commission, setCommission, scores, updateScore, total, saved, handleSave, setScores, comments, setComments, evaluations, loading}} />}{page === 'scoreboard' && <Scoreboard evaluations={evaluations} />}{page === 'checkin' && <Checkin />}</main>
  </div>;
}

function Evaluation({ delegates, commissions, selected, setSelected, commission, setCommission, scores, updateScore, total, saved, handleSave, setScores, comments, setComments, evaluations, loading }) {
  return <section className="content"><div className="breadcrumb">Inicio <span>·</span> Comisiones <span>·</span> <strong>Evaluación</strong></div><div className="page-heading"><div><h1>Evaluar delegado</h1><p>Registra la evaluación utilizando la rúbrica oficial.</p></div><span className="commission-pill">Rúbrica Oficial de Evaluación</span></div><div className="grid-eval"><div className="card eval-card"><div className="section-title"><h2>Datos de evaluación</h2><p>Los datos se cargan desde la base de datos independiente.</p></div><label>Delegado/a<select disabled={loading || delegates.length === 0} value={selected?.id || ''} onChange={e => setSelected(delegates.find(d => d.id === e.target.value))}><option value="">{loading ? 'Cargando delegados…' : delegates.length ? 'Seleccionar delegado' : 'No hay delegados registrados'}</option>{delegates.map(d => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}</select></label><div className="two-fields"><label>País<div className="readonly">{selected?.country || '—'}</div></label><label>Comisión<select disabled={loading} value={commission} onChange={e => setCommission(e.target.value)}><option value="">Seleccionar comisión</option>{commissions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><div className="rubric-title"><div><h2>Rúbrica Oficial de Evaluación</h2><p>9 criterios · máximo {RUBRIC_TOTAL} puntos</p></div><div className="total-box"><span>TOTAL</span><strong>{total.toFixed(1)}</strong><small>/ {RUBRIC_TOTAL}</small></div></div><div className="rubric-list">{RUBRIC.map((criterion, i) => <div className="criterion" key={criterion.key}><div className="criterion-copy"><small>{i === 0 || RUBRIC[i - 1].group !== criterion.group ? criterion.group : ''}</small><label>{criterion.key}</label></div><div className="score-control"><input type="number" min="0" max={criterion.max} step="0.1" value={scores[criterion.key]} onChange={e => updateScore(criterion.key, e.target.value, criterion.max)}/><span>/ {criterion.max}</span></div></div>)}</div><label className="comments">Observaciones <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Añade una observación opcional..." /></label><div className="form-actions"><button className="btn secondary" onClick={() => { setScores(emptyScores()); setComments(''); }}>Limpiar</button><button className="btn primary" disabled={!selected || !commission || total <= 0 || loading} onClick={handleSave}>Guardar calificación</button></div>{saved && <div className="success">✓ Calificación guardada correctamente</div>}<div className="history-block"><div className="history-head"><div><h2>Evaluaciones registradas</h2><p>{evaluations.length} evaluación{evaluations.length === 1 ? '' : 'es'} en la base de datos.</p></div></div>{evaluations.length === 0 ? <div className="history-empty">Todavía no hay evaluaciones registradas.</div> : <div className="history-list">{evaluations.slice(0, 8).map(item => <div className="history-row" key={item.id}><div><strong>{item.delegateName}</strong><span>{item.commission} · {item.country}</span></div><b>{item.total.toFixed(1)}<small>/100</small></b></div>)}</div>}</div></div><aside className="card summary"><div className="summary-icon"><BarChart3 size={20}/></div><h3>{selected?.name || 'Sin delegado'}</h3><p>{selected ? `${selected.country} · ${selected.model || 'Sin modelo'}` : 'Selecciona un delegado'}</p><div className="summary-total"><span>Puntaje actual</span><strong>{total.toFixed(1)}</strong><small>/{RUBRIC_TOTAL}</small></div><div className="progress"><i style={{width: `${total}%`}}/></div><p className="hint">La puntuación se calcula automáticamente a partir de los 9 criterios.</p></aside></div></section>;
}

function Scoreboard({ evaluations }) {
  const rows = useMemo(() => { const grouped = new Map(); evaluations.forEach(item => { const current = grouped.get(item.delegateId) || { id: item.delegateId, name: item.delegateName, country: item.country, totals: [] }; current.totals.push(item.total); grouped.set(item.delegateId, current); }); return [...grouped.values()].map(item => ({ ...item, count: item.totals.length, score: item.totals.reduce((a,b) => a+b, 0) / item.totals.length })).sort((a,b) => b.score - a.score); }, [evaluations]);
  const average = evaluations.length ? evaluations.reduce((sum, item) => sum + item.total, 0) / evaluations.length : 0;
  return <section className="content"><div className="breadcrumb">Inicio <span>·</span> Comisiones <span>·</span> <strong>Resultados</strong></div><div className="page-heading"><div><h1>ScoreBoard</h1><p>Resultados acumulados de las evaluaciones reales.</p></div><button className="btn secondary">Exportar resultados</button></div><div className="stats"><Stat icon={<Trophy/>} label="Delegado/a líder" value={rows[0]?.name || 'Sin resultados'} accent="purple"/><Stat icon={<BarChart3/>} label="Promedio general" value={`${average.toFixed(1)} / 100`} accent="blue"/><Stat icon={<ClipboardCheck/>} label="Evaluaciones" value={evaluations.length} accent="amber"/></div><div className="tabs"><button className="selected">Por delegado <b>{rows.length}</b></button><button>Por comisión</button></div><div className="card table-card">{rows.length === 0 ? <div className="history-empty">El ScoreBoard se actualizará cuando se registre la primera evaluación.</div> : <table><thead><tr><th>#</th><th>Delegado/a</th><th>País</th><th>Evaluaciones</th><th>Desempeño</th><th>Puntaje</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.id}><td><span className={i<3?'medal':''}>{i+1}</span></td><td><div className="person"><span>{r.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><strong>{r.name}</strong></div></td><td>{r.country}</td><td>{r.count}</td><td><div className="mini-progress"><i style={{width:`${r.score}%`}}/></div></td><td><strong className="big-score">{r.score.toFixed(1)}</strong> <small>/100</small></td></tr>)}</tbody></table>}</div></section>;
}
function Stat({icon,label,value,accent}) { return <div className="stat"><div className={`stat-icon ${accent}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function Checkin(){return <section className="content"><div className="breadcrumb">Inicio <span>·</span> <strong>Check-in</strong></div><div className="page-heading"><div><h1>Check-in</h1><p>Módulo de referencia para la llegada de delegados.</p></div></div><div className="empty-state card"><ClipboardCheck size={32}/><h2>Check-in</h2><p>Este proyecto está preparado para conectarse al módulo de Check-in existente.</p></div></section>;}
createRoot(document.getElementById('root')).render(<App />);
