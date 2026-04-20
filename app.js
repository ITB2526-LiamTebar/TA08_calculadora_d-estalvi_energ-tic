/* ========================================
   Energy Calculator ITB — app.js
   ASIX 1D · Tebar Liam & Solé Fèlix
   ======================================== */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const JSON_URL = 'https://raw.githubusercontent.com/ITB2526-LiamTebar/TA08_calculadora_d-estalvi_energ-tic/refs/heads/main/dataclean.json';

const FALLBACK_DATA = {"_comment":"The 4 key indicators selected: date, document_type, entity, total_amount","documents":[{"document_type":"material_invoice","date":"2024-04-30","due_date":"2024-05-31","entity":"Lyreco","total_amount":277.13,"vat":48.10,"taxable_base":229.03,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-05-31","due_date":"2024-06-30","entity":"Lyreco","total_amount":261.24,"vat":45.34,"taxable_base":215.90,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-06-30","due_date":"2024-07-31","entity":"Lyreco","total_amount":34.36,"vat":5.96,"taxable_base":28.40,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"material_invoice","date":"2024-10-31","due_date":"2024-11-30","entity":"Lyreco","total_amount":198.56,"vat":34.46,"taxable_base":164.10,"payment_method":"SEPA","category":"office_supplies"},{"document_type":"service_invoice","date":"2024-05-23","entity":"Maintenance","total_amount":2548.02,"vat":442.22,"taxable_base":2105.80,"category":"technical_services"},{"document_type":"service_invoice","date":"2024-07-05","entity":"Maintenance","total_amount":348.48,"vat":60.48,"taxable_base":288.00,"category":"technical_services"},{"document_type":"service_invoice","date":"2024-09-13","entity":"Maintenance","total_amount":1012.98,"vat":175.81,"taxable_base":837.17,"category":"technical_services"},{"document_type":"cleaning_invoice","date":"2024-06-20","entity":"Neteges","total_amount":750.26,"vat":130.21,"taxable_base":620.05,"category":"cleaning"},{"document_type":"cleaning_invoice","date":"2024-05-27","entity":"Neteges","total_amount":454.72,"vat":78.92,"taxable_base":375.80,"category":"cleaning"},{"document_type":"telecom_invoice","date":"2024-03-04","entity":"O2","total_amount":50.00,"vat":8.67,"taxable_base":41.32,"category":"telecommunications"},{"document_type":"telecom_invoice","date":"2024-05","entity":"DIGI","total_amount":30.00,"vat":5.21,"taxable_base":24.79,"category":"telecommunications"},{"document_type":"water_consumption","date":"2024-02-25","entity":"Water","average_consumption_liters":200},{"document_type":"water_consumption","date":"2024-02-28","entity":"Water","average_consumption_liters":400},{"document_type":"water_consumption","date":"2024-02-29","entity":"Water","average_consumption_liters":450},{"document_type":"indicator","date":"2024-11-15","entity":"ASIXc1A","percentage":15.00},{"document_type":"indicator","date":"2025-01-20","entity":"ASIXc1C","percentage":68.75},{"document_type":"energy_report","date":"2025-01","entity":"ITB_Plant","total_production_kwh":72021.35,"total_consumption_kwh":165.55,"self_consumption_percentage":100,"revenue_eur":0.31}]};

const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_ES  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/** School calendar month indices (Sep–Jun, 0-indexed) */
const SCHOOL_MONTHS = [0, 1, 2, 3, 4, 8, 9, 10, 11];

/**
 * Month type classification for chart bar colouring:
 *   'holiday'  — school holiday periods (Christmas, Easter)
 *   'break'    — summer break (no school)
 *   'school'   — normal academic month
 */
const MONTH_TYPE = [
  'holiday',  // Jan  — Christmas spillover
  'school',   // Feb
  'school',   // Mar
  'holiday',  // Apr  — Easter
  'school',   // May
  'school',   // Jun
  'break',    // Jul  — summer
  'break',    // Aug  — summer
  'school',   // Sep
  'school',   // Oct
  'school',   // Nov
  'holiday',  // Dec  — Christmas
];

const HOLIDAY_FACTORS = {
  electricity:[0.85, 1.00, 1.00, 0.88, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.80],
  water:      [0.85, 1.00, 1.00, 0.90, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.80],
  supplies:   [0.80, 1.00, 1.00, 0.85, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.75],
  cleaning:   [0.85, 1.00, 1.00, 0.88, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.80],
};

