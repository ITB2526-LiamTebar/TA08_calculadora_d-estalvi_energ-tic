/* ========================================
   Energy Calculator ITB — app.js
   ASIX 1D · Tebar Liam & Solé Fèlix
   ======================================== */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const JSON_URL = 'https://raw.githubusercontent.com/ITB2526-LiamTebar/TA08_calculadora_d-estalvi_energ-tic/refs/heads/main/dataclean.json';

const FALLBACK_DATA = {"_comment":"The 4 key indicators selected: date, document_type, entity, total_amount","documents":[{"document_type":"material_invoice","date":"2024-04-30","due_date":"2024-05-31","entity":"Lyreco","total_amount":277.13,"vat":48.10,"taxable_base":229.03,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-05-31","due_date":"2024-06-30","entity":"Lyreco","total_amount":261.24,"vat":45.34,"taxable_base":215.90,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-06-30","due_date":"2024-07-31","entity":"Lyreco","total_amount":34.36,"vat":5.96,"taxable_base":28.40,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-10-31","due_date":"2024-11-30","entity":"Lyreco","total_amount":198.56,"vat":34.46,"taxable_base":164.10,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"service_invoice","date":"2024-05-23","entity":"Maintenance","total_amount":2548.02,"vat":442.22,"taxable_base":2105.80,"category":"technical_services"},{"document_type":"service_invoice","date":"2024-07-05","entity":"Maintenance","total_amount":348.48,"vat":60.48,"taxable_base":288.00,"category":"technical_services"},{"document_type":"service_invoice","date":"2024-09-13","entity":"Maintenance","total_amount":1012.98,"vat":175.81,"taxable_base":837.17,"category":"technical_services"},{"document_type":"cleaning_invoice","date":"2024-06-20","entity":"Neteges","total_amount":750.26,"vat":130.21,"taxable_base":620.05,"category":"cleaning"},{"document_type":"cleaning_invoice","date":"2024-05-27","entity":"Neteges","total_amount":454.72,"vat":78.92,"taxable_base":375.80,"category":"cleaning"},{"document_type":"telecom_invoice","date":"2024-03-04","entity":"O2","total_amount":50.00,"vat":8.67,"taxable_base":41.32,"category":"telecommunications"},{"document_type":"telecom_invoice","date":"2024-05","entity":"DIGI","total_amount":30.00,"vat":5.21,"taxable_base":24.79,"category":"telecommunications"},{"document_type":"water_consumption","date":"2024-02-25","entity":"Water","average_consumption_liters":200},{"document_type":"water_consumption","date":"2024-02-28","entity":"Water","average_consumption_liters":400},{"document_type":"water_consumption","date":"2024-02-29","entity":"Water","average_consumption_liters":450},{"document_type":"indicator","date":"2024-11-15","entity":"ASIXc1A","percentage":15.00},{"document_type":"indicator","date":"2025-01-20","entity":"ASIXc1C","percentage":68.75},{"document_type":"energy_report","date":"2025-01","entity":"ITB_Plant","total_production_kwh":72021.35,"total_consumption_kwh":165.55,"self_consumption_percentage":100,"revenue_eur":0.31}]};

// ─── i18n ─────────────────────────────────────────────────────────────────────

let currentLang = 'en';

const TRANSLATIONS = {
  en: {
    // Status
    loading_github:     'Loading data from GitHub…',
    data_loaded:        'Data loaded — dataclean.json · ITB2526-LiamTebar',
    data_bundled:       'Data loaded (bundled)',
    data_fallback:      'Loaded from bundled data — GitHub unreachable',
    // Top bar
    theme_light:        'Light mode',
    theme_dark:         'Dark mode',
    // Tabs
    overview:           'Overview',
    tab_simulator:      'Simulator',
    tab_charts:         'Charts',
    tab_calcs:          'Calculations',
    tab_timeline:       'Timeline',
    // Charts panel
    monthly_consumption:'Estimated monthly consumption',
    indicator_label:    'Indicator:',
    opt_electricity:    'Electricity (kWh)',
    opt_water:          'Water (m³)',
    opt_supplies:       'Supplies (€)',
    opt_cleaning:       'Cleaning (€)',
    legend_school:      'School month',
    legend_holiday:     'Holidays',
    legend_summer:      'Summer',
    annual_breakdown:   'Annual breakdown by category',
    // Calcs panel
    calcs_by_period:    'Calculations by period',
    calc_result_label:  'Result',
    // Simulator
    reduction_measures: 'Applicable reduction measures',
    realtime_results:   'Real-time results',
    no_changes:         'no changes',
    annual_cost:        'Total annual cost',
    savings_label:      (pct, eur) => `−${pct}% · savings €${eur}`,
    // Timeline panel
    cost_evolution:     'Cost evolution — 36 months',
    reduction_plan:     '3-year reduction plan — target −30%',
    cumulative_target:  'Cumulative reduction target',
    year1_tag:          'Year 1 · 2025–2026',
    year1_title:        'Awareness and quick wins',
    year2_tag:          'Year 2 · 2026–2027',
    year2_title:        'Infrastructure improvements',
    year3_tag:          'Year 3 · 2027–2028',
    year3_title:        'Circular economy and review',
    mg_energy:          '⚡ Energy',
    mg_water:           '💧 Water',
    mg_supplies:        '📄 Supplies',
    mg_cleaning:        '🧹 Cleaning',
    kpi_total:          'Total cost',
    kpi_elec:           'Electricity',
    kpi_water:          'Water',
    kpi_supplies:       'Supplies',
    sdg_alignment:      'SDG Alignment',
    sdg4:               'Quality education — green coding in the curriculum',
    sdg6:               'Clean water — consumption reduction and rainwater harvesting',
    sdg7:               'Clean energy — LED, virtualisation, smart metering',
    sdg12:              'Responsible production — circular WEEE, recycled paper',
    sdg13:              'Climate action — CO₂ reduction, annual ESG audit',
    sdg17:              'Partnerships — collaboration between departments and manufacturers',
    // Months
    months:             ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    // Chart legends
    chart_school:       'School month',
    chart_holiday:      'Holidays',
    chart_summer:       'Summer',
    // Reduction chart
    rc_projected:       'Projected monthly cost',
    rc_target:          'Linear target −30%',
    rc_legend1:         'Monthly cost with applied measures',
    rc_legend2:         'Linear −30% target over 3 years',
    // Breakdown
    bd_total_label:     'Estimated total annual cost',
    // Metrics
    m_electricity:      'Electricity',
    m_water:            'Water',
    m_supplies:         'Office supplies',
    m_cleaning:         'Cleaning',
    m_co2:              'CO₂ equivalent',
    m_academic:         'Academic year',
    m_unit_kwh:         'kWh / year',
    m_unit_m3:          'm³ / year',
    m_unit_eur:         '€ / year',
    m_unit_co2:         'kg CO₂ eq.',
    m_unit_acad:        'kWh (Sep–Jun)',
    // CAT labels
    cat_electricity:    'Energy',
    cat_water:          'Water',
    cat_supplies:       'Supplies',
    cat_cleaning:       'Cleaning',
    // MEASURES labels
    measures: {
      electricity: [
        'Proxmox virtualisation',
        'Nightly auto-shutdown scripts',
        'Progressive 3-year LED upgrade',
        'Recondition old servers',
      ],
      water: [
        'Tap aerators and diffusers',
        'Detected leak repairs',
        'Rainwater harvesting',
        'Push-button replacement plan',
      ],
      supplies: [
        'Digitisation of exams',
        'Print quota system',
        '100% recycled paper purchasing',
        'Return toner cartridges to manufacturer',
      ],
      cleaning: [
        'Bulk buying and container refills',
        'Switch to eco-concentrate products',
        'Reusable microfibre cloths',
        'Automatic dosing system',
      ],
    },
    // Calc titles & descs
    calcs: [
      { title:'Electricity — next year',       desc:'Annual projection with adjustable trend.', from_label:'From', to_label:'to', var_label:'Variation', est_cost:'Estimated cost' },
      { title:'Electricity — custom period',   desc:'Estimated consumption between two selected months.', from_label:'From', to_label:'to', months_label:(n)=>`${n} month(s)` },
      { title:'Water — next year',             desc:'Annual projection with school and seasonal cycle.', var_label:'Variation', est_cost:'Estimated cost' },
      { title:'Water — custom period',         desc:'Estimated consumption for a month range.', from_label:'From', to_label:'to', months_label:(n)=>`${n} month(s)` },
      { title:'Supplies — next year',          desc:'Projected expenditure on consumables.', var_label:'Variation', vs_base:'vs base' },
      { title:'Supplies — school year',        desc:'Estimated expenditure from September to June.', of_total:'% of annual total' },
      { title:'Cleaning — next year',          desc:'Projected expenditure on cleaning products.', var_label:'Variation', vs_base:'vs base' },
      { title:'Cleaning — custom period',      desc:'Estimated cleaning expenditure for a month range.', from_label:'From', to_label:'to', months_label:(n)=>`${n} month(s)` },
    ],
    // Timeline start label
    tl_start: 'Start',
    // Error section
    err_load:      'Could not load data.',
    err_sub:       'Check your connection or that the repository is public.',
    err_retry:     'Retry',
  },
  es: {
    loading_github:     'Cargando datos desde GitHub…',
    data_loaded:        'Datos cargados — dataclean.json · ITB2526-LiamTebar',
    data_bundled:       'Datos cargados (integrados)',
    data_fallback:      'Cargado desde datos integrados — GitHub no accesible',
    theme_light:        'Modo claro',
    theme_dark:         'Modo oscuro',
    overview:           'Resumen',
    tab_simulator:      'Simulador',
    tab_charts:         'Gráficos',
    tab_calcs:          'Cálculos',
    tab_timeline:       'Cronograma',
    monthly_consumption:'Consumo mensual estimado',
    indicator_label:    'Indicador:',
    opt_electricity:    'Electricidad (kWh)',
    opt_water:          'Agua (m³)',
    opt_supplies:       'Consumibles (€)',
    opt_cleaning:       'Limpieza (€)',
    legend_school:      'Mes lectivo',
    legend_holiday:     'Vacaciones',
    legend_summer:      'Verano',
    annual_breakdown:   'Desglose anual por categoría',
    calcs_by_period:    'Cálculos por periodo',
    calc_result_label:  'Resultado',
    reduction_measures: 'Medidas de reducción aplicables',
    realtime_results:   'Resultados en tiempo real',
    no_changes:         'sin cambios',
    annual_cost:        'Coste anual total',
    savings_label:      (pct, eur) => `−${pct}% · ahorro €${eur}`,
    cost_evolution:     'Evolución del coste — 36 meses',
    reduction_plan:     'Plan de reducción a 3 años — objetivo −30%',
    cumulative_target:  'Objetivo de reducción acumulado',
    year1_tag:          'Año 1 · 2025–2026',
    year1_title:        'Concienciación y ganancias rápidas',
    year2_tag:          'Año 2 · 2026–2027',
    year2_title:        'Mejoras de infraestructura',
    year3_tag:          'Año 3 · 2027–2028',
    year3_title:        'Economía circular y revisión',
    mg_energy:          '⚡ Energía',
    mg_water:           '💧 Agua',
    mg_supplies:        '📄 Consumibles',
    mg_cleaning:        '🧹 Limpieza',
    kpi_total:          'Coste total',
    kpi_elec:           'Electricidad',
    kpi_water:          'Agua',
    kpi_supplies:       'Consumibles',
    sdg_alignment:      'Alineación con los ODS',
    sdg4:               'Educación de calidad — green coding en el currículo',
    sdg6:               'Agua limpia — reducción del consumo y aprovechamiento pluvial',
    sdg7:               'Energía limpia — LED, virtualización, smart metering',
    sdg12:              'Producción responsable — RAEE circular, papel reciclado',
    sdg13:              'Acción climática — reducción CO₂, auditoría ESG anual',
    sdg17:              'Alianzas — colaboración entre departamentos y fabricantes',
    months:             ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    chart_school:       'Mes lectivo',
    chart_holiday:      'Vacaciones',
    chart_summer:       'Verano',
    rc_projected:       'Coste mensual proyectado',
    rc_target:          'Objetivo lineal −30%',
    rc_legend1:         'Coste mensual con medidas aplicadas',
    rc_legend2:         'Objetivo lineal −30% a 3 años',
    bd_total_label:     'Coste anual estimado total',
    m_electricity:      'Electricidad',
    m_water:            'Agua',
    m_supplies:         'Material de oficina',
    m_cleaning:         'Limpieza',
    m_co2:              'Equivalente CO₂',
    m_academic:         'Año académico',
    m_unit_kwh:         'kWh / año',
    m_unit_m3:          'm³ / año',
    m_unit_eur:         '€ / año',
    m_unit_co2:         'kg CO₂ eq.',
    m_unit_acad:        'kWh (Sep–Jun)',
    cat_electricity:    'Energía',
    cat_water:          'Agua',
    cat_supplies:       'Consumibles',
    cat_cleaning:       'Limpieza',
    measures: {
      electricity: [
        'Virtualización Proxmox',
        'Scripts de auto-apagado nocturno',
        'Renovación progresiva LED a 3 años',
        'Recondicionamiento servidores antiguos',
      ],
      water: [
        'Airejadores y difusores en grifos',
        'Reparación de fugas detectadas',
        'Aprovechamiento de aguas pluviales',
        'Plan de sustitución de pulsadores',
      ],
      supplies: [
        'Digitalización de exámenes',
        'Sistema de cuotas de impresión',
        'Compra papel 100% reciclado',
        'Devolución de tóners al fabricante',
      ],
      cleaning: [
        'Compra a granel y rellenado de envases',
        'Sustitución por productos eco-concentrados',
        'Uso de trapos de microfibra reutilizables',
        'Sistema de dosificación automática',
      ],
    },
    calcs: [
      { title:'Electricidad — año siguiente',   desc:'Proyección anual con tendencia ajustable.', from_label:'De', to_label:'a', var_label:'Variación', est_cost:'Coste estimado' },
      { title:'Electricidad — periodo personalizado', desc:'Consumo estimado entre dos meses seleccionados.', from_label:'De', to_label:'a', months_label:(n)=>`${n} mes(es)` },
      { title:'Agua — año siguiente',           desc:'Proyección anual con ciclo escolar y estacional.', var_label:'Variación', est_cost:'Coste estimado' },
      { title:'Agua — periodo personalizado',   desc:'Consumo estimado para un rango de meses.', from_label:'De', to_label:'a', months_label:(n)=>`${n} mes(es)` },
      { title:'Consumibles — año siguiente',    desc:'Proyección de gasto en material fungible.', var_label:'Variación', vs_base:'vs base' },
      { title:'Consumibles — año escolar',      desc:'Gasto estimado de septiembre a junio.', of_total:'% del total anual' },
      { title:'Limpieza — año siguiente',       desc:'Proyección de gasto en productos de limpieza.', var_label:'Variación', vs_base:'vs base' },
      { title:'Limpieza — periodo personalizado', desc:'Gasto estimado en limpieza para un rango de meses.', from_label:'De', to_label:'a', months_label:(n)=>`${n} mes(es)` },
    ],
    tl_start: 'Inicio',
    err_load:  'No se pudieron cargar los datos.',
    err_sub:   'Comprueba tu conexión o que el repositorio sea público.',
    err_retry: 'Reintentar',
  }
};

function t(key) {
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS['en'][key] || key;
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'es' : 'en';
  const btn = document.getElementById('langBtn');
  btn.lastChild.textContent = currentLang === 'en' ? ' ES' : ' EN';
  applyTranslations();
  // Re-render all dynamic content
  if (DATA) {
    renderMetrics();
    renderSimulator();
    renderCalcs();
    renderBreakdownChart();
    if (!document.getElementById('panel-charts').classList.contains('hidden')) renderChart();
    if (!document.getElementById('panel-cronograma').classList.contains('hidden')) renderReductionChart();
  }
  updateThemeBtn();
}

function applyTranslations() {
  // Apply data-i18n attributes in HTML
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[currentLang][key]) el.textContent = TRANSLATIONS[currentLang][key];
  });
  // Update select options
  const sel = document.getElementById('chartIndicator');
  if (sel) {
    const opts = sel.options;
    const keys = ['opt_electricity','opt_water','opt_supplies','opt_cleaning'];
    for (let i = 0; i < opts.length; i++) opts[i].text = t(keys[i]);
  }
  // Update chart legend if visible
  updateChartLegend();
}

