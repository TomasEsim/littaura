/* ============================================================
   KAINŲ KONFIGŪRACIJA (Google Sheets)
   ------------------------------------------------------------
   1. Sukurkite Google lentelę pagal PRICES_SHEET.md pavyzdį.
   2. Bendrinkite: "Share" -> "Anyone with the link" -> "Viewer".
   3. Iš lentelės URL nukopijuokite ID:
      docs.google.com/spreadsheets/d/<TAS_ID>/edit
   4. Įrašykite ID ir lapo (tab) pavadinimą žemiau.
   Kol ID = 'YOUR_SHEET_ID', naudojamos numatytosios kainos.
   ============================================================ */
const SHEET_ID = 'YOUR_SHEET_ID';
const SHEET_NAME = 'Kainos';

const FUEL_ORDER = ['DK', 'DKK', 'DKU'];

// Numatytosios (atsarginės) kainos — naudojamos jei lentelės įkelti nepavyksta.
const FALLBACK_QTYS = [1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000];
const fallbackTiers = () =>
  FALLBACK_QTYS.map((q) => ({ qty: q, price: q >= 3000 ? 1.95 : 1.96, popular: q === 3000 }));
const FALLBACK = {
  DK:  { name: 'Dyzelinas kuras (DK)',         tiers: fallbackTiers() },
  DKK: { name: 'Dyzelino kuras Žiemos (DKK)',  tiers: fallbackTiers() },
  DKU: { name: 'Dyzelino kuras vasaros (DKU)', tiers: fallbackTiers() },
};

// Gyvas katalogas — pradeda nuo numatytojo, pakeičiamas lentelės duomenimis.
let FUELS = JSON.parse(JSON.stringify(FALLBACK));

const curFuel  = () => FUELS[state.fuel] || FALLBACK[state.fuel];
const curTiers = () => curFuel().tiers;
const priceFor = (qty) => { const t = curTiers().find((t) => t.qty === qty); return t ? t.price : 0; };

// Lithuanian number formatting: space thousands, comma decimals.
const fmtEUR = (n) =>
  n.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
// Per-litre price: allow up to 3 decimals (e.g. 1,359 €/L).
const fmtUnit = (n) =>
  n.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

const state = { fuel: 'DK', qty: 3000 };

const els = {
  rows:      document.getElementById('priceRows'),
  fuelTitle: document.getElementById('fuelTitle'),
  sumFuel:   document.getElementById('sumFuel'),
  sumQty:    document.getElementById('sumQty'),
  sumUnit:   document.getElementById('sumUnit'),
  sumTotal:  document.getElementById('sumTotal'),
  // order form
  formFuel:  document.getElementById('f-fuel'),
  formQty:   document.getElementById('f-qty'),
  formTotal: document.getElementById('f-total'),
  // modal summary
  msFuel:    document.getElementById('msFuel'),
  msQty:     document.getElementById('msQty'),
  msTotal:   document.getElementById('msTotal'),
};

// Keep the order form + modal summary in sync with the current pricing selection.
function syncForm() {
  const u = priceFor(state.qty);
  const name = curFuel().name;
  const total = fmtEUR(state.qty * u);
  if (els.formFuel) els.formFuel.value = name;
  if (els.formQty)  els.formQty.value = state.qty;
  if (els.formTotal) els.formTotal.value = total;
  if (els.msFuel)  els.msFuel.textContent = name;
  if (els.msQty)   els.msQty.textContent = state.qty + ' L';
  if (els.msTotal) els.msTotal.textContent = total;
}

// If the current quantity isn't offered for the selected fuel, snap to a sensible one.
function ensureValidQty() {
  const qs = curTiers().map((t) => t.qty);
  if (!qs.includes(state.qty)) {
    const pop = curTiers().find((t) => t.popular);
    state.qty = pop ? pop.qty : (qs[Math.floor(qs.length / 2)] ?? qs[0] ?? 0);
  }
}