const SEASONAL = {
  electricity: [1.15, 1.10, 1.00, 0.90, 0.85, 0.70, 0.50, 0.45, 0.85, 1.00, 1.10, 1.20],
  water:       [1.00, 1.00, 1.05, 1.00, 1.05, 0.90, 0.20, 0.20, 1.05, 1.10, 1.05, 1.00],
  supplies:    [1.10, 1.10, 1.00, 1.10, 1.05, 0.60, 0.20, 0.20, 1.20, 1.15, 1.10, 1.00],
  cleaning:    [1.05, 1.00, 1.00, 1.00, 1.00, 0.70, 0.40, 0.40, 1.10, 1.05, 1.00, 1.00]
};

// 3-year reduction plan targets per indicator (as fraction of baseline)
const REDUCTION_PLAN = {
  // [year1, year2, year3] as % reduction from baseline
  electricity: [10, 20, 30],
  water:       [15, 20, 25],
  supplies:    [30, 35, 40],
  cleaning:    [10, 15, 20],
};

// ─── State ───────────────────────────────────────────────────────────────────

let DATA           = null;
let chartInstance  = null;
let isDark         = false;
let activeTab      = 'calculations';

// ─── Theme toggle ────────────────────────────────────────────────────────────

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');

  const btn = document.getElementById('themeBtn');
  if (isDark) {
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M13 10A6 6 0 016 3a6 6 0 100 10 6 6 0 007-3z"
              stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      Dark mode`;
  } else {
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8"  y1="1"  x2="8"  y2="3"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="8"  y1="13" x2="8"  y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="1"  y1="8"  x2="3"  y2="8"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="13" y1="8"  x2="15" y2="8"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Light mode`;
  }

  if (chartInstance) renderChart();
  renderBreakdownChart();
}

// ─── Tab switching ────────────────────────────────────────────────────────────

function switchTab(tab) {
  activeTab = tab;

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');

  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById('panel-' + tab).classList.remove('hidden');

  if (tab === 'charts' && DATA) {
    setTimeout(() => {
      renderChart();
      renderBreakdownChart();
    }, 50);
  }

  if (tab === 'reduction' && DATA) {
    renderReductionSimulator();
  }
}

// ─── Status bar ──────────────────────────────────────────────────────────────

function setStatus(type, text) {
  document.getElementById('statusDot').className = 'status-dot ' + type;
  document.getElementById('statusText').textContent = text;
}

// ─── Data loading & parsing ──────────────────────────────────────────────────

function parseDocuments(json) {
  const docs = json.documents || [];

  // ── Electricity ───────────────────────────────────────────────────────────
  const energyReports  = docs.filter(d => d.document_type === 'energy_report');
  const totalKwh       = energyReports.reduce((sum, d) => sum + (d.total_production_kwh || 0), 0);
  const electricity_kwh = energyReports.length > 0
    ? Math.round((totalKwh / energyReports.length) * 12)
    : 0;

  // ── Solar production ──────────────────────────────────────────────────────
  const solar_kwh = energyReports.reduce((sum, d) => sum + (d.total_production_kwh || 0), 0);

  // ── Water ─────────────────────────────────────────────────────────────────
  const waterDocs       = docs.filter(d => d.document_type === 'water_consumption');
  const avgLitersPerDay = waterDocs.length > 0
    ? waterDocs.reduce((sum, d) => sum + (d.average_consumption_liters || 0), 0) / waterDocs.length
    : 0;
  const water_m3 = Math.round(avgLitersPerDay * 365 / 1000);

  // ── Office supplies ───────────────────────────────────────────────────────
  const officeInvoices = docs.filter(d => d.category === 'office_supplies');
  const totalOffice    = officeInvoices.reduce((sum, d) => sum + (d.total_amount || 0), 0);
  const officeMonths   = uniqueMonths(officeInvoices);
  const supplies_eur   = Math.round((totalOffice / officeMonths) * 12);

  // ── Cleaning products ─────────────────────────────────────────────────────
  const cleaningInvoices = docs.filter(d => d.category === 'cleaning');
  const totalCleaning    = cleaningInvoices.reduce((sum, d) => sum + (d.total_amount || 0), 0);
  const cleaningMonths   = uniqueMonths(cleaningInvoices);
  const cleaning_eur     = Math.round((totalCleaning / cleaningMonths) * 12);

  return {
    electricity:  electricity_kwh,
    water:        water_m3,
    supplies:     supplies_eur,
    cleaning:     cleaning_eur,
    solar_kwh,
    _energyReports: energyReports,
    _waterDocs:     waterDocs,
    _officeInvoices: officeInvoices,
    _cleaningInvoices: cleaningInvoices,
  };
}

