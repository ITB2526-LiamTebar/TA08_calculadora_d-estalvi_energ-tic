/* ========================================
   Energy Calculator ITB — app.js
   ASIX 1D · Tebar Liam & Solé Fèlix
   ======================================== */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const JSON_URL = 'https://raw.githubusercontent.com/ITB2526-LiamTebar/TA08_calculadora_d-estalvi_energ-tic/refs/heads/main/dataclean.json';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** School calendar month indices (Sep–Jun, 0-indexed) */
const SCHOOL_MONTHS = [0, 1, 2, 3, 4, 8, 9, 10, 11];

/**
 * Seasonal weighting factors per indicator.
 * >1 = above-average consumption, <1 = below-average. Sum ≈ 12.
 */
const SEASONAL = {
  electricity: [1.15, 1.10, 1.00, 0.90, 0.85, 0.70, 0.50, 0.45, 0.85, 1.00, 1.10, 1.20],
  water:       [0.80, 0.80, 0.90, 1.00, 1.10, 1.30, 1.40, 1.30, 1.10, 0.90, 0.80, 0.75],
  supplies:    [1.10, 1.10, 1.00, 1.10, 1.05, 0.60, 0.20, 0.20, 1.20, 1.15, 1.10, 1.00],
  cleaning:    [1.05, 1.00, 1.00, 1.00, 1.00, 0.70, 0.40, 0.40, 1.10, 1.05, 1.00, 1.00]
};

// ─── State ───────────────────────────────────────────────────────────────────

let DATA           = null;
let chartInstance  = null;
let chart2Instance = null;
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

  if (chartInstance)  renderChart();
  if (chart2Instance) renderBreakdownChart();
}

// ─── Tab switching ────────────────────────────────────────────────────────────

function switchTab(tab) {
  activeTab = tab;

  // Update button states
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');

  // Show/hide panels
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById('panel-' + tab).classList.remove('hidden');

  // Re-render charts when switching to the charts tab (canvas needs to be visible)
  if (tab === 'charts' && DATA) {
    setTimeout(() => {
      renderChart();
      renderBreakdownChart();
    }, 50);
  }
}

// ─── Status bar ──────────────────────────────────────────────────────────────

function setStatus(type, text) {
  document.getElementById('statusDot').className = 'status-dot ' + type;
  document.getElementById('statusText').textContent = text;
}

// ─── Data loading & parsing ──────────────────────────────────────────────────

/**
 * Parses the raw document array from the GitHub JSON into
 * a normalised object with the 4 key annual indicators.
 */
function parseDocuments(json) {
  const docs = json.documents || [];

  // ── Electricity ───────────────────────────────────────────────────────────
  // Source: energy_report → total_production_kwh (1 month available → annualise)
  const energyReports = docs.filter(d => d.document_type === 'energy_report');
  const totalKwh = energyReports.reduce((sum, d) => sum + (d.total_production_kwh || 0), 0);
  const electricity_kwh = energyReports.length > 0
    ? Math.round((totalKwh / energyReports.length) * 12)
    : 0;

  // ── Water ─────────────────────────────────────────────────────────────────
  // Source: water_consumption → average_consumption_liters (daily) → m³/year
  const waterDocs = docs.filter(d => d.document_type === 'water_consumption');
  const avgLitersPerDay = waterDocs.length > 0
    ? waterDocs.reduce((sum, d) => sum + (d.average_consumption_liters || 0), 0) / waterDocs.length
    : 0;
  const water_m3 = Math.round(avgLitersPerDay * 365 / 1000);

  // ── Office supplies ───────────────────────────────────────────────────────
  // Source: invoices with category 'office_supplies' → extrapolate to 12 months
  const officeInvoices = docs.filter(d => d.category === 'office_supplies');
  const totalOffice    = officeInvoices.reduce((sum, d) => sum + (d.total_amount || 0), 0);
  const officeMonths   = uniqueMonths(officeInvoices);
  const supplies_eur   = Math.round((totalOffice / officeMonths) * 12);

  // ── Cleaning products ─────────────────────────────────────────────────────
  // Source: invoices with category 'cleaning' → extrapolate to 12 months
  const cleaningInvoices = docs.filter(d => d.category === 'cleaning');
  const totalCleaning    = cleaningInvoices.reduce((sum, d) => sum + (d.total_amount || 0), 0);
  const cleaningMonths   = uniqueMonths(cleaningInvoices);
  const cleaning_eur     = Math.round((totalCleaning / cleaningMonths) * 12);

  return {
    electricity:  electricity_kwh,
    water:        water_m3,
    supplies:     supplies_eur,
    cleaning:     cleaning_eur,
    // Keep raw subsets for potential future use
    _energyReports: energyReports,
    _waterDocs:   waterDocs,
    _officeInvoices: officeInvoices,
    _cleaningInvoices: cleaningInvoices,
  };
}

/** Returns the count of distinct calendar months covered by a set of documents */
function uniqueMonths(docs) {
  const set = new Set(docs.map(d => (d.date || '').slice(0, 7)));
  return set.size || 1;
}

