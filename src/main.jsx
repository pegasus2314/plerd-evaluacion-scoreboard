import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, ChevronDown, ClipboardCheck, LayoutDashboard, Menu, Search, Settings, Trophy, Users, X } from 'lucide-react';
import './styles.css';

const RUBRIC = [
  ['Investigación y análisis crítico', 'Investigación académica', 15],
  ['Investigación y análisis crítico', 'Pensamiento crítico', 15],
  ['Comunicación y lenguaje', 'Oratoria', 10],
  ['Comunicación y lenguaje', 'Argumentación', 10],
  ['Comunicación y lenguaje', 'Redacción', 10],
  ['Negociación y resolución de conflictos', 'Negociación', 10],
  ['Negociación y resolución de conflictos', 'Resolución de conflictos', 10],
  ['Liderazgo y colaboración', 'Liderazgo', 10],
  ['Liderazgo y colaboración', 'Colaboración', 10],
];

const DEMO_DELEGATES = [
  { id: 1, name: 'Asly Martinez Guzman', country: 'Argelia', model: 'Modelo Regional' },
  { id: 2, name: 'Milka Perez', country: 'República Dominicana', model: 'Modelo Regional' },
  { id: 3, name: 'Carlos Rodríguez', country: 'Chile', model: 'Modelo Distrital' },
  { id: 4, name: 'Sofía Hernández', country: 'México', model: 'Modelo Distrital' },
];

function App() {
  const [page, setPage] = useState('evaluation');
  const [selected, setSelected] = useState(DEMO_DELEGATES[0]);
  const [scores, setScores] = useState(Object.fromEntries(RUBRIC.map(([, key]) => [key, 0])));
  const [saved, setSaved] = useState(false);
  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + Number(b || 0), 0), [scores]);

  const updateScore = (key, value, max) => setScores(s => ({ ...s, [key]: Math.min(max, Math.max(0, Number(value))) }));

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">PL</div><div><strong>PLE-RD</strong><span>Sistema de evaluación</span></div></div>
      <div className="side-label">GESTIÓN</div>
      <button className={page === 'checkin' ? 'nav-item active blue' : 'nav-item'} onClick={() => setPage('checkin')}><ClipboardCheck size={18}/> Check-in</button>
      <button className={page === 'evaluation' ? 'nav-item active blue' : 'nav-item'} onClick={() => setPage('evaluation')}><Users size={18}/> Comisiones · Evaluación</button>
      <button className={page === 'scoreboard' ? 'nav-item active purple' : 'nav-item'} onClick={() => setPage('scoreboard')}><Trophy size={18}/> ScoreBoard</button>
      <div className="sidebar-bottom"><button className="nav-item"><Settings size={18}/> Configuración</button></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu"><Menu size={20}/></button>
        <div className="search"><Search size={17}/><span>Buscar delegado o NUID</span><kbd>⌘K</kbd></div>
        <div className="top-actions"><div className="period">Etapa activa <span>22 ago — 03 sep</span><b>ACTIVA</b><ChevronDown size={15}/></div><div className="avatar">AS</div></div>
      </header>

      {page === 'evaluation' && <Evaluation selected={selected} setSelected={setSelected} scores={scores} updateScore={updateScore} total={total} saved={saved} setSaved={setSaved}/>} 
      {page === 'scoreboard' && <Scoreboard/>}
      {page === 'checkin' && <Checkin/>}
    </main>
  </div>
}

