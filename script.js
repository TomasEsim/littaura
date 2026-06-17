// Fuel catalogue. Price per litre: 1.96 €/L under 3000 L, 1.95 €/L from 3000 L.
const QUANTITIES = [1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000];

const FUELS = {
  DK:  { name: 'Dyzelinas kuras (DK)' },
  DKK: { name: 'Dyzelino kuras Žiemos (DKK)' },
  DKU: { name: 'Dyzelino kuras vasaros (DKU)' },
};

const unitPrice = (qty) => (qty >= 3000 ? 1.95 : 1.96);

// Lithuanian number formatting: space thousands, comma decimals.
const fmtEUR = (n) =>
  n.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

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
  const u = unitPrice(state.qty);
  const name = FUELS[state.fuel].name;
  const total = fmtEUR(state.qty * u);
  if (els.formFuel) els.formFuel.value = name;
  if (els.formQty)  els.formQty.value = state.qty;
  if (els.formTotal) els.formTotal.value = total;
  if (els.msFuel)  els.msFuel.textContent = name;
  if (els.msQty)   els.msQty.textContent = state.qty + ' L';
  if (els.msTotal) els.msTotal.textContent = total;
}

function renderRows() {
  els.rows.innerHTML = QUANTITIES.map((qty) => {
    const u = unitPrice(qty);
    const total = qty * u;
    const selected = qty === state.qty ? ' is-selected' : '';
    const popular = qty === 3000
      ? '<span class="badge-pop">Populiariausias</span>' : '';
    return `
      <div class="price-row${selected}" data-qty="${qty}">
        <div class="qty-cell"><span class="radio"></span>${qty} L${popular}</div>
        <div class="unit-cell">${u.toFixed(2)} € / L</div>
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
  const name = FUELS[state.fuel].name;
  const u = unitPrice(state.qty);
  els.fuelTitle.textContent = name;
  els.sumFuel.textContent = name;
  els.sumUnit.textContent = u.toFixed(2) + ' €';
  els.sumTotal.textContent = fmtEUR(state.qty * u);
  els.sumQty.innerHTML = `${state.qty} L <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
  syncForm();
}

// Fuel-type switching
document.querySelectorAll('.fuel-type').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fuel-type').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.fuel = btn.dataset.fuel;
    renderSummary();
  });
});

// Order modal — opens from any .order-trigger button, prefilled with the current selection.
const orderModal = document.getElementById('orderModal');
const modalClose = document.getElementById('modalClose');

function openModal(e) {
  if (e) e.preventDefault();
  syncForm();            // prefill fuel / quantity / total from current selection
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

renderRows();
renderSummary();