const MONTHS      = TRANSLATIONS.en.months; // will be overridden dynamically
const SCHOOL_MONTHS = [0,1,2,3,4,8,9,10,11];
const MONTH_TYPE  = ['holiday','school','school','holiday','school','school','break','break','school','school','school','holiday'];

const HOLIDAY_FACTORS = {
  electricity:[0.85,1.00,1.00,0.88,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.80],
  water:      [0.85,1.00,1.00,0.90,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.80],
  supplies:   [0.80,1.00,1.00,0.85,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.75],
  cleaning:   [0.85,1.00,1.00,0.88,1.00,1.00,1.00,1.00,1.00,1.00,1.00,0.80],
};
const SEASONAL = {
  electricity:[1.15,1.10,1.00,0.90,0.85,0.70,0.50,0.45,0.85,1.00,1.10,1.20],
  water:      [1.00,1.00,1.05,1.00,1.05,0.90,0.20,0.20,1.05,1.10,1.05,1.00],
  supplies:   [1.10,1.10,1.00,1.10,1.05,0.60,0.20,0.20,1.20,1.15,1.10,1.00],
  cleaning:   [1.05,1.00,1.00,1.00,1.00,0.70,0.40,0.40,1.10,1.05,1.00,1.00],
};

// Optimisation measures per category — labels resolved dynamically via i18n
const MEASURES = {
  electricity: [
    { id:'e1', get label(){ return t('measures').electricity[0]; }, pct:15, year:1 },
    { id:'e2', get label(){ return t('measures').electricity[1]; }, pct:10, year:1 },
    { id:'e3', get label(){ return t('measures').electricity[2]; }, pct: 8, year:1 },
    { id:'e4', get label(){ return t('measures').electricity[3]; }, pct: 5, year:2 },
  ],
  water: [
    { id:'w1', get label(){ return t('measures').water[0]; }, pct:20, year:1 },
    { id:'w2', get label(){ return t('measures').water[1]; }, pct:10, year:1 },
    { id:'w3', get label(){ return t('measures').water[2]; }, pct: 8, year:2 },
    { id:'w4', get label(){ return t('measures').water[3]; }, pct: 5, year:2 },
  ],
  supplies: [
    { id:'s1', get label(){ return t('measures').supplies[0]; }, pct:40, year:1 },
    { id:'s2', get label(){ return t('measures').supplies[1]; }, pct:15, year:1 },
    { id:'s3', get label(){ return t('measures').supplies[2]; }, pct:10, year:2 },
    { id:'s4', get label(){ return t('measures').supplies[3]; }, pct: 5, year:3 },
  ],
  cleaning: [
    { id:'c1', get label(){ return t('measures').cleaning[0]; }, pct:30, year:1 },
    { id:'c2', get label(){ return t('measures').cleaning[1]; }, pct:20, year:2 },
    { id:'c3', get label(){ return t('measures').cleaning[2]; }, pct:15, year:2 },
    { id:'c4', get label(){ return t('measures').cleaning[3]; }, pct:10, year:3 },
  ],
};

