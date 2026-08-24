const COUNTRIES = [
  'Afganistán','Albania','Alemania','Andorra','Angola','Antigua y Barbuda','Arabia Saudita','Argelia','Argentina','Armenia','Australia','Austria','Azerbaiyán',
  'Bahamas','Bangladés','Barbados','Baréin','Bélgica','Belice','Benín','Bielorrusia','Birmania (Myanmar)','Bolivia','Bosnia y Herzegovina','Botsuana','Brasil','Brunéi','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Camboya','Camerún','Canadá','Catar','Chad','Chile','China','Chipre','Colombia','Comoras','Congo','Corea del Norte','Corea del Sur','Costa Rica','Costa de Marfil','Croacia','Cuba',
  'Dinamarca','Dominica','Ecuador','Egipto','El Salvador','Emiratos Árabes Unidos','Eritrea','Eslovaquia','Eslovenia','España','Estados Unidos','Estonia','Esuatini','Etiopía',
  'Filipinas','Finlandia','Fiyi','Francia','Gabón','Gambia','Georgia','Ghana','Granada','Grecia','Guatemala','Guinea','Guinea-Bisáu','Guinea Ecuatorial','Guyana',
  'Haití','Honduras','Hungría','India','Indonesia','Irak','Irán','Irlanda','Islandia','Islas Marshall','Islas Salomón','Israel','Italia','Jamaica','Japón','Jordania',
  'Kazajistán','Kenia','Kirguistán','Kiribati','Kuwait','Laos','Lesoto','Letonia','Líbano','Liberia','Libia','Liechtenstein','Lituania','Luxemburgo',
  'Macedonia del Norte','Madagascar','Malasia','Malaui','Maldivas','Malí','Malta','Marruecos','Mauricio','Mauritania','México','Micronesia','Moldavia','Mónaco','Mongolia','Montenegro','Mozambique',
  'Namibia','Nauru','Nepal','Nicaragua','Níger','Nigeria','Noruega','Nueva Zelanda','Omán','Países Bajos','Pakistán','Palaos','Panamá','Papúa Nueva Guinea','Paraguay','Perú','Polonia','Portugal',
  'Reino Unido','República Centroafricana','República Checa','República Democrática del Congo','República Dominicana','Ruanda','Rumania','Rusia','Samoa','San Cristóbal y Nieves','San Marino','San Vicente y las Granadinas','Santa Lucía','Santo Tomé y Príncipe','Senegal','Serbia','Seychelles','Sierra Leona','Singapur','Siria','Somalia','Sri Lanka','Sudáfrica','Sudán','Sudán del Sur','Suecia','Suiza','Surinam',
  'Tailandia','Taiwán','Tanzania','Tayikistán','Timor-Leste','Togo','Tonga','Trinidad y Tobago','Túnez','Turkmenistán','Turquía','Tuvalu','Ucrania','Uganda','Uruguay','Uzbekistán','Vanuatu','Vaticano','Venezuela','Vietnam','Yemen','Yibuti','Zambia','Zimbabue'
];

function ensureStyles() {
  if (document.getElementById('r17-country-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'r17-country-ui-styles';
  style.textContent = `
    .r17-country-wrap{position:relative;margin-top:7px}
    .r17-country-wrap .r17-country-input{margin-top:0!important;height:38px!important;padding:8px 34px 8px 10px!important;border-radius:9px!important;font-size:12px!important}
    .r17-country-chevron{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:#98a2b3;pointer-events:none}
    .r17-country-menu{position:absolute;left:0;right:0;top:calc(100% + 5px);display:none;max-height:190px;overflow:auto;background:#fff;border:1px solid #e2e7ef;border-radius:10px;box-shadow:0 12px 28px rgba(20,30,50,.12);padding:4px;z-index:250}
    .r17-country-menu.open{display:block}
    .r17-country-option{width:100%;border:0;background:transparent;text-align:left;border-radius:7px;padding:7px 9px;color:#344054;font-size:11px;cursor:pointer}
    .r17-country-option:hover,.r17-country-option.active{background:#eef4ff;color:#2f6fed}
    .r17-country-empty{padding:8px 9px;color:#98a2b3;font-size:10px}
  `;
  document.head.appendChild(style);
}

function installCountryAutocomplete() {
  ensureStyles();
  const modals = document.querySelectorAll('.modal');
  modals.forEach((modal) => {
    const labels = [...modal.querySelectorAll('label')];
    const countryLabel = labels.find((label) => label.textContent.trim().startsWith('País'));
    const input = countryLabel?.querySelector('input');
    if (!input || input.dataset.countryAutocomplete === '2') return;

    input.removeAttribute('list');
    input.setAttribute('autocomplete', 'country-name');
    input.dataset.countryAutocomplete = '2';

    const wrap = document.createElement('div');
    wrap.className = 'r17-country-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add('r17-country-input');

    const chevron = document.createElement('span');
    chevron.className = 'r17-country-chevron';
    chevron.textContent = '▾';
    wrap.appendChild(chevron);

    const menu = document.createElement('div');
    menu.className = 'r17-country-menu';
    wrap.appendChild(menu);

    const render = () => {
      const query = input.value.trim().toLocaleLowerCase('es');
      const filtered = COUNTRIES.filter(country => !query || country.toLocaleLowerCase('es').includes(query)).slice(0, 10);
      menu.innerHTML = filtered.length
        ? filtered.map(country => `<button type="button" class="r17-country-option" data-country="${country.replace(/"/g, '&quot;')}">${country}</button>`).join('')
        : '<div class="r17-country-empty">No hay coincidencias</div>';
      menu.querySelectorAll('.r17-country-option').forEach(btn => {
        btn.addEventListener('mousedown', (event) => {
          event.preventDefault();
          input.value = btn.dataset.country;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          menu.classList.remove('open');
          input.focus();
        });
      });
    };

    input.addEventListener('focus', () => { render(); menu.classList.add('open'); });
    input.addEventListener('input', () => { render(); menu.classList.add('open'); });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') menu.classList.remove('open');
    });
    document.addEventListener('mousedown', (event) => {
      if (!wrap.contains(event.target)) menu.classList.remove('open');
    });
  });
}

const observer = new MutationObserver(installCountryAutocomplete);
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', installCountryAutocomplete);
setTimeout(installCountryAutocomplete, 100);