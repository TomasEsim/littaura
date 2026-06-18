/* ============================================================
   TESTINIS apmokėjimo puslapis.
   Kainos imamos iš to paties Google lapo kaip ir pagrindinis puslapis;
   jei nepavyksta – naudojamos numatytosios. Realus mokėjimas NEVYKDOMAS.
   ============================================================ */

// Bendra konfigūracija su script.js (kainų lentelė).
const SHEET_ID = '1008gSHJGW9nnaLq3XINHqQwCJQJxMeo7LqFjHLM8uuU';
const SHEET_NAME = '';
const POPULAR_QTY = 3000;
const VAT_RATE = 0.21; // PVM, jei reikės atskirti

const SHEET_GROUPS = [
  { code: 'DK',  name: 'Dyzelinas kuras (DK)',         qtyCol: 0, priceCol: 1 },
  { code: 'DKK', name: 'Dyzelino kuras Žiemos (DKK)',  qtyCol: 3, priceCol: 4 },
  { code: 'DKU', name: 'Dyzelino kuras vasaros (DKU)', qtyCol: 6, priceCol: 7 },
];
const FUEL_ORDER = SHEET_GROUPS.map((g) => g.code);

const FALLBACK_QTYS = [500, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000];
const tiersForBase = (base) =>
  FALLBACK_QTYS.map((q) => {
    const step = q === 2500 ? 0.01 : q === 3000 ? 0.02 : q === 4000 ? 0.03 : q === 5000 ? 0.04 : 0;
    return { qty: q, price: Math.round((base - step) * 100) / 100 };
  });
const FALLBACK = {
  DK:  { name: 'Dyzelinas kuras (DK)',         tiers: tiersForBase(1.96) },
  DKK: { name: 'Dyzelino kuras Žiemos (DKK)',  tiers: tiersForBase(1.47) },
  DKU: { name: 'Dyzelino kuras vasaros (DKU)', tiers: tiersForBase(1.39) },
};

let FUELS = JSON.parse(JSON.stringify(FALLBACK));

const fmtEUR = (n) =>
  n.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const fmtUnit = (n) =>
  n.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

// --- Order state from URL (?fuel=DK&qty=3000) ---
const params = new URLSearchParams(location.search);
const order = {
  fuel: (params.get('fuel') || 'DK').toUpperCase(),
  qty: parseInt(params.get('qty') || '3000', 10) || 3000,
};
if (!FUELS[order.fuel]) order.fuel = 'DK';

const curFuel = () => FUELS[order.fuel] || FALLBACK[order.fuel];
function priceFor(qty) {
  const tiers = curFuel().tiers;
  const exact = tiers.find((t) => t.qty === qty);
  if (exact) return exact.price;
  // jei kiekis ne iš sąrašo – imame artimiausios mažesnės pakopos kainą
  const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
  let p = sorted[0]?.price || 0;
  for (const t of sorted) if (t.qty <= qty) p = t.price;
  return p;
}

// --- CSV / sheet loading (kompaktiška versija) ---
const toNum = (v) => parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.]/g, ''));
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}
function catalogueFromCSV(csv) {
  const rows = parseCSV(csv);
  const out = {};
  SHEET_GROUPS.forEach((g) => { out[g.code] = { name: g.name, tiers: [] }; });
  for (const r of rows) {
    SHEET_GROUPS.forEach((g) => {
      const qty = parseInt(String(r[g.qtyCol] ?? '').replace(/[^\d]/g, ''), 10);
      const price = toNum(r[g.priceCol]);
      if (qty > 0 && price > 0) out[g.code].tiers.push({ qty, price });
    });
  }
  Object.values(out).forEach((f) => f.tiers.sort((a, b) => a.qty - b.qty));
  return out;
}
async function loadPrices() {
  if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID') return;
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv` +
                (SHEET_NAME ? `&sheet=${encodeURIComponent(SHEET_NAME)}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const cat = catalogueFromCSV(await res.text());
    let applied = 0;
    Object.keys(cat).forEach((code) => { if (cat[code].tiers.length) { FUELS[code] = cat[code]; applied++; } });
    if (applied) render();
  } catch (err) {
    console.warn('Kainų įkėlimas nepavyko — naudojamos numatytosios.', err);
  }
}

