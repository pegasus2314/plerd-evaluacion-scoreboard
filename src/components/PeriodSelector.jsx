import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const PERIODS = [
  { id: 'stage-1', label: 'Etapa 1', dates: '22 ago — 03 sep', status: 'ACTIVA' },
  { id: 'stage-2', label: 'Etapa 2', dates: '04 sep — 17 sep', status: 'PRÓXIMA' },
  { id: 'stage-3', label: 'Etapa 3', dates: '18 sep — 01 oct', status: 'PRÓXIMA' },
];

export default function PeriodSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(PERIODS[0]);

  return (
    <div className="period-wrap">
      <button className="period" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span className="period-title">Etapa activa</span>
        <span>{active.dates}</span>
        <b className={active.status === 'ACTIVA' ? 'period-active' : 'period-next'}>{active.status}</b>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="period-menu" role="menu">
          <div className="period-menu-title">Etapas evaluatorias</div>
          {PERIODS.map(item => (
            <button key={item.id} type="button" onClick={() => { setActive(item); setOpen(false); }}>
              <span><strong>{item.label}</strong><small>{item.dates}</small></span>
              <em>{item.status}</em>
              {active.id === item.id && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