function uniqueMonths(docs) {
  const set = new Set(docs.map(d => (d.date || '').slice(0, 7)));
  return set.size || 1;
}

function isSandboxed() {
  try {
    var h = window.location.hostname;
    if (!h || h === '') return true;
    if (/codepen\.io|jsfiddle\.net|stackblitz\.com|csb\.app|codesandbox\.io/.test(h)) return true;
    if (window.self !== window.top) return true;
  } catch(e) { return true; }
  return false;
}

async function autoLoad() {
  if (isSandboxed()) {
    DATA = parseDocuments(FALLBACK_DATA);
    setStatus('ok', 'Data loaded (bundled) — deploy to GitHub Pages for live sync');
    renderAll();
    return;
  }

  setStatus('loading', 'Loading data from GitHub…');
  try {
    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, 5000);
    const res = await fetch(JSON_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    DATA = parseDocuments(json);
    setStatus('ok', 'Data loaded — dataclean.json · ITB2526-LiamTebar');
    renderAll();
  } catch (e) {
    console.warn('Fetch failed, using bundled fallback:', e.message);
    DATA = parseDocuments(FALLBACK_DATA);
    setStatus('ok', 'Loaded from bundled data — GitHub unreachable');
    renderAll();
  }
}

// ─── Data accessors ──────────────────────────────────────────────────────────

function getVal(key) {
  return (DATA && DATA[key]) ? DATA[key] : 0;
}

const UNIT_COSTS = { electricity: 0.18, water: 2.45 };

function getCostUnit(key) {
  return UNIT_COSTS[key] || null;
}

// ─── Seasonal calculations ────────────────────────────────────────────────────

function seasonalMonthly(key) {
  const annual   = getVal(key);
  const seasonal = SEASONAL[key]  || Array(12).fill(1);
  const holidays = HOLIDAY_FACTORS[key] || Array(12).fill(1);
  const combined = seasonal.map((s, i) => s * holidays[i]);
  const total    = combined.reduce((a, b) => a + b, 0);
  return combined.map(f => Math.round((annual / total) * f * 10) / 10);
}

function sumMonths(key, months) {
  const monthly = seasonalMonthly(key);
  return months.reduce((acc, m) => acc + monthly[m], 0);
}

function buildMonthRange(from, to) {
  const months = [];
  if (from <= to) {
    for (let i = from; i <= to; i++) months.push(i);
  } else {
    for (let i = from; i < 12; i++) months.push(i);
    for (let i = 0;    i <= to; i++) months.push(i);
  }
  return months;
}

// ─── Render all ──────────────────────────────────────────────────────────────

function renderAll() {
  document.getElementById('errorSection').style.display = 'none';
  document.getElementById('mainContent').style.display  = 'block';
  renderMetrics();
  renderCalcs();
  renderReductionSimulator();
}

// ─── Metrics overview cards ───────────────────────────────────────────────────

function renderMetrics() {
  const elec  = getVal('electricity');
  const water = getVal('water');
  const supp  = getVal('supplies');
  const clean = getVal('cleaning');
  const co2   = Math.round(elec * 0.233);
  const academicElec = Math.round(sumMonths('electricity', SCHOOL_MONTHS));

  const cards = [
    { label: 'Electricity',     value: elec.toLocaleString('en'),         unit: 'kWh / year'    },
    { label: 'Water',           value: water.toLocaleString('en'),        unit: 'm³ / year'     },
    { label: 'Office supplies', value: supp.toLocaleString('en'),         unit: '€ / year'      },
    { label: 'Cleaning',        value: clean.toLocaleString('en'),        unit: '€ / year'      },
    { label: 'CO₂ equivalent',  value: co2.toLocaleString('en'),          unit: 'kg CO₂ eq.'    },
    { label: 'Academic year',   value: academicElec.toLocaleString('en'), unit: 'kWh (Sep–Jun)' },
  ];

  document.getElementById('metricsGrid').innerHTML = cards.map(c => `
    <div class="metric-card">
      <div class="m-label">${c.label}</div>
      <div class="m-value">${c.value}</div>
      <div class="m-unit">${c.unit}</div>
    </div>`).join('');
}

