export const RUBRICS = {
  'santo-domingo-regional': {
    id: 'santo-domingo-regional',
    name: 'Hoja de Santo Domingo — Modelo Regional',
    criteria: [
      { group: 'Investigación y análisis crítico', key: 'Investigación académica', max: 15 },
      { group: 'Investigación y análisis crítico', key: 'Pensamiento crítico', max: 15 },
      { group: 'Comunicación y lenguaje', key: 'Oratoria', max: 10 },
      { group: 'Comunicación y lenguaje', key: 'Argumentación', max: 10 },
      { group: 'Comunicación y lenguaje', key: 'Redacción', max: 10 },
      { group: 'Negociación y resolución de conflictos', key: 'Negociación', max: 10 },
      { group: 'Negociación y resolución de conflictos', key: 'Resolución de conflictos', max: 10 },
      { group: 'Liderazgo y colaboración', key: 'Liderazgo', max: 10 },
      { group: 'Liderazgo y colaboración', key: 'Colaboración', max: 10 }
    ]
  },
  'calificacion-estandar': {
    id: 'calificacion-estandar',
    name: 'Calificación estándar',
    criteria: [
      { group: 'Conocimiento (28)', key: 'Redacción', max: 10 },
      { group: 'Conocimiento (28)', key: 'Investigación', max: 10 },
      { group: 'Conocimiento (28)', key: 'Representación', max: 8 },
      { group: 'Comunicación (22)', key: 'Oratoria', max: 8 },
      { group: 'Comunicación (22)', key: 'Argumentación', max: 8 },
      { group: 'Comunicación (22)', key: 'Discurso', max: 6 },
      { group: 'Negociación (16)', key: 'Construcción de Consensos', max: 8 },
      { group: 'Negociación (16)', key: 'Resolución de Conflictos', max: 8 },
      { group: 'Análisis (16)', key: 'Pensamiento Crítico', max: 10 },
      { group: 'Análisis (16)', key: 'Construcción de Soluciones', max: 6 },
      { group: 'Interpersonales (18)', key: 'Liderazgo', max: 8 },
      { group: 'Interpersonales (18)', key: 'Trabajo en Equipo', max: 10 }
    ]
  }
};

export const getActiveRubricId = () => {
  if (typeof window === 'undefined') return 'santo-domingo-regional';
  const value = window.localStorage.getItem('r17:rubricId');
  return RUBRICS[value] ? value : 'santo-domingo-regional';
};

export const ACTIVE_RUBRIC_ID = getActiveRubricId();
export const ACTIVE_RUBRIC = RUBRICS[ACTIVE_RUBRIC_ID];
export const RUBRIC = ACTIVE_RUBRIC.criteria;
export const RUBRIC_TOTAL = RUBRIC.reduce((sum, criterion) => sum + criterion.max, 0);
export const emptyScores = () => Object.fromEntries(RUBRIC.map(({ key }) => [key, 0]));