const CAT_META = {
  electricity:{ get label(){ return t('cat_electricity'); }, icon:'⚡', color:'elec',     unit:'kWh', costPer:0.18, hasCost:true  },
  water:      { get label(){ return t('cat_water');       }, icon:'💧', color:'water',    unit:'m³',  costPer:2.45, hasCost:true  },
  supplies:   { get label(){ return t('cat_supplies');    }, icon:'📄', color:'supplies', unit:'€',   costPer:1,    hasCost:false },
  cleaning:   { get label(){ return t('cat_cleaning');    }, icon:'🧹', color:'cleaning', unit:'€',   costPer:1,    hasCost:false },
};

// ─── State ────────────────────────────────────────────────────────────────────

let DATA          = null;
let chartInstance = null;
let isDark        = false;
const checkedMeasures = new Set();

// ─── Theme ────────────────────────────────────────────────────────────────────

function updateThemeBtn() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  if (isDark) {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13 10A6 6 0 016 3a6 6 0 100 10 6 6 0 007-3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg> ${t('theme_dark')}`;
  } else {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> ${t('theme_light')}`;
  }
}

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  updateThemeBtn();
  if (chartInstance) renderChart();
  renderBreakdownChart();
  renderReductionChart();
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('panel-' + tab).classList.remove('hidden');
  if (tab === 'charts' && DATA) setTimeout(() => { renderChart(); renderBreakdownChart(); }, 50);
  if (tab === 'calcs' && DATA) updateCalcResults();
  if (tab === 'cronograma' && DATA) setTimeout(() => renderReductionChart(), 50);
}