// ─── Calculation cards ────────────────────────────────────────────────────────

function monthOptions(selected) {
  return MONTHS.map((m, i) =>
    `<option value="${i}" ${i === selected ? 'selected' : ''}>${m}</option>`
  ).join('');
}

function getCalcDefinitions() {
  return [
    // 1 ── Electricity next year
    {
      id: 'c1',
      title: 'Electricity — next year',
      desc: 'Annual projection with seasonal weighting and custom growth rate.',
      inputs: `
        <div class="input-row">
          <label>Change</label>
          <input type="number" id="c1_var" value="3" min="-50" max="50" step="1"
                 oninput="calcOne('c1')">
          <span class="pct-label">%</span>
        </div>`,
      calc() {
        const v    = parseFloat(document.getElementById('c1_var')?.value || 0);
        const base = getVal('electricity');
        const proj = Math.round(base * (1 + v / 100));
        const cu   = getCostUnit('electricity');
        const sec  = cu ? `Estimated cost: €${Math.round(proj * cu).toLocaleString('en')}` : '';
        return { main: proj.toLocaleString('en') + ' kWh', sec };
      }
    },

    // 2 ── Electricity period
    {
      id: 'c2',
      title: 'Electricity — custom period',
      desc: 'Sum of estimated electricity consumption between two selected months.',
      inputs: `
        <div class="input-row">
          <label>From</label>
          <select id="c2_from" onchange="calcOne('c2')">${monthOptions(8)}</select>
          <label>to</label>
          <select id="c2_to" onchange="calcOne('c2')">${monthOptions(11)}</select>
        </div>`,
      calc() {
        const f      = parseInt(document.getElementById('c2_from')?.value ?? 8);
        const t      = parseInt(document.getElementById('c2_to')?.value   ?? 11);
        const months = buildMonthRange(f, t);
        const val    = Math.round(sumMonths('electricity', months));
        return { main: val.toLocaleString('en') + ' kWh', sec: `${months.length} month(s)` };
      }
    },

    // 3 ── Water next year
    {
      id: 'c3',
      title: 'Water — next year',
      desc: 'Annual water projection with school-cycle patterns and adjustable trend.',
      inputs: `
        <div class="input-row">
          <label>Change</label>
          <input type="number" id="c3_var" value="2" min="-50" max="50" step="1"
                 oninput="calcOne('c3')">
          <span class="pct-label">%</span>
        </div>`,
      calc() {
        const v    = parseFloat(document.getElementById('c3_var')?.value || 0);
        const base = getVal('water');
        const proj = Math.round(base * (1 + v / 100) * 10) / 10;
        const cu   = getCostUnit('water');
        const sec  = cu ? `Estimated cost: €${Math.round(proj * cu).toLocaleString('en')}` : '';
        return { main: proj.toLocaleString('en') + ' m³', sec };
      }
    },

    // 4 ── Water period
    {
      id: 'c4',
      title: 'Water — custom period',
      desc: 'Estimated water consumption for a selected month range.',
      inputs: `
        <div class="input-row">
          <label>From</label>
          <select id="c4_from" onchange="calcOne('c4')">${monthOptions(8)}</select>
          <label>to</label>
          <select id="c4_to" onchange="calcOne('c4')">${monthOptions(11)}</select>
        </div>`,
      calc() {
        const f      = parseInt(document.getElementById('c4_from')?.value ?? 8);
        const t      = parseInt(document.getElementById('c4_to')?.value   ?? 11);
        const months = buildMonthRange(f, t);
        const val    = Math.round(sumMonths('water', months) * 10) / 10;
        return { main: val.toLocaleString('en') + ' m³', sec: `${months.length} month(s)` };
      }
    },

    // 5 ── Office supplies next year
    {
      id: 'c5',
      title: 'Office supplies — next year',
      desc: 'Projected annual spend on paper, ink and stationery.',
      inputs: `
        <div class="input-row">
          <label>Change</label>
          <input type="number" id="c5_var" value="-5" min="-80" max="50" step="1"
                 oninput="calcOne('c5')">
          <span class="pct-label">%</span>
        </div>`,
      calc() {
        const v    = parseFloat(document.getElementById('c5_var')?.value || 0);
        const base = getVal('supplies');
        const proj = Math.round(base * (1 + v / 100));
        const diff = proj - base;
        const sign = diff >= 0 ? '+' : '';
        return {
          main: '€' + proj.toLocaleString('en'),
          sec: `${sign}€${diff.toLocaleString('en')} vs previous year`
        };
      }
    },

    // 6 ── Office supplies academic year
    {
      id: 'c6',
      title: 'Office supplies — academic year',
      desc: 'Spend from September to June (active school months only).',
      inputs: '',
      calc() {
        const val   = Math.round(sumMonths('supplies', SCHOOL_MONTHS));
        const total = getVal('supplies');
        const pct   = total > 0 ? Math.round(val / total * 100) : 0;
        return { main: '€' + val.toLocaleString('en'), sec: `${pct}% of annual total` };
      }
    },

    // 7 ── Cleaning next year
    {
      id: 'c7',
      title: 'Cleaning products — next year',
      desc: 'Projected annual spend on cleaning supplies for the school.',
      inputs: `
        <div class="input-row">
          <label>Change</label>
          <input type="number" id="c7_var" value="0" min="-80" max="50" step="1"
                 oninput="calcOne('c7')">
          <span class="pct-label">%</span>
        </div>`,
      calc() {
        const v    = parseFloat(document.getElementById('c7_var')?.value || 0);
        const proj = Math.round(getVal('cleaning') * (1 + v / 100));
        return { main: '€' + proj.toLocaleString('en'), sec: '' };
      }
    },

    // 8 ── Cleaning period
    {
      id: 'c8',
      title: 'Cleaning products — custom period',
      desc: 'Estimated cleaning product spend for a selected month range.',
      inputs: `
        <div class="input-row">
          <label>From</label>
          <select id="c8_from" onchange="calcOne('c8')">${monthOptions(8)}</select>
          <label>to</label>
          <select id="c8_to" onchange="calcOne('c8')">${monthOptions(11)}</select>
        </div>`,
      calc() {
        const f      = parseInt(document.getElementById('c8_from')?.value ?? 8);
        const t      = parseInt(document.getElementById('c8_to')?.value   ?? 11);
        const months = buildMonthRange(f, t);
        const val    = Math.round(sumMonths('cleaning', months));
        return { main: '€' + val.toLocaleString('en'), sec: `${months.length} month(s) selected` };
      }
    }
  ];
}

