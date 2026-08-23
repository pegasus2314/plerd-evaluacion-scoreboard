import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const STAGES = [
  { id: 'stage-1', label: 'Etapa 1', dates: '22 ago — 03 sep', status: 'ACTIVA' },
  { id: 'stage-2', label: 'Etapa 2', dates: '04 sep — 17 sep', status: 'PRÓXIMA' },
  { id: 'stage-3', label: 'Etapa 3', dates: '18 sep — 01 oct', status: 'PRÓXIMA' },
];

export default function ActiveStageControl() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(STAGES[0]);

  return (
    <div className="active-stage-control">
      <button type="button" className="active-stage-trigger" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span className="active-stage-copy"><small>Etapa activa</small><strong>{stage.dates}</strong></span>
        <span className={`active-stage-status ${stage.status === 'ACTIVA' ? 'is-active' : ''}`}>{stage.status}</span>
        <ChevronDown size={15} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="active-stage-menu">
          {STAGES.map(item => (
            <button type="button" key={item.id} className="active-stage-option" onClick={() => { setStage(item); setOpen(false); }}>
              <span><strong>{item.label}</strong><small>{item.dates}</small></span>
              {stage.id === item.id && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