function Evaluation({selected, setSelected, scores, updateScore, total, saved, setSaved}) {
  return <section className="content">
    <div className="breadcrumb">Inicio <span>·</span> Comisiones <span>·</span> <strong>Evaluación</strong></div>
    <div className="page-heading"><div><h1>Evaluar delegado</h1><p>Registra la evaluación utilizando la rúbrica oficial.</p></div><span className="commission-pill">Rúbrica Oficial de Evaluación</span></div>
    <div className="grid-eval">
      <div className="card eval-card">
        <div className="section-title"><div><h2>Datos de evaluación</h2><p>Selecciona el delegado y la comisión correspondiente.</p></div></div>
        <label>Delegado/a<select value={selected.id} onChange={e => setSelected(DEMO_DELEGATES.find(d => d.id === Number(e.target.value)))}>{DEMO_DELEGATES.map(d => <option key={d.id} value={d.id}>{d.name} · {d.country}</option>)}</select></label>
        <div className="two-fields"><label>País<div className="readonly">{selected.country}</div></label><label>Comisión<div className="readonly">Seleccionar comisión</div></label></div>
        <div className="rubric-title"><div><h2>Rúbrica Oficial de Evaluación</h2><p>9 criterios · máximo 100 puntos</p></div><div className="total-box"><span>TOTAL</span><strong>{total.toFixed(1)}</strong><small>/ 100</small></div></div>
        <div className="rubric-list">{RUBRIC.map(([group, key, max], i) => <div className="criterion" key={key}><div className="criterion-copy"><small>{i === 0 || RUBRIC[i-1][0] !== group ? group : ''}</small><label>{key}</label></div><div className="score-control"><input type="number" min="0" max={max} step="0.1" value={scores[key]} onChange={e => updateScore(key, e.target.value, max)}/><span>/ {max}</span></div></div>)}</div>
        <label className="comments">Observaciones <textarea placeholder="Añade una observación opcional..." /></label>
        <div className="form-actions"><button className="btn secondary" onClick={() => setScores(Object.fromEntries(RUBRIC.map(([, key]) => [key, 0])))}>Limpiar</button><button className="btn primary" onClick={() => {setSaved(true); setTimeout(() => setSaved(false), 2500)}}>Guardar calificación</button></div>
        {saved && <div className="success">✓ Calificación guardada correctamente</div>}
      </div>
      <aside className="card summary"><div className="summary-icon"><BarChart3 size={20}/></div><h3>{selected.name}</h3><p>{selected.country} · {selected.model}</p><div className="summary-total"><span>Puntaje actual</span><strong>{total.toFixed(1)}</strong><small>/100</small></div><div className="progress"><i style={{width: `${total}%`}}/></div><p className="hint">La puntuación se calcula automáticamente a partir de los 9 criterios.</p></aside>
    </div>
  </section>
}

function Scoreboard() {
 const rows = [
  ['Asly Martinez Guzman','Argelia','93.7',6], ['Sofía Hernández','México','91.4',5], ['Carlos Rodríguez','Chile','88.9',4], ['Milka Perez','República Dominicana','44.5',3]
 ];
 return <section className="content"><div className="breadcrumb">Inicio <span>·</span> Comisiones <span>·</span> <strong>Resultados</strong></div><div className="page-heading"><div><h1>ScoreBoard</h1><p>Resultados acumulados de las evaluaciones.</p></div><button className="btn secondary">Exportar resultados</button></div>
 <div className="stats"><Stat icon={<Trophy/>} label="Delegado/a líder" value="Asly Martinez Guzman" accent="purple"/><Stat icon={<BarChart3/>} label="Promedio general" value="79.6 / 100" accent="blue"/><Stat icon={<ClipboardCheck/>} label="Evaluaciones" value="18" accent="amber"/></div>
 <div className="tabs"><button className="selected">Por delegado <b>18</b></button><button>Por comisión</button></div>
 <div className="card table-card"><table><thead><tr><th>#</th><th>Delegado/a</th><th>País</th><th>Evaluaciones</th><th>Desempeño</th><th>Puntaje</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]}><td><span className={i<3?'medal':''}>{i+1}</span></td><td><div className="person"><span>{r[0].split(' ').map(x=>x[0]).slice(0,2).join('')}</span><strong>{r[0]}</strong></div></td><td>{r[1]}</td><td>{r[3]}</td><td><div className="mini-progress"><i style={{width:`${r[2]}%`}}/></div></td><td><strong className="big-score">{r[2]}</strong> <small>/100</small></td></tr>)}</tbody></table></div></section>
}
function Stat({icon,label,value,accent}) { return <div className="stat"><div className={`stat-icon ${accent}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div> }
function Checkin(){return <section className="content"><div className="breadcrumb">Inicio <span>·</span> <strong>Check-in</strong></div><div className="page-heading"><div><h1>Check-in</h1><p>Módulo de referencia para la llegada de delegados.</p></div></div><div className="empty-state card"><ClipboardCheck size={32}/><h2>Check-in</h2><p>Este proyecto mantiene la estructura preparada para conectarse al módulo de Check-in existente.</p></div></section>}

createRoot(document.getElementById('root')).render(<App/>);
