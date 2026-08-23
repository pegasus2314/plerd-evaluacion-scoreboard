# PLE-RD · Evaluación y ScoreBoard

Proyecto independiente para los módulos de evaluación de delegados y resultados acumulados.

## Alcance inicial

- Evaluación de delegados por comisión.
- Rúbrica oficial de evaluación: 9 criterios, 100 puntos.
- Cálculo automático del total.
- Registro preparado para asociar delegado, comisión, etapa y evaluador.
- ScoreBoard con ranking y promedio.
- Shell visual compartido entre Check-in, Evaluación y ScoreBoard.
- Diseño responsive.

## Rúbrica oficial

| Criterio | Máximo |
| --- | ---: |
| Investigación académica | 15 |
| Pensamiento crítico | 15 |
| Oratoria | 10 |
| Argumentación | 10 |
| Redacción | 10 |
| Negociación | 10 |
| Resolución de conflictos | 10 |
| Liderazgo | 10 |
| Colaboración | 10 |
| **Total** | **100** |

## Desarrollo

```bash
npm install
npm run dev
```

La conexión con la fuente real de delegados y el almacenamiento persistente se incorporará después de confirmar las tablas/API existentes del sistema PLE-RD. No se modifica ni depende del proyecto Regional 17 Volunteers.