function renderCalcs() {
  const calcs = getCalcDefinitions();
  window._calcs = calcs;

  document.getElementById('calcGrid').innerHTML = calcs.map(c => `
    <div class="calc-card">
      <h3>${c.title}</h3>
      <div class="calc-desc">${c.desc}</div>
      ${c.inputs}
      <div class="calc-result">
        <div class="r-label">Result</div>
        <div class="r-val"       id="rval_${c.id}">—</div>
        <div class="r-secondary" id="rsec_${c.id}"></div>
      </div>
    </div>`).join('');

  calcs.forEach(c => calcOne(c.id));
}

function calcOne(id) {
  const c = window._calcs && window._calcs.find(x => x.id === id);
  if (!c) return;
  try {
    const { main, sec } = c.calc();
    const rv = document.getElementById('rval_' + id);
    const rs = document.getElementById('rsec_' + id);
    if (rv) rv.textContent = main;
    if (rs) rs.textContent = sec || '';
  } catch (e) {
    console.warn('Calc error:', id, e);
  }
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function renderChart() {
  const key  = document.getElementById('chartIndicator')?.value || 'electricity';
  const data = seasonalMonthly(key);

  const COLOR = {
    school:  isDark ? '#4db87a' : '#1a5c3a',
    holiday: isDark ? '#e07840' : '#b85c1a',
    break:   isDark ? '#3a3a35' : '#d4d2cc',
  };
  const tickColor = isDark ? '#6b6a65' : '#9b9a95';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const bgColors  = MONTH_TYPE.map(t => COLOR[t]);

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const ctx = document.getElementById('monthlyChart')?.getContext('2d');
  if (!ctx) return;

  const LABELS = {
    school:  'Academic month',
    holiday: 'Holiday period (Christmas / Easter)',
    break:   'Summer break',
  };

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [{
        label: key,
        data,
        backgroundColor: bgColors,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const type = MONTH_TYPE[ctx.dataIndex];
              return ` ${ctx.parsed.y.toFixed(1)} — ${LABELS[type]}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 11 }, autoSkip: false },
          grid:  { display: false },
          border:{ display: false }
        },
        y: {
          ticks: { color: tickColor, font: { size: 11 } },
          grid:  { color: gridColor },
          border:{ display: false }
        }
      }
    }
  });

  updateChartLegend();
}

function updateChartLegend() {
  var legendEl = document.getElementById('chartLegend');
  if (!legendEl) return;
  var items = [
    { color: isDark ? '#4db87a' : '#1a5c3a', label: 'Academic month'  },
    { color: isDark ? '#e07840' : '#b85c1a', label: 'Holiday period'   },
    { color: isDark ? '#3a3a35' : '#d4d2cc', label: 'Summer break'     },
  ];
  legendEl.innerHTML = items.map(function(it) {
    return '<span class="legend-item"><span class="legend-dot" style="background:' + it.color + '"></span>' + it.label + '</span>';
  }).join('');
}

function renderBreakdownChart() {
  var barsEl  = document.getElementById('breakdownBars');
  var totalEl = document.getElementById('breakdownTotal');
  if (!barsEl) return;

  var elec  = getVal('electricity');
  var water = getVal('water');
  var supp  = getVal('supplies');
  var clean = getVal('cleaning');

  var elecCost  = Math.round(elec  * (getCostUnit('electricity') || 0.18));
  var waterCost = Math.round(water * (getCostUnit('water')       || 2.45));
  var grandTotal = elecCost + waterCost + supp + clean;

  var items = [
    { label: 'Electricity',     value: elecCost,  raw: elec,  rawUnit: 'kWh', color: isDark ? '#4db87a' : '#1a5c3a' },
    { label: 'Water',           value: waterCost, raw: water, rawUnit: 'm³',  color: isDark ? '#4a9fd4' : '#1a6a9a' },
    { label: 'Office supplies', value: supp,      raw: null,  rawUnit: '',    color: isDark ? '#9a70e0' : '#5a3ab0' },
    { label: 'Cleaning',        value: clean,     raw: null,  rawUnit: '',    color: isDark ? '#e07840' : '#b07c10' },
  ];

  barsEl.innerHTML = items.map(function(item) {
    var pct    = grandTotal > 0 ? Math.round(item.value / grandTotal * 100) : 0;
    var barPct = grandTotal > 0 ? (item.value / grandTotal * 100) : 0;
    var subtext = item.raw !== null
      ? item.raw.toLocaleString('en') + ' ' + item.rawUnit + ' &nbsp;·&nbsp; €' + item.value.toLocaleString('en')
      : '€' + item.value.toLocaleString('en');

    return '<div class="bd-row">'
      + '<div class="bd-label">' + item.label + '</div>'
      + '<div class="bd-bar-wrap">'
      +   '<div class="bd-bar" style="width:' + barPct.toFixed(1) + '%;background:' + item.color + '"></div>'
      + '</div>'
      + '<div class="bd-right">'
      +   '<span class="bd-pct">' + pct + '%</span>'
      +   '<span class="bd-sub">' + subtext + '</span>'
      + '</div>'
      + '</div>';
  }).join('');

  if (totalEl) {
    totalEl.innerHTML = 'Estimated annual total&ensp;<strong>€' + grandTotal.toLocaleString('en') + '</strong>';
  }
}

// ─── Reduction Simulator (3-year −30% plan) ───────────────────────────────────

function renderReductionSimulator() {
  const container = document.getElementById('reductionContent');
  if (!container || !DATA) return;

  const elec  = getVal('electricity');
  const water = getVal('water');
  const supp  = getVal('supplies');
  const clean = getVal('cleaning');

  const elecCost  = Math.round(elec  * 0.18);
  const waterCost = Math.round(water * 2.45);
  const baseTotalCost = elecCost + waterCost + supp + clean;
  const baseCO2 = Math.round(elec * 0.233);

  // Build year rows
  const indicators = [
    { key: 'electricity', label: 'Electricity', base: elec,  unit: 'kWh', hasCost: true, costPer: 0.18 },
    { key: 'water',       label: 'Water',       base: water, unit: 'm³',  hasCost: true, costPer: 2.45 },
    { key: 'supplies',    label: 'Office supplies', base: supp,  unit: '€', hasCost: false },
    { key: 'cleaning',    label: 'Cleaning',    base: clean, unit: '€', hasCost: false },
  ];

  function yearData(yearIdx) {
    return indicators.map(ind => {
      const pct = REDUCTION_PLAN[ind.key][yearIdx];
      const val = Math.round(ind.base * (1 - pct / 100) * 10) / 10;
      const cost = ind.hasCost ? Math.round(val * ind.costPer) : val;
      const saving = ind.hasCost
        ? Math.round(ind.base * ind.costPer) - cost
        : Math.round(ind.base) - val;
      return { ...ind, pct, val, cost, saving };
    });
  }

  const year1 = yearData(0);
  const year2 = yearData(1);
  const year3 = yearData(2);

  function totalCost(yd) {
    return yd.reduce((s, d) => s + d.cost, 0);
  }
  function totalSaving(yd) {
    return baseTotalCost - totalCost(yd);
  }

  const co2Year3 = Math.round(elec * (1 - REDUCTION_PLAN.electricity[2] / 100) * 0.233);

  container.innerHTML = `
    <div class="section-label">Baseline (current data)</div>
    <div class="reduction-baseline">
      <div class="rb-item">
        <span class="rb-label">Electricity</span>
        <span class="rb-val">${elec.toLocaleString('en')} kWh</span>
        <span class="rb-cost">€${elecCost.toLocaleString('en')}/yr</span>
      </div>
      <div class="rb-item">
        <span class="rb-label">Water</span>
        <span class="rb-val">${water.toLocaleString('en')} m³</span>
        <span class="rb-cost">€${waterCost.toLocaleString('en')}/yr</span>
      </div>
      <div class="rb-item">
        <span class="rb-label">Office supplies</span>
        <span class="rb-val">€${supp.toLocaleString('en')}</span>
        <span class="rb-cost">direct cost</span>
      </div>
      <div class="rb-item">
        <span class="rb-label">Cleaning</span>
        <span class="rb-val">€${clean.toLocaleString('en')}</span>
        <span class="rb-cost">direct cost</span>
      </div>
      <div class="rb-item rb-total">
        <span class="rb-label">Total annual cost</span>
        <span class="rb-val">€${baseTotalCost.toLocaleString('en')}</span>
        <span class="rb-cost">${baseCO2.toLocaleString('en')} kg CO₂</span>
      </div>
    </div>

    <div class="section-label" style="margin-top:28px">Projected values after applying each year's actions</div>
    <div class="reduction-years">
      ${[year1, year2, year3].map((yd, yi) => `
        <div class="ry-card">
          <div class="ry-header">
            <span class="ry-year">Year ${yi + 1}</span>
            <span class="ry-target">−${[10,20,30][yi]}% target</span>
          </div>
          <div class="ry-rows">
            ${yd.map(d => `
              <div class="ry-row">
                <span class="ry-label">${d.label}</span>
                <span class="ry-val">${d.val.toLocaleString('en')} ${d.unit}</span>
                <span class="ry-saving">−${d.pct}%</span>
              </div>`).join('')}
          </div>
          <div class="ry-footer">
            <div class="ry-cost">€${totalCost(yd).toLocaleString('en')} / year</div>
            <div class="ry-save">Saving: <strong>€${totalSaving(yd).toLocaleString('en')}</strong></div>
          </div>
        </div>`).join('')}
    </div>

    <div class="section-label" style="margin-top:28px">3-year impact summary</div>
    <div class="reduction-summary">
      <div class="rs-item">
        <div class="rs-icon">💶</div>
        <div class="rs-label">Total savings over 3 years</div>
        <div class="rs-val">€${(totalSaving(year1) + totalSaving(year2) + totalSaving(year3)).toLocaleString('en')}</div>
      </div>
      <div class="rs-item">
        <div class="rs-icon">⚡</div>
        <div class="rs-label">Electricity saved (Year 3)</div>
        <div class="rs-val">${Math.round(elec * 0.30).toLocaleString('en')} kWh</div>
      </div>
      <div class="rs-item">
        <div class="rs-icon">🌿</div>
        <div class="rs-label">CO₂ avoided (Year 3)</div>
        <div class="rs-val">${(baseCO2 - co2Year3).toLocaleString('en')} kg</div>
      </div>
      <div class="rs-item">
        <div class="rs-icon">💧</div>
        <div class="rs-label">Water saved (Year 3)</div>
        <div class="rs-val">${Math.round(water * 0.25).toLocaleString('en')} m³</div>
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', autoLoad);
