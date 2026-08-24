const COUNTRIES = [
  'Afganistán','Albania','Alemania','Andorra','Angola','Antigua y Barbuda','Arabia Saudita','Argelia','Argentina','Armenia','Australia','Austria','Azerbaiyán',
  'Bahamas','Bangladés','Barbados','Baréin','Bélgica','Belice','Benín','Bielorrusia','Birmania (Myanmar)','Bolivia','Bosnia y Herzegovina','Botsuana','Brasil','Brunéi','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Camboya','Camerún','Canadá','Catar','Chad','Chile','China','Chipre','Colombia','Comoras','Congo','Corea del Norte','Corea del Sur','Costa Rica','Costa de Marfil','Croacia','Cuba',
  'Dinamarca','Dominica','Ecuador','Egipto','El Salvador','Emiratos Árabes Unidos','Eritrea','Eslovaquia','Eslovenia','España','Estados Unidos','Estonia','Esuatini','Etiopía',
  'Filipinas','Finlandia','Fiyi','Francia',
  'Gabón','Gambia','Georgia','Ghana','Granada','Grecia','Guatemala','Guinea','Guinea-Bisáu','Guinea Ecuatorial','Guyana',
  'Haití','Honduras','Hungría',
  'India','Indonesia','Irak','Irán','Irlanda','Islandia','Islas Marshall','Islas Salomón','Israel','Italia',
  'Jamaica','Japón','Jordania',
  'Kazajistán','Kenia','Kirguistán','Kiribati','Kuwait',
  'Laos','Lesoto','Letonia','Líbano','Liberia','Libia','Liechtenstein','Lituania','Luxemburgo',
  'Macedonia del Norte','Madagascar','Malasia','Malaui','Maldivas','Malí','Malta','Marruecos','Mauricio','Mauritania','México','Micronesia','Moldavia','Mónaco','Mongolia','Montenegro','Mozambique',
  'Namibia','Nauru','Nepal','Nicaragua','Níger','Nigeria','Noruega','Nueva Zelanda',
  'Omán',
  'Países Bajos','Pakistán','Palaos','Panamá','Papúa Nueva Guinea','Paraguay','Perú','Polonia','Portugal',
  'Reino Unido','República Centroafricana','República Checa','República Democrática del Congo','República Dominicana','Ruanda','Rumania','Rusia',
  'Samoa','San Cristóbal y Nieves','San Marino','San Vicente y las Granadinas','Santa Lucía','Santo Tomé y Príncipe','Senegal','Serbia','Seychelles','Sierra Leona','Singapur','Siria','Somalia','Sri Lanka','Sudáfrica','Sudán','Sudán del Sur','Suecia','Suiza','Surinam',
  'Tailandia','Taiwán','Tanzania','Tayikistán','Timor-Leste','Togo','Tonga','Trinidad y Tobago','Túnez','Turkmenistán','Turquía','Tuvalu',
  'Ucrania','Uganda','Uruguay','Uzbekistán',
  'Vanuatu','Vaticano','Venezuela','Vietnam',
  'Yemen','Yibuti',
  'Zambia','Zimbabue'
];

function installCountryAutocomplete() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach((modal) => {
    const labels = [...modal.querySelectorAll('label')];
    const countryLabel = labels.find((label) => label.textContent.trim().startsWith('País'));
    const input = countryLabel?.querySelector('input');
    if (!input || input.dataset.countryAutocomplete === '1') return;

    const id = 'regional17-country-list';
    let datalist = document.getElementById(id);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = id;
      COUNTRIES.forEach((country) => {
        const option = document.createElement('option');
        option.value = country;
        datalist.appendChild(option);
      });
      document.body.appendChild(datalist);
    }

    input.setAttribute('list', id);
    input.setAttribute('autocomplete', 'country-name');
    input.dataset.countryAutocomplete = '1';
  });
}

const observer = new MutationObserver(installCountryAutocomplete);
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('load', installCountryAutocomplete);
setTimeout(installCountryAutocomplete, 100);
