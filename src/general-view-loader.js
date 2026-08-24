setTimeout(() => {
  import('./evaluation-general-view.jsx').catch((error) => console.error('No se pudo cargar Vista general:', error));
}, 700);
