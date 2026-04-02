/**
 * app.js — application state, API calls, and UI event wiring.
 * Imports rendering helpers from render.js; no DOM templates live here.
 */

import { detectCategory, formatTimestamp } from './utils.js';
import {
  renderGrid, renderNoResults, renderEmpty,
  renderError, renderCategoryFilters,
} from './render.js';
import { initGlitter } from './glitter.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let allEvents      = [];
let activeCity     = 'all';
let activeCategory = 'all';
let dateFrom          = null;
let dateTo            = null;
let defaultDateFrom   = null;
let defaultDateTo     = null;

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
function filteredEvents() {
  return allEvents.filter(e => {
    const cityOk = activeCity === 'all' || e.city === activeCity;
    const catOk  = activeCategory === 'all' || detectCategory(e) === activeCategory;
    const iso    = (e.date_iso || '').substring(0, 10);
    const dateOk = !iso || ((!dateFrom || iso >= dateFrom) && (!dateTo || iso <= dateTo));
    return cityOk && catOk && dateOk;
  });
}

function categoryCounts() {
  // Count per category scoped to the active city (not the active category)
  const cityFiltered = allEvents.filter(e => activeCity === 'all' || e.city === activeCity);
  const counts = { all: cityFiltered.length };
  for (const e of cityFiltered) {
    const cat = detectCategory(e);
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Rendering helpers (thin wrappers that pass current state)
// ---------------------------------------------------------------------------
function renderEvents() {
  const events = filteredEvents();
  if (allEvents.length === 0) return renderEmpty();
  if (events.length === 0)    return renderNoResults();
  renderGrid(events);
}

function refreshFilters() {
  const counts = categoryCounts();
  const categories = Object.keys(counts).filter(k => k !== 'all').sort();
  renderCategoryFilters(categories, activeCategory, counts, cat => {
    activeCategory = cat;
    renderEvents();
  });
}

// ---------------------------------------------------------------------------
// Status indicators
// ---------------------------------------------------------------------------
function setStatus(state) {
  document.getElementById('statusDot').className =
    'status-dot' + (state === 'loading' ? ' loading' : state === 'error' ? ' error' : '');
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function loadEvents() {
  setStatus('loading');
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    allEvents = data.events ?? [];

    document.getElementById('lastUpdated').textContent =
      formatTimestamp(data.scraped_at);

    setDefaultDateRange();
    refreshFilters();
    renderEvents();
    setStatus('ok');
  } catch (err) {
    setStatus('error');
    console.error(err);
    renderError();
  }
}

// ---------------------------------------------------------------------------
// City pill wiring
// ---------------------------------------------------------------------------
function initCityPills() {
  document.querySelectorAll('.city-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCity = pill.dataset.city;
      document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      refreshFilters();
      renderEvents();
    });
  });
}

// ---------------------------------------------------------------------------
// Date range defaults (called after allEvents is populated)
// ---------------------------------------------------------------------------
function setDefaultDateRange() {
  const fromEl  = document.getElementById('dateFrom');
  const toEl    = document.getElementById('dateTo');
  const clearEl = document.getElementById('clearDates');

  const today   = new Date().toLocaleDateString('en-CA');
  const maxDate = allEvents.reduce((max, e) => {
    const d = (e.date_iso || '').substring(0, 10);
    return d && d > max ? d : max;
  }, '');

  defaultDateFrom = today;
  defaultDateTo   = maxDate || null;
  dateFrom        = defaultDateFrom;
  dateTo          = defaultDateTo;
  fromEl.value    = today;
  toEl.value      = maxDate;
  clearEl.hidden  = !dateFrom && !dateTo;
}

// ---------------------------------------------------------------------------
// Date range filter wiring
// ---------------------------------------------------------------------------
function initDateFilter() {
  const fromEl  = document.getElementById('dateFrom');
  const toEl    = document.getElementById('dateTo');
  const clearEl = document.getElementById('clearDates');

  function updateDates() {
    dateFrom = fromEl.value || null;
    dateTo   = toEl.value   || null;
    fromEl.classList.toggle('has-value', !!dateFrom && dateFrom !== defaultDateFrom);
    toEl.classList.toggle('has-value', !!dateTo && dateTo !== defaultDateTo);
    clearEl.hidden = !dateFrom && !dateTo;
    renderEvents();
  }

  fromEl.addEventListener('change', updateDates);
  toEl.addEventListener('change', updateDates);
  clearEl.addEventListener('click', () => {
    fromEl.value = '';
    toEl.value   = '';
    updateDates();
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initGlitter();
  initCityPills();
  initDateFilter();
  loadEvents();
});