async function autoLoad() {
  setStatus('loading', 'Loading data from GitHub…');
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    DATA = parseDocuments(json);
    setStatus('ok', 'Data loaded — dataclean.json · ITB2526-LiamTebar');
    renderAll();
  } catch (e) {
    setStatus('error', `Failed to load data: ${e.message}`);
    document.getElementById('errorSection').style.display = 'block';
    document.getElementById('errorMsg').textContent = `Error: ${e.message}`;
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

/**
 * Distributes annual consumption into 12 monthly estimates using seasonal factors.
 * @param {string} key - Indicator key
 * @returns {number[]} Array of 12 monthly values
 */
function seasonalMonthly(key) {
  const annual  = getVal(key);
  const factors = SEASONAL[key] || Array(12).fill(1);
  const total   = factors.reduce((a, b) => a + b, 0);
  return factors.map(f => Math.round((annual / total) * f * 10) / 10);
}

/**
 * Sums monthly values for a given set of month indices.
 * @param {string}   key    - Indicator key
 * @param {number[]} months - 0-indexed month indices
 */
function sumMonths(key, months) {
  const monthly = seasonalMonthly(key);
  return months.reduce((acc, m) => acc + monthly[m], 0);
}

/**
 * Builds an array of month indices between from and to (handles year wrap).
 */
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
  // Charts render on tab switch to avoid invisible canvas issues
}

// ─── Metrics overview cards ───────────────────────────────────────────────────

function renderMetrics() {
  const elec  = getVal('electricity');
  const water = getVal('water');
  const supp  = getVal('supplies');
  const clean = getVal('cleaning');
  const co2   = Math.round(elec * 0.233);  // kg CO₂eq (avg Spain grid factor)
  const academicElec = Math.round(sumMonths('electricity', SCHOOL_MONTHS));

  const cards = [
    { label: 'Electricity',       value: elec.toLocaleString('en'),         unit: 'kWh / year'        },
    { label: 'Water',             value: water.toLocaleString('en'),        unit: 'm³ / year'         },
    { label: 'Office supplies',   value: supp.toLocaleString('en'),         unit: '€ / year'          },
    { label: 'Cleaning',          value: clean.toLocaleString('en'),        unit: '€ / year'          },
    { label: 'CO₂ equivalent',    value: co2.toLocaleString('en'),          unit: 'kg CO₂ eq.'        },
    { label: 'Academic year',     value: academicElec.toLocaleString('en'), unit: 'kWh (Sep–Jun)'     },
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
      desc: 'Annual water projection with summer peaks and adjustable trend.',
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

  const activeColor   = isDark ? '#4db87a' : '#1a5c3a';
  const inactiveColor = isDark ? '#3a3a35' : '#d4d2cc';
  const tickColor     = isDark ? '#6b6a65' : '#9b9a95';
  const gridColor     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  const bgColors = data.map((_, i) =>
    SCHOOL_MONTHS.includes(i) ? activeColor : inactiveColor
  );

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const ctx = document.getElementById('monthlyChart')?.getContext('2d');
  if (!ctx) return;

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
              const school = SCHOOL_MONTHS.includes(ctx.dataIndex);
              return ` ${ctx.parsed.y.toFixed(1)} — ${school ? 'academic' : 'summer break'}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 11 }, autoSkip: false },
          grid:   { display: false },
          border: { display: false }
        },
        y: {
          ticks: { color: tickColor, font: { size: 11 } },
          grid:  { color: gridColor },
          border:{ display: false }
        }
      }
    }
  });
}

function renderBreakdownChart() {
  if (chart2Instance) { chart2Instance.destroy(); chart2Instance = null; }

  const ctx = document.getElementById('breakdownChart')?.getContext('2d');
  if (!ctx) return;

  const elec  = getVal('electricity');
  const water = getVal('water');
  const supp  = getVal('supplies');
  const clean = getVal('cleaning');

  const elecCost  = Math.round(elec  * (getCostUnit('electricity') || 0.18));
  const waterCost = Math.round(water * (getCostUnit('water')       || 2.45));

  const values = [elecCost, waterCost, supp, clean];
  const labels = ['Electricity', 'Water', 'Office supplies', 'Cleaning'];
  const colors = isDark
    ? ['#4db87a', '#4a9fd4', '#9a70e0', '#e07840']
    : ['#1a5c3a', '#1a6a9a', '#5a3ab0', '#b07c10'];

  chart2Instance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: isDark ? '#9b9a95' : '#6b6a65',
            font: { size: 12, family: "'DM Sans', sans-serif" },
            boxWidth: 10,
            padding: 14,
            generateLabels(chart) {
              const ds   = chart.data.datasets[0];
              const total = ds.data.reduce((a, b) => a + b, 0);
              return chart.data.labels.map((label, i) => ({
                text: `${label}  €${ds.data[i].toLocaleString('en')}  (${Math.round(ds.data[i]/total*100)}%)`,
                fillStyle: ds.backgroundColor[i],
                strokeStyle: 'transparent',
                index: i
              }));
            }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` €${ctx.parsed.toLocaleString('en')}`
          }
        }
      }
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', autoLoad);
