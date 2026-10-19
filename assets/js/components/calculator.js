// components/calculator.js — logika kalkulasi + UI input kebiasaan
import { formatRupiah, formatNumber, parseNumber, clamp, escapeHtml } from '../utils/formatters.js';
import { observeReveals, toast } from './uiEffects.js';

export const WEEKS_PER_MONTH = 52 / 12;

export const DURATIONS = [
  { months: 1, label: '1 Bulan' },
  { months: 3, label: '3 Bulan' },
  { months: 6, label: '6 Bulan' },
  { months: 12, label: '1 Tahun' }
];

// unit: 'week' = kali per minggu, 'day' = kali per hari
export const PRESETS = [
  { id: 'kopi',    name: 'Kopi / Boba',            icon: 'coffee',       price: 25_000, qty: 3, unit: 'week', active: true },
  { id: 'jajan',   name: 'Jajan Online',           icon: 'shopping-bag', price: 50_000, qty: 2, unit: 'week', active: true },
  { id: 'delivery',name: 'Ongkir & Delivery Food', icon: 'bike',         price: 15_000, qty: 2, unit: 'week', active: false },
  { id: 'game',    name: 'Top-up Game',            icon: 'gamepad-2',    price: 30_000, qty: 1, unit: 'week', active: false },
  { id: 'cemilan', name: 'Cemilan Minimarket',     icon: 'cookie',       price: 12_000, qty: 1, unit: 'day',  active: false }
];

/* ---------------- Kalkulasi murni (mudah di-test) ---------------- */

export const weeklyAmount = (h) => h.price * h.qty * (h.unit === 'day' ? 7 : 1);
const activeOnly = (habits) => habits.filter((h) => h.active);

export const weeklyTotal = (habits) => activeOnly(habits).reduce((sum, h) => sum + weeklyAmount(h), 0);
export const monthlyTotal = (habits) => weeklyTotal(habits) * WEEKS_PER_MONTH;
export const calcTotal = (habits, months) => Math.round(monthlyTotal(habits) * months);

/** Kontribusi tiap kebiasaan aktif, diurutkan dari terbesar. */
export function breakdown(habits, months) {
  const items = activeOnly(habits).map((h) => ({
    ...h,
    total: Math.round(weeklyAmount(h) * WEEKS_PER_MONTH * months)
  }));
  const sum = items.reduce((s, i) => s + i.total, 0);
  return items.map((i) => ({ ...i, share: sum ? i.total / sum : 0 })).sort((a, b) => b.total - a.total);
}

/* ---------------- Pill jangka waktu ---------------- */

export function renderDurationPills(container, current, onSelect) {
  if (!container) return;
  container.innerHTML = DURATIONS.map(
    (d) => `<button type="button" class="pill ${d.months === current ? 'is-active' : ''}"
              data-months="${d.months}" aria-pressed="${d.months === current}">${d.label}</button>`
  ).join('');
  container.onclick = (e) => {
    const btn = e.target.closest('[data-months]');
    if (btn) onSelect(Number(btn.dataset.months));
  };
}

/* ---------------- UI daftar kebiasaan ---------------- */

