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
const SHEET_ID = '1008gSHJGW9nnaLq3XINHqQwCJQJxMeo7LqFjHLM8uuU';
const SHEET_NAME = ''; // tuščia = pirmas lapas (tab). Jei lapas pervadintas, įrašykite jo pavadinimą.

// Kuras pažymimas „Populiariausias", kai kiekis lygus šiam:
const POPULAR_QTY = 3000;

// Lentelės išdėstymas (wide): kiekvienas kuras turi 3 stulpelius –
// Kuro kiekis | Kaina 1L | Viso Suma. Nurodome 0-pagrįstus stulpelių indeksus
// (A=0, B=1, C=2, D=3, ...). „Viso Suma" stulpelis ignoruojamas – sumą skaičiuojame patys.
const SHEET_GROUPS = [
  { code: 'DK',  name: 'Dyzelinas kuras (DK)',         qtyCol: 0, priceCol: 1 }, // A, B
  { code: 'DKK', name: 'Dyzelino kuras Žiemos (DKK)',  qtyCol: 3, priceCol: 4 }, // D, E
  { code: 'DKU', name: 'Dyzelino kuras vasaros (DKU)', qtyCol: 6, priceCol: 7 }, // G, H
];

const FUEL_ORDER = SHEET_GROUPS.map((g) => g.code);

// Numatytosios (atsarginės) kainos — atitinka lentelės kainas, naudojamos jei
// lentelės įkelti nepavyksta. Kaina mažėja po 0,01 €/L nuo 2500 L.
const FALLBACK_QTYS = [500, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000];
const tiersForBase = (base) =>
  FALLBACK_QTYS.map((q) => {
    const step = q === 2500 ? 0.01 : q === 3000 ? 0.02 : q === 4000 ? 0.03 : q === 5000 ? 0.04 : 0;
    return { qty: q, price: Math.round((base - step) * 100) / 100, popular: q === POPULAR_QTY };
  });
const FALLBACK = {
  DK:  { name: 'Dyzelinas kuras (DK)',         tiers: tiersForBase(1.96) },
  DKK: { name: 'Dyzelino kuras Žiemos (DKK)',  tiers: tiersForBase(1.47) },
  DKU: { name: 'Dyzelino kuras vasaros (DKU)', tiers: tiersForBase(1.39) },
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
  const buyNow = document.getElementById('buyNow');
  if (buyNow) buyNow.href = `checkout.html?fuel=${state.fuel}&qty=${state.qty}`;
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
      // Push a lead event to the dataLayer (for GTM / Google Ads) — read values BEFORE reset.
      const val = (id) => (document.getElementById(id)?.value || '').trim();
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'generate_lead',
        user_data: {
          email: val('f-email').toLowerCase(),
          phone: val('f-phone'),
          address: {
            first_name: val('f-first'),
            last_name: val('f-last'),
          },
        },
      });

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

const toNum = (v) => parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.]/g, ''));

// Turn the wide sheet (3 side-by-side fuel blocks) into a { CODE: {name, tiers[]} }
// catalogue. Reads each block by column position; data rows are any row whose
// "kiekis" cell is a positive number, so title/sub-header rows are skipped.
function catalogueFromCSV(csv) {
  const rows = parseCSV(csv);
  const out = {};
  SHEET_GROUPS.forEach((g) => { out[g.code] = { name: g.name, tiers: [] }; });

  for (const r of rows) {
    SHEET_GROUPS.forEach((g) => {
      const qty = parseInt(String(r[g.qtyCol] ?? '').replace(/[^\d]/g, ''), 10);
      const price = toNum(r[g.priceCol]);
      if (qty > 0 && price > 0) {
        out[g.code].tiers.push({ qty, price, popular: qty === POPULAR_QTY });
      }
    });
  }
  Object.values(out).forEach((f) => f.tiers.sort((a, b) => a.qty - b.qty));
  return out;
}

async function loadPrices() {
  if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID') return; // not configured → keep fallback
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv` +
                (SHEET_NAME ? `&sheet=${encodeURIComponent(SHEET_NAME)}` : '');
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
