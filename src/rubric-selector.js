import { RUBRICS, getActiveRubricId } from './data/rubric';

const SELECTOR_ID = 'r17-rubric-selector';

function install() {
  if (typeof document === 'undefined' || document.getElementById(SELECTOR_ID)) return;
  const heading = [...document.querySelectorAll('h1')].find((el) => el.textContent.trim() === 'Evaluar delegado');
  const pageHeading = heading?.closest('.page-heading');
  if (!pageHeading) return;

  const wrapper = document.createElement('label');
  wrapper.id = SELECTOR_ID;
  wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;font-size:12px;font-weight:700;color:#475569;white-space:nowrap;';
  wrapper.innerHTML = '<span>Rúbrica</span><select style="border:1px solid #dbe3ee;border-radius:9px;padding:8px 10px;background:#fff;color:#1f2937;font-weight:600;min-width:245px"><option value="santo-domingo-regional">Hoja de Santo Domingo — Modelo Regional</option><option value="calificacion-estandar">Calificación estándar</option></select>';
  const select = wrapper.querySelector('select');
  select.value = getActiveRubricId();
  select.addEventListener('change', () => {
    window.localStorage.setItem('r17:rubricId', select.value);
    window.location.reload();
  });
  pageHeading.appendChild(wrapper);
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(install);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(install, 200);
}

export { RUBRICS };