export function initCalculator({ listEl, formEl, onChange }) {
  let habits = PRESETS.map((p) => ({ ...p }));
  let seq = 0;

  const emit = () => onChange?.(habits);
  const find = (id) => habits.find((h) => h.id === id);

  const cardHTML = (h, i) => `
    <article class="habit-card glow-card reveal ${h.active ? 'is-active' : ''}" data-id="${h.id}" style="--i:${i}">
      <div class="flex items-center gap-3">
        <div class="habit-icon"><i data-lucide="${h.icon}" class="w-5 h-5"></i></div>
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold truncate">${escapeHtml(h.name)}</h3>
          <p class="text-xs text-slate-400" data-role="weekly">≈ ${formatRupiah(weeklyAmount(h))} / minggu</p>
        </div>
        ${h.custom ? `<button type="button" class="icon-btn" data-action="remove" aria-label="Hapus ${escapeHtml(h.name)}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
        <button type="button" role="switch" class="switch" data-action="toggle"
                aria-checked="${h.active}" aria-label="Aktifkan ${escapeHtml(h.name)}"><span></span></button>
      </div>

      <div class="habit-fields">
        <div class="mt-4 grid grid-cols-5 gap-3">
          <label class="field col-span-3">
            <span>Harga (Rp)</span>
            <input data-field="price" inputmode="numeric" autocomplete="off" value="${formatNumber(h.price)}" />
          </label>
          <label class="field col-span-2">
            <span>Frekuensi</span>
            <div class="stepper">
              <button type="button" data-action="dec" aria-label="Kurangi">−</button>
              <input data-field="qty" inputmode="numeric" autocomplete="off" aria-label="Jumlah kali" value="${h.qty}" />
              <button type="button" data-action="inc" aria-label="Tambah">+</button>
            </div>
          </label>
        </div>
        <div class="segmented mt-3" role="group" aria-label="Satuan frekuensi">
          <button type="button" data-action="unit" data-unit="week" class="${h.unit === 'week' ? 'is-active' : ''}">kali / minggu</button>
          <button type="button" data-action="unit" data-unit="day" class="${h.unit === 'day' ? 'is-active' : ''}">kali / hari</button>
        </div>
      </div>
    </article>`;

  function render() {
    listEl.innerHTML = habits.map(cardHTML).join('');
    window.lucide?.createIcons();
    observeReveals(listEl);
  }

  // Update ringan tanpa render ulang (agar fokus input tidak hilang)
  function refreshCard(card, h) {
    const weekly = card.querySelector('[data-role="weekly"]');
    if (weekly) weekly.textContent = `≈ ${formatRupiah(weeklyAmount(h))} / minggu`;
  }

  /* ---- Event: klik ---- */
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-id]');
    const h = card && find(card.dataset.id);
    if (!h) return;

    switch (btn.dataset.action) {
      case 'toggle':
        h.active = !h.active;
        card.classList.toggle('is-active', h.active);
        btn.setAttribute('aria-checked', String(h.active));
        break;
      case 'inc':
      case 'dec': {
        h.qty = clamp(h.qty + (btn.dataset.action === 'inc' ? 1 : -1), 1, 99);
        card.querySelector('[data-field="qty"]').value = h.qty;
        break;
      }
      case 'unit':
        h.unit = btn.dataset.unit;
        card.querySelectorAll('[data-action="unit"]').forEach((b) => b.classList.toggle('is-active', b === btn));
        break;
      case 'remove':
        habits = habits.filter((x) => x !== h);
        card.classList.add('is-removing');
        setTimeout(render, 260);
        emit();
        return;
    }
    refreshCard(card, h);
    emit();
  });

  /* ---- Event: ketik harga / frekuensi ---- */
  listEl.addEventListener('input', (e) => {
    const input = e.target.closest('[data-field]');
    if (!input) return;
    const card = input.closest('[data-id]');
    const h = find(card.dataset.id);
    const value = parseNumber(input.value);

    if (input.dataset.field === 'price') {
      h.price = clamp(value, 0, 1_000_000_000);
      input.value = value ? formatNumber(h.price) : '';
    } else {
      h.qty = clamp(value, 0, 99);
      input.value = value ? String(h.qty) : '';
    }
    refreshCard(card, h);
    emit();
  });

  // Frekuensi minimal 1 saat input kehilangan fokus
  listEl.addEventListener('focusout', (e) => {
    const input = e.target.closest?.('[data-field="qty"]');
    if (!input) return;
    const card = input.closest('[data-id]');
    const h = find(card.dataset.id);
    if (h.qty < 1) {
      h.qty = 1;
      input.value = '1';
      refreshCard(card, h);
      emit();
    }
  });

  /* ---- Form kebiasaan kustom ---- */
  formEl.addEventListener('input', (e) => {
    if (e.target.matches('[data-money]')) {
      const v = parseNumber(e.target.value);
      e.target.value = v ? formatNumber(v) : '';
    }
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formEl);
    const name = String(fd.get('name') || '').trim().slice(0, 28);
    const price = clamp(parseNumber(fd.get('price')), 0, 1_000_000_000);
    const qty = clamp(parseNumber(fd.get('qty')) || 1, 1, 99);
    const unit = fd.get('unit') === 'day' ? 'day' : 'week';

    if (!name || price <= 0) {
      toast('Isi nama dan harga pengeluaran dulu ya.');
      return;
    }

    habits.push({ id: `custom-${++seq}`, name, icon: 'wallet', price, qty, unit, active: true, custom: true });
    formEl.reset();
    formEl.querySelector('[name="qty"]').value = '1';
    render();
    emit();
    toast(`"${name}" ditambahkan`);
  });

  render();
  emit();

  return { getHabits: () => habits };
}