function renderRows() {
  els.rows.innerHTML = curTiers().map(({ qty, price, popular }) => {
    const total = qty * price;
    const selected = qty === state.qty ? ' is-selected' : '';
    const badge = popular ? '<span class="badge-pop">Populiariausias</span>' : '';
    return `
      <div class="price-row${selected}" data-qty="${qty}">
        <div class="qty-cell"><span class="radio"></span>${qty} L${badge}</div>
        <div class="unit-cell">${fmtUnit(price)} € / L</div>
        <div class="total-cell">${fmtEUR(total)}</div>
        <div class="chev">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>`;
  }).join('');

  els.rows.querySelectorAll('.price-row').forEach((row) => {
    row.addEventListener('click', () => {
      state.qty = Number(row.dataset.qty);
      renderRows();
      renderSummary();
    });
  });
}

function renderSummary() {
  const name = curFuel().name;
  const u = priceFor(state.qty);
  els.fuelTitle.textContent = name;
  els.sumFuel.textContent = name;
  els.sumUnit.textContent = fmtUnit(u) + ' €';
  els.sumTotal.textContent = fmtEUR(state.qty * u);
  els.sumQty.innerHTML = `${state.qty} L <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
  syncForm();
}

// Reflect fuel display names from the sheet into the sidebar buttons and form select.
function applyFuelNames() {
  FUEL_ORDER.forEach((code) => {
    const label = document.querySelector(`.fuel-type[data-fuel="${code}"] .ft-label strong`);
    if (label && FUELS[code]) label.textContent = FUELS[code].name;
  });
}
function buildFuelSelect() {
  if (!els.formFuel) return;
  els.formFuel.innerHTML = FUEL_ORDER
    .map((c) => `<option value="${FUELS[c].name}">${FUELS[c].name}</option>`)
    .join('');
}

// Select a fuel type and reflect it across the table, sidebar, and summary.
function selectFuel(code) {
  if (!FUELS[code]) return;
  state.fuel = code;
  ensureValidQty();
  document.querySelectorAll('.fuel-type').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.fuel === code));
  renderRows();
  renderSummary();
}

// Fuel-type switching (sidebar buttons)
document.querySelectorAll('.fuel-type').forEach((btn) => {
  btn.addEventListener('click', () => selectFuel(btn.dataset.fuel));
});

// Fuel links in the header dropdown and footer: select that fuel, then scroll to the table.
document.querySelectorAll('.fuel-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    selectFuel(link.dataset.fuel);
    nav?.classList.remove('open');
    document.getElementById('kainos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Order modal — opens from any .order-trigger button.
const orderModal = document.getElementById('orderModal');
const modalClose = document.getElementById('modalClose');
const modalSummary = document.getElementById('modalSummary');

// Reset the fuel/quantity fields to a blank state (used when not coming from "Tęsti užsakymą").
function clearOrderFields() {
  if (els.formFuel) els.formFuel.selectedIndex = 0;
  if (els.formQty)  els.formQty.value = '';
  if (els.formTotal) els.formTotal.value = '';
}

function openModal(e) {
  if (e) e.preventDefault();
  // Only prefill + show the order summary when opened via "Tęsti užsakymą".
  const fromContinue = e && e.currentTarget.hasAttribute('data-prefill');
  if (fromContinue) {
    syncForm();                                  // fill fuel / quantity / total + summary
    if (modalSummary) modalSummary.style.display = '';
  } else {
    clearOrderFields();
    if (modalSummary) modalSummary.style.display = 'none';
  }
  orderModal.classList.add('open');
  orderModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}
function closeModal() {
  orderModal.classList.remove('open');
  orderModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('.order-trigger').forEach((btn) => btn.addEventListener('click', openModal));
modalClose?.addEventListener('click', closeModal);
orderModal?.addEventListener('click', (e) => { if (e.target === orderModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && orderModal.classList.contains('open')) closeModal(); });

// Order form submission (Web3Forms — works on any static host).
const orderForm = document.getElementById('orderForm');
const formStatus = document.getElementById('formStatus');
const orderSubmit = document.getElementById('orderSubmit');

function setStatus(msg, type) {
  if (!formStatus) return;
  formStatus.textContent = msg;
  formStatus.className = 'form-status show ' + type;
}

orderForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const key = orderForm.querySelector('[name="access_key"]').value;
  if (!key || key === 'YOUR_ACCESS_KEY_HERE') {
    setStatus('Forma dar nesukonfigūruota: įklijuokite Web3Forms access raktą į index.html.', 'err');
    return;
  }

  const original = orderSubmit.innerHTML;
  orderSubmit.disabled = true;
  orderSubmit.textContent = 'Siunčiama…';
  setStatus('', '');

  try {
    const res = await fetch(orderForm.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(orderForm),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      orderForm.reset();
      syncForm(); // restore fuel/qty defaults after reset
      setStatus('Ačiū! Jūsų užsakymas gautas — netrukus su jumis susisieksime.', 'ok');
    } else {
      setStatus('Nepavyko išsiųsti. Pabandykite dar kartą arba skambinkite +370 686 70 502.', 'err');
    }
  } catch (err) {
    setStatus('Tinklo klaida. Pabandykite dar kartą arba skambinkite +370 686 70 502.', 'err');
  } finally {
    orderSubmit.disabled = false;
    orderSubmit.innerHTML = original;
  }
});

// Mobile nav
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle?.addEventListener('click', () => nav.classList.toggle('open'));
nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

/* ============================================================
   Load live prices from the published Google Sheet.
   ============================================================ */

// Minimal CSV parser (handles quoted fields, commas, and newlines).
function parseCSV(text) {
  const rows = [];
  let row = [], cur = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false; }
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

// Turn the sheet rows into a { CODE: {name, tiers[]} } catalogue.
function catalogueFromCSV(csv) {
  const rows = parseCSV(csv);
  if (rows.length < 2) return {};
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names) => header.findIndex((h) => names.some((n) => h.startsWith(n)));
  const ci = col('kodas', 'code', 'kuras');
  const ni = col('pavadinimas', 'name');
  const qi = col('kiekis', 'quantity', 'qty');
  const pi = col('kaina', 'price');
  const poi = col('populiar', 'popular');
  if (ci < 0 || qi < 0 || pi < 0) return {};

  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const code = (r[ci] || '').trim().toUpperCase();
    if (!code) continue;
    const qty = parseInt(String(r[qi]).replace(/[^\d]/g, ''), 10);
    const price = parseFloat(String(r[pi]).replace(',', '.').replace(/[^\d.]/g, ''));
    if (!qty || !(price > 0)) continue;
    const popular = poi >= 0 && /^(x|taip|yes|y|1|true)$/i.test((r[poi] || '').trim());
    if (!out[code]) out[code] = { name: ni >= 0 && r[ni]?.trim() ? r[ni].trim() : code, tiers: [] };
    else if (ni >= 0 && r[ni]?.trim()) out[code].name = r[ni].trim();
    out[code].tiers.push({ qty, price, popular });
  }
  Object.values(out).forEach((f) => f.tiers.sort((a, b) => a.qty - b.qty));
  return out;
}

async function loadPrices() {
  if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID') return; // not configured → keep fallback
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
                `?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const cat = catalogueFromCSV(await res.text());

    let applied = 0;
    FUEL_ORDER.forEach((code) => {
      if (cat[code] && cat[code].tiers.length) { FUELS[code] = cat[code]; applied++; }
    });
    if (!applied) return;

    ensureValidQty();
    applyFuelNames();
    buildFuelSelect();
    renderRows();
    renderSummary();
  } catch (err) {
    console.warn('Kainų įkėlimas iš Google Sheets nepavyko — naudojamos numatytosios.', err);
  }
}

// Initial render (with fallback prices), then refresh from the sheet.
buildFuelSelect();
renderRows();
renderSummary();
loadPrices();