// ─── Status ───────────────────────────────────────────────────────────────────

function setStatus(type, text) {
  document.getElementById('statusDot').className = 'status-dot ' + type;
  document.getElementById('statusText').textContent = text;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

function parseDocuments(json) {
  const docs = json.documents || [];
  const energyReports   = docs.filter(d => d.document_type === 'energy_report');
  const totalKwh        = energyReports.reduce((s,d) => s + (d.total_production_kwh||0), 0);
  const electricity_kwh = energyReports.length > 0 ? Math.round((totalKwh/energyReports.length)*12) : 0;

  const waterDocs       = docs.filter(d => d.document_type === 'water_consumption');
  const avgL            = waterDocs.length > 0 ? waterDocs.reduce((s,d) => s+(d.average_consumption_liters||0),0)/waterDocs.length : 0;
  const water_m3        = Math.round(avgL * 365 / 1000);

  const officeInvoices  = docs.filter(d => d.category === 'office_supplies');
  const supplies_eur    = Math.round(officeInvoices.reduce((s,d)=>s+(d.total_amount||0),0) / uniqueMonths(officeInvoices) * 12);

  const cleaningInvoices= docs.filter(d => d.category === 'cleaning');
  const cleaning_eur    = Math.round(cleaningInvoices.reduce((s,d)=>s+(d.total_amount||0),0) / uniqueMonths(cleaningInvoices) * 12);

  return { electricity:electricity_kwh, water:water_m3, supplies:supplies_eur, cleaning:cleaning_eur };
}

function uniqueMonths(docs) {
  return new Set(docs.map(d => (d.date||'').slice(0,7))).size || 1;
}

function isSandboxed() {
  try {
    const h = window.location.hostname;
    if (!h || h==='') return true;
    if (/codepen\.io|jsfiddle\.net|stackblitz\.com|csb\.app|codesandbox\.io/.test(h)) return true;
    if (window.self !== window.top) return true;
  } catch(e) { return true; }
  return false;
}

async function autoLoad() {
  if (isSandboxed()) {
    DATA = parseDocuments(FALLBACK_DATA);
    setStatus('ok', t('data_bundled'));
    renderAll(); return;
  }
  setStatus('loading', t('loading_github'));
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res   = await fetch(JSON_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    DATA = parseDocuments(await res.json());
    setStatus('ok', t('data_loaded'));
    renderAll();
  } catch(e) {
    DATA = parseDocuments(FALLBACK_DATA);
    setStatus('ok', t('data_fallback'));
    renderAll();
  }
}

function getVal(key) { return (DATA && DATA[key]) ? DATA[key] : 0; }

// ─── Seasonal helpers ─────────────────────────────────────────────────────────

function seasonalMonthly(key, annualOverride) {
  const annual   = annualOverride !== undefined ? annualOverride : getVal(key);
  const seasonal = SEASONAL[key] || Array(12).fill(1);
  const holidays = HOLIDAY_FACTORS[key] || Array(12).fill(1);
  const combined = seasonal.map((s,i) => s * holidays[i]);
  const total    = combined.reduce((a,b) => a+b, 0);
  return combined.map(f => Math.round((annual/total)*f*10)/10);
}

function sumMonths(key, months, annualOverride) {
  return seasonalMonthly(key, annualOverride).reduce((acc,v,i) => months.includes(i) ? acc+v : acc, 0);
}

function buildMonthRange(from, to) {
  const ms = [];
  if (from <= to) { for (let i=from;i<=to;i++) ms.push(i); }
  else { for (let i=from;i<12;i++) ms.push(i); for (let i=0;i<=to;i++) ms.push(i); }
  return ms;
}

// ─── Optimisation helpers ─────────────────────────────────────────────────────

function getEffectiveReduction(category) {
  let rem = 1.0;
  MEASURES[category].forEach(m => { if (checkedMeasures.has(m.id)) rem *= (1-m.pct/100); });
  return 1 - rem;
}

function getProjectedValue(category) {
  return Math.round(getVal(category) * (1 - getEffectiveReduction(category)) * 10) / 10;
}

// ─── Render all ───────────────────────────────────────────────────────────────

function renderAll() {
  document.getElementById('errorSection').style.display = 'none';
  document.getElementById('mainContent').style.display  = 'block';
  renderMetrics();
  renderSimulator();
  renderCalcs();          // render calcs on load so they're ready
  renderBreakdownChart(); // FIX: also render breakdown on load
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function renderMetrics() {
  const elec = getVal('electricity'), water = getVal('water');
  const supp = getVal('supplies'),    clean = getVal('cleaning');
  const co2  = Math.round(elec * 0.233);
  const acadElec = Math.round(sumMonths('electricity', SCHOOL_MONTHS));

  document.getElementById('metricsGrid').innerHTML = [
    { label:t('m_electricity'),  value:elec.toLocaleString('ca'),      unit:t('m_unit_kwh')  },
    { label:t('m_water'),        value:water.toLocaleString('ca'),     unit:t('m_unit_m3')   },
    { label:t('m_supplies'),     value:supp.toLocaleString('ca'),      unit:t('m_unit_eur')  },
    { label:t('m_cleaning'),     value:clean.toLocaleString('ca'),     unit:t('m_unit_eur')  },
    { label:t('m_co2'),          value:co2.toLocaleString('ca'),       unit:t('m_unit_co2')  },
    { label:t('m_academic'),     value:acadElec.toLocaleString('ca'),  unit:t('m_unit_acad') },
  ].map(c => `
    <div class="metric-card">
      <div class="m-label">${c.label}</div>
      <div class="m-value">${c.value}</div>
      <div class="m-unit">${c.unit}</div>
    </div>`).join('');
}

// ─── SIMULATOR ───────────────────────────────────────────────────────────────
// NOTE: calc grid is now in its own tab (panel-calcs), so simContent only
//       renders the left measure checkboxes + right live-results panel.

function renderSimulator() {
  const container = document.getElementById('simContent');
  if (!container) return;

  const colsHtml = Object.keys(MEASURES).map(cat => {
    const meta = CAT_META[cat];
    return `
      <div class="sim-col">
        <div class="sim-col-header ${meta.color}">
          <span class="sim-col-icon">${meta.icon}</span>
          <span class="sim-col-label">${meta.label}</span>
        </div>
        <div class="sim-measures">
          ${MEASURES[cat].map(m => `
            <label class="sim-measure${checkedMeasures.has(m.id)?' checked':''}" id="lbl_${m.id}">
              <input type="checkbox" id="chk_${m.id}"
                ${checkedMeasures.has(m.id)?'checked':''}
                onchange="toggleMeasure('${m.id}','${cat}')">
              <span class="sim-measure-text">${m.label}</span>
              <span class="sim-measure-pct">−${m.pct}%</span>
            </label>`).join('')}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="sim-layout">
      <div class="sim-left">
        <div class="section-label">${t('reduction_measures')}</div>
        <div class="sim-cols">${colsHtml}</div>
      </div>
      <div class="sim-right">
        <div class="section-label">${t('realtime_results')}</div>
        <div id="simResults"></div>
      </div>
    </div>`;

  renderSimResults();
}

function toggleMeasure(id, cat) {
  const chk = document.getElementById('chk_'+id);
  const lbl = document.getElementById('lbl_'+id);
  if (chk.checked) { checkedMeasures.add(id); lbl.classList.add('checked'); }
  else             { checkedMeasures.delete(id); lbl.classList.remove('checked'); }
  renderSimResults();
  updateCalcResults();
  renderBreakdownChart(); // keep breakdown in sync with measures
}

function renderSimResults() {
  const el = document.getElementById('simResults');
  if (!el) return;

  let totalBase = 0, totalProj = 0;

  const rows = ['electricity','water','supplies','cleaning'].map(cat => {
    const meta   = CAT_META[cat];
    const base   = getVal(cat);
    const proj   = getProjectedValue(cat);
    const red    = getEffectiveReduction(cat);
    const redPct = Math.round(red * 100);

    // FIX: unify cost calculation — hasCost categories show physical unit + €,
    //      non-hasCost categories (supplies, cleaning) are already in €.
    const baseCost = meta.hasCost ? Math.round(base * meta.costPer) : Math.round(base);
    const projCost = meta.hasCost ? Math.round(proj * meta.costPer) : Math.round(proj);
    totalBase += baseCost;
    totalProj += projCost;
    const saving = baseCost - projCost;

    const baseStr = meta.hasCost
      ? `${base.toLocaleString('ca')} ${meta.unit} &nbsp;·&nbsp; €${baseCost.toLocaleString('ca')}`
      : `€${base.toLocaleString('ca')}`;
    const projStr = meta.hasCost
      ? `${proj.toLocaleString('ca')} ${meta.unit} &nbsp;·&nbsp; €${projCost.toLocaleString('ca')}`
      : `€${proj.toLocaleString('ca')}`;

    return `
      <div class="sr-row">
        <div class="sr-top">
          <div class="sr-left-info">
            <span class="sr-icon-badge ${meta.color}">${meta.icon}</span>
            <div>
              <div class="sr-cat-label">${meta.label}</div>
              <div class="sr-base-val">${baseStr}</div>
            </div>
          </div>
          <div class="sr-right-info">
            <div class="sr-proj-val${redPct>0?' improved':''}">${projStr}</div>
            ${redPct > 0
              ? `<div class="sr-saving-badge">${t('savings_label')(redPct, saving.toLocaleString('ca'))}</div>`
              : `<div class="sr-saving-badge neutral">${t('no_changes')}</div>`}
          </div>
        </div>
        <div class="sr-progress">
          <div class="sr-progress-fill ${meta.color}" style="width:${Math.round((1-red)*100)}%"></div>
          ${redPct > 0 ? `<div class="sr-progress-saved" style="width:${redPct}%"></div>` : ''}
        </div>
      </div>`;
  }).join('');

  const totalSaving = totalBase - totalProj;
  const totalPct    = totalBase > 0 ? Math.round(totalSaving/totalBase*100) : 0;

  el.innerHTML = `
    <div class="sr-list">${rows}</div>
    <div class="sr-total-bar${totalSaving>0?' saving':''}">
      <span class="sr-total-label">${t('annual_cost')}</span>
      <span class="sr-total-vals">
        <span class="sr-total-base${totalSaving>0?' striked':''}">€${totalBase.toLocaleString('ca')}</span>
        ${totalSaving > 0 ? `
          <span class="sr-arrow">→</span>
          <span class="sr-total-new">€${totalProj.toLocaleString('ca')}</span>
          <span class="sr-total-tag">−${totalPct}%&nbsp; ${currentLang==='es'?'ahorro':'savings'} €${totalSaving.toLocaleString('ca')}</span>
        ` : ''}
      </span>
    </div>`;
}

// ─── Calculations (now in its own tab) ───────────────────────────────────────

function monthOptions(sel) {
  return t('months').map((m,i) => `<option value="${i}"${i===sel?' selected':''}>${m}</option>`).join('');
}

function getCalcDefinitions() {
  const cl = TRANSLATIONS[currentLang].calcs;
  const mo = (sel) => t('months').map((m,i) => `<option value="${i}"${i===sel?' selected':''}>${m}</option>`).join('');
  return [
    { id:'c1', cat:'electricity', title: cl[0].title,
      desc: cl[0].desc,
      inputs:`<div class="input-row"><label>${cl[0].var_label}</label><input type="number" id="c1_var" value="3" min="-50" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c1_var')?.value||0);
        const p=Math.round(getProjectedValue('electricity')*(1+v/100));
        return { main:p.toLocaleString('ca')+' kWh', sec:`${cl[0].est_cost}: €${Math.round(p*0.18).toLocaleString('ca')}` };
      }},
    { id:'c2', cat:'electricity', title: cl[1].title,
      desc: cl[1].desc,
      inputs:`<div class="input-row"><label>${cl[1].from_label}</label><select id="c2_from" onchange="updateCalcResults()">${mo(8)}</select><label>${cl[1].to_label}</label><select id="c2_to" onchange="updateCalcResults()">${mo(11)}</select></div>`,
      calc() {
        const f=parseInt(document.getElementById('c2_from')?.value??8);
        const to=parseInt(document.getElementById('c2_to')?.value??11);
        const ms=buildMonthRange(f,to);
        const v=Math.round(sumMonths('electricity',ms,getProjectedValue('electricity')));
        return { main:v.toLocaleString('ca')+' kWh', sec:cl[1].months_label(ms.length) };
      }},
    { id:'c3', cat:'water', title: cl[2].title,
      desc: cl[2].desc,
      inputs:`<div class="input-row"><label>${cl[2].var_label}</label><input type="number" id="c3_var" value="2" min="-50" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c3_var')?.value||0);
        const p=Math.round(getProjectedValue('water')*(1+v/100)*10)/10;
        return { main:p.toLocaleString('ca')+' m³', sec:`${cl[2].est_cost}: €${Math.round(p*2.45).toLocaleString('ca')}` };
      }},
    { id:'c4', cat:'water', title: cl[3].title,
      desc: cl[3].desc,
      inputs:`<div class="input-row"><label>${cl[3].from_label}</label><select id="c4_from" onchange="updateCalcResults()">${mo(8)}</select><label>${cl[3].to_label}</label><select id="c4_to" onchange="updateCalcResults()">${mo(11)}</select></div>`,
      calc() {
        const f=parseInt(document.getElementById('c4_from')?.value??8);
        const to=parseInt(document.getElementById('c4_to')?.value??11);
        const ms=buildMonthRange(f,to);
        const v=Math.round(sumMonths('water',ms,getProjectedValue('water'))*10)/10;
        return { main:v.toLocaleString('ca')+' m³', sec:cl[3].months_label(ms.length) };
      }},
    { id:'c5', cat:'supplies', title: cl[4].title,
      desc: cl[4].desc,
      inputs:`<div class="input-row"><label>${cl[4].var_label}</label><input type="number" id="c5_var" value="-5" min="-80" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c5_var')?.value||0);
        const p=Math.round(getProjectedValue('supplies')*(1+v/100));
        const diff=p-Math.round(getVal('supplies'));
        return { main:'€'+p.toLocaleString('ca'), sec:`${diff>=0?'+':''}€${diff.toLocaleString('ca')} ${cl[4].vs_base}` };
      }},
    { id:'c6', cat:'supplies', title: cl[5].title,
      desc: cl[5].desc,
      inputs:'',
      calc() {
        const p=getProjectedValue('supplies');
        const v=Math.round(sumMonths('supplies',SCHOOL_MONTHS,p));
        return { main:'€'+v.toLocaleString('ca'), sec:`${p>0?Math.round(v/p*100):0}${cl[5].of_total}` };
      }},
    { id:'c7', cat:'cleaning', title: cl[6].title,
      desc: cl[6].desc,
      inputs:`<div class="input-row"><label>${cl[6].var_label}</label><input type="number" id="c7_var" value="0" min="-80" max="50" step="1" oninput="updateCalcResults()"><span class="pct-label">%</span></div>`,
      calc() {
        const v=parseFloat(document.getElementById('c7_var')?.value||0);
        const p=Math.round(getProjectedValue('cleaning')*(1+v/100));
        const diff=p-Math.round(getVal('cleaning'));
        return { main:'€'+p.toLocaleString('ca'), sec:`${diff>=0?'+':''}€${diff.toLocaleString('ca')} ${cl[6].vs_base}` };
      }},
    { id:'c8', cat:'cleaning', title: cl[7].title,
      desc: cl[7].desc,
      inputs:`<div class="input-row"><label>${cl[7].from_label}</label><select id="c8_from" onchange="updateCalcResults()">${mo(8)}</select><label>${cl[7].to_label}</label><select id="c8_to" onchange="updateCalcResults()">${mo(11)}</select></div>`,
      calc() {
        const f=parseInt(document.getElementById('c8_from')?.value??8);
        const to=parseInt(document.getElementById('c8_to')?.value??11);
        const ms=buildMonthRange(f,to);
        const v=Math.round(sumMonths('cleaning',ms,getProjectedValue('cleaning')));
        return { main:'€'+v.toLocaleString('ca'), sec:cl[7].months_label(ms.length) };
      }},
  ];
}

function renderCalcs() {
  const calcs = getCalcDefinitions();
  window._calcs = calcs;
  const grid = document.getElementById('calcGrid');
  if (!grid) return;
  grid.innerHTML = calcs.map(c => `
    <div class="calc-card">
      <div class="calc-cat-dot ${c.cat}"></div>
      <h3>${c.title}</h3>
      <div class="calc-desc">${c.desc}</div>
      ${c.inputs}
      <div class="calc-result">
        <div class="r-label">${t('calc_result_label')}</div>
        <div class="r-val" id="rval_${c.id}">—</div>
        <div class="r-secondary" id="rsec_${c.id}"></div>
      </div>
    </div>`).join('');
  updateCalcResults();
}

function updateCalcResults() {
  if (!window._calcs) return;
  window._calcs.forEach(c => {
    try {
      const { main, sec } = c.calc();
      const rv = document.getElementById('rval_'+c.id);
      const rs = document.getElementById('rsec_'+c.id);
      if (rv) rv.textContent = main;
      if (rs) rs.textContent = sec || '';
    } catch(e) {}
  });
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function renderChart() {
  const key  = document.getElementById('chartIndicator')?.value || 'electricity';
  const data = seasonalMonthly(key);
  const COLOR = {
    school:  isDark?'#4db87a':'#1a5c3a',
    holiday: isDark?'#e07840':'#b85c1a',
    break:   isDark?'#3a3a35':'#d4d2cc',
  };
  const tickColor = isDark?'#6b6a65':'#9b9a95';
  const gridColor = isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)';

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const ctx = document.getElementById('monthlyChart')?.getContext('2d');
  if (!ctx) return;

  const CLABELS = { school: t('chart_school'), holiday: t('chart_holiday'), break: t('chart_summer') };
  chartInstance = new Chart(ctx, {
    type:'bar',
    data:{ labels: t('months'), datasets:[{ label:key, data,
      backgroundColor:MONTH_TYPE.map(t=>COLOR[t]), borderRadius:4, borderSkipped:false }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        tooltip:{ callbacks:{ label:c=>` ${c.parsed.y.toFixed(1)} — ${CLABELS[MONTH_TYPE[c.dataIndex]]}` }}
      },
      scales:{
        x:{ ticks:{color:tickColor,font:{size:11},autoSkip:false}, grid:{display:false}, border:{display:false} },
        y:{ ticks:{color:tickColor,font:{size:11}}, grid:{color:gridColor}, border:{display:false} }
      }
    }
  });
  updateChartLegend();
}

function updateChartLegend() {
  const el = document.getElementById('chartLegend');
  if (!el) return;
  el.innerHTML = [
    { color:isDark?'#4db87a':'#1a5c3a', label: t('chart_school')  },
    { color:isDark?'#e07840':'#b85c1a', label: t('chart_holiday') },
    { color:isDark?'#3a3a35':'#d4d2cc', label: t('chart_summer')  },
  ].map(it => `<span class="legend-item"><span class="legend-dot" style="background:${it.color}"></span>${it.label}</span>`).join('');
}

// FIX: renderBreakdownChart — corrected cost calculation so supplies/cleaning
//      (which are already in €) don't get multiplied by a costPer factor,
//      and the bd-sub shows the right label for each type.
function renderBreakdownChart() {
  const barsEl  = document.getElementById('breakdownBars');
  const totalEl = document.getElementById('breakdownTotal');
  if (!barsEl) return;

  const elec  = getVal('electricity');
  const water = getVal('water');
  const supp  = getVal('supplies');
  const clean = getVal('cleaning');

  // hasCost=true → convert physical unit to €; hasCost=false → already €
  const elecCost  = Math.round(elec  * 0.18);
  const waterCost = Math.round(water * 2.45);
  const suppCost  = Math.round(supp);
  const cleanCost = Math.round(clean);
  const grandTotal = elecCost + waterCost + suppCost + cleanCost;

  const items = [
    { label: t('cat_electricity'), value:elecCost,  rawVal:elec,  rawUnit:'kWh', color:isDark?'#4db87a':'#1a5c3a' },
    { label: t('cat_water'),       value:waterCost, rawVal:water, rawUnit:'m³',  color:isDark?'#4a9fd4':'#1a6a9a' },
    { label: t('cat_supplies'),    value:suppCost,  rawVal:null,  rawUnit:'',    color:isDark?'#9a70e0':'#5a3ab0' },
    { label: t('cat_cleaning'),    value:cleanCost, rawVal:null,  rawUnit:'',    color:isDark?'#e07840':'#b07c10' },
  ];

  barsEl.innerHTML = items.map(item => {
    const pct = grandTotal > 0 ? Math.round(item.value / grandTotal * 100) : 0;
    const bp  = grandTotal > 0 ? (item.value / grandTotal * 100) : 0;
    // FIX: sub-label — physical categories show "X unit · €Y", direct-€ ones just "€Y/any"
    const sub = item.rawVal !== null
      ? `${item.rawVal.toLocaleString('ca')} ${item.rawUnit} &nbsp;·&nbsp; €${item.value.toLocaleString('ca')}`
      : `€${item.value.toLocaleString('ca')} / any`;

    return `<div class="bd-row">
      <div class="bd-label">${item.label}</div>
      <div class="bd-bar-wrap"><div class="bd-bar" style="width:${bp.toFixed(1)}%;background:${item.color}"></div></div>
      <div class="bd-right"><span class="bd-pct">${pct}%</span><span class="bd-sub">${sub}</span></div>
    </div>`;
  }).join('');

  if (totalEl) totalEl.innerHTML = `${t('bd_total_label')}&ensp;<strong>€${grandTotal.toLocaleString('ca')}</strong>`;
}

// ─── Reduction trend chart (36 months) ───────────────────────────────────────

let reductionChartInstance = null;

function renderReductionChart() {
  const ctx = document.getElementById('reductionChart')?.getContext('2d');
  if (!ctx) return;

  // Calculate base annual cost (same logic as renderSimResults)
  const baseCost =
    Math.round(getVal('electricity') * 0.18) +
    Math.round(getVal('water')       * 2.45) +
    Math.round(getVal('supplies'))           +
    Math.round(getVal('cleaning'));

  if (baseCost === 0) return;

  // Measures grouped by year they activate (1-indexed)
  // Each measure reduces the remaining cost multiplicatively
  // We model a smooth monthly ramp: measures activate progressively within their year
  const measuresByYear = { 1:[], 2:[], 3:[] };
  Object.values(MEASURES).forEach(list =>
    list.forEach(m => measuresByYear[m.year]?.push(m.pct / 100))
  );

  // For each month 1..36, compute cumulative cost factor
  // Measures in year N start taking effect at month (N-1)*12 + 1
  // and ramp in linearly over 3 months to feel organic
  function costFactorAt(month) {
    let factor = 1.0;
    [1, 2, 3].forEach(yr => {
      const startMonth = (yr - 1) * 12 + 1;
      const rampDuration = yr === 1 ? 10 : 8;
      measuresByYear[yr].forEach(pct => {
        const progress = Math.min(1, Math.max(0, (month - startMonth + 1) / rampDuration));
        factor *= (1 - pct * progress);
      });
    });
    return factor;
  }

  const labels = [];
  const dataActual = [];
  const dataTarget = [];

  for (let m = 0; m <= 36; m++) {
    if (m === 0) {
      labels.push(t('tl_start'));
    } else {
      const yr  = Math.ceil(m / 12);
      const mo  = ((m - 1) % 12) + 1;
      const monthNames = t('months');
      labels.push(mo === 1 ? `${currentLang==='es'?'Año':'Year'} ${yr}` : (mo === 7 ? monthNames[m % 12 === 0 ? 11 : (m % 12) - 1] : ''));
    }
    const monthly = (baseCost / 12) * costFactorAt(m);
    dataActual.push(Math.round(monthly));
    // linear target line: from baseCost/12 down to 70% at month 36
    dataTarget.push(Math.round((baseCost / 12) * (1 - (0.30 * m / 36))));
  }

  const accentColor  = isDark ? '#4db87a' : '#1a5c3a';
  const targetColor  = isDark ? '#e07840' : '#b85c1a';
  const gridColor    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const tickColor    = isDark ? '#6b6a65' : '#9b9a95';

  if (reductionChartInstance) { reductionChartInstance.destroy(); reductionChartInstance = null; }

  reductionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('rc_projected'),
          data: dataActual,
          borderColor: accentColor,
          backgroundColor: isDark ? 'rgba(77,184,122,0.10)' : 'rgba(26,92,58,0.08)',
          borderWidth: 2.5,
          pointRadius: (ctx) => [0, 12, 24, 36].includes(ctx.dataIndex) ? 5 : 0,
          pointBackgroundColor: accentColor,
          fill: true,
          tension: 0.45,
        },
        {
          label: t('rc_target'),
          data: dataTarget,
          borderColor: targetColor,
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.dataset.label}: €${c.parsed.y.toLocaleString('ca')}/mes`,
          }
        },
        annotation: undefined,
      },
      scales: {
        x: {
          ticks: {
            color: tickColor,
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: false,
            callback: (val, i) => labels[i] || '',
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          ticks: {
            color: tickColor,
            font: { size: 11 },
            callback: (v) => '€' + v.toLocaleString('ca'),
          },
          grid: { color: gridColor },
          border: { display: false },
        }
      }
    }
  });

  // Legend
  const legendEl = document.getElementById('reductionLegend');
  if (legendEl) {
    legendEl.innerHTML = [
      { color: accentColor, label: t('rc_legend1') },
      { color: targetColor, dashed: true, label: t('rc_legend2') },
    ].map(it => `
      <span class="legend-item">
        <span class="legend-dot" style="background:${it.color};${it.dashed?'opacity:.6':''}"></span>
        ${it.label}
      </span>`).join('');
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => { applyTranslations(); autoLoad(); });