// --- Render summary + editable basket ---
const el = (id) => document.getElementById(id);

// If the chosen quantity isn't offered for the current fuel, snap to a sensible one.
function ensureValidQty() {
  const qs = curFuel().tiers.map((t) => t.qty);
  if (qs.length && !qs.includes(order.qty)) {
    order.qty = qs.includes(POPULAR_QTY) ? POPULAR_QTY : (qs[Math.floor(qs.length / 2)] ?? qs[0]);
  }
}

function buildFuelSelect() {
  const s = el('selFuel');
  s.innerHTML = FUEL_ORDER.map((c) => `<option value="${c}">${(FUELS[c] || FALLBACK[c]).name}</option>`).join('');
  s.value = order.fuel;
}
function buildQtySelect() {
  const s = el('selQty');
  s.innerHTML = curFuel().tiers
    .map((t) => `<option value="${t.qty}">${t.qty.toLocaleString('lt-LT')} L</option>`)
    .join('');
  s.value = String(order.qty);
}

function render() {
  ensureValidQty();
  buildFuelSelect();
  buildQtySelect();
  const unit = priceFor(order.qty);
  const total = order.qty * unit;
  const vat = total - total / (1 + VAT_RATE); // PVM dalis sumoje
  el('sumUnit').textContent = fmtUnit(unit) + ' €';
  el('sumVat').textContent = fmtEUR(vat);
  el('sumTotal').textContent = fmtEUR(total);
  el('payAmount').textContent = fmtEUR(total);
}

// Basket edits
el('selFuel').addEventListener('change', (e) => { order.fuel = e.target.value; ensureValidQty(); render(); });
el('selQty').addEventListener('change', (e) => { order.qty = parseInt(e.target.value, 10); render(); });

// --- Payment method highlight ---
document.querySelectorAll('.pay-method input').forEach((r) => {
  r.addEventListener('change', () => {
    document.querySelectorAll('.pay-method').forEach((m) =>
      m.classList.toggle('is-selected', m.querySelector('input').checked));
  });
});
document.querySelector('.pay-method input:checked')?.closest('.pay-method')?.classList.add('is-selected');

// --- Test "payment" ---
const form = el('checkoutForm');
const payBtn = el('payBtn');
const payStatus = el('payStatus');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  const unit = priceFor(order.qty);
  const total = order.qty * unit;
  const method = document.querySelector('.pay-method input:checked')?.value || 'paysera';

  payBtn.disabled = true;
  const original = payBtn.innerHTML;
  payBtn.textContent = 'Apdorojama…';
  payStatus.textContent = 'Jungiamasi prie mokėjimo sistemos (testas)…';
  payStatus.className = 'co-status show';

  // Simuliuojame mokėjimo sistemos atsakymą.
  setTimeout(() => {
    const orderNo = 'LT-' + Date.now().toString().slice(-8);

    // Ecommerce „purchase" įvykis (GTM / Google Ads) — paruošta ateičiai.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'purchase',
      payment_method: method,
      ecommerce: {
        transaction_id: orderNo,
        currency: 'EUR',
        value: Math.round(total * 100) / 100,
        items: [{
          item_id: order.fuel,
          item_name: curFuel().name,
          price: unit,
          quantity: order.qty,
        }],
      },
    });

    el('psOrderNo').textContent = orderNo;
    el('psFuel').textContent = curFuel().name;
    el('psQty').textContent = order.qty + ' L';
    el('psTotal').textContent = fmtEUR(total);

    const overlay = el('paySuccess');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    payBtn.disabled = false;
    payBtn.innerHTML = original;
    payStatus.className = 'co-status';
  }, 1100);
});

render();
loadPrices();
