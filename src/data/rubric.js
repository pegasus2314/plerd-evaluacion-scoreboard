export const RUBRIC = [
  { group: 'Investigación y análisis crítico', key: 'Investigación académica', max: 15 },
  { group: 'Investigación y análisis crítico', key: 'Pensamiento crítico', max: 15 },
  { group: 'Comunicación y lenguaje', key: 'Oratoria', max: 10 },
  { group: 'Comunicación y lenguaje', key: 'Argumentación', max: 10 },
  { group: 'Comunicación y lenguaje', key: 'Redacción', max: 10 },
  { group: 'Negociación y resolución de conflictos', key: 'Negociación', max: 10 },
  { group: 'Negociación y resolución de conflictos', key: 'Resolución de conflictos', max: 10 },
  { group: 'Liderazgo y colaboración', key: 'Liderazgo', max: 10 },
  { group: 'Liderazgo y colaboración', key: 'Colaboración', max: 10 },
];

export const RUBRIC_TOTAL = RUBRIC.reduce((sum, criterion) => sum + criterion.max, 0);

export const emptyScores = () => Object.fromEntries(RUBRIC.map(({ key }) => [key, 0]));
