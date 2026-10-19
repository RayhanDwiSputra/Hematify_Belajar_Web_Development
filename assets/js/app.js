// app.js — entry point: merangkai splash, kalkulator, hasil, navigasi
import { runSplash } from './components/splash.js';
import {
  initCalculator, renderDurationPills,
  calcTotal, weeklyTotal, monthlyTotal, breakdown
} from './components/calculator.js';
import { GOALS, getAchieved, getBestGoal, getNextGoal, goalProgress } from './components/goalsData.js';
import {
  animateCounter, transitionTo, observeReveals,
  initPointerGlow, confettiBurst, toast
} from './components/uiEffects.js';
import { formatRupiah, durationLabel, escapeHtml } from './utils/formatters.js';

const $ = (sel, root = document) => root.querySelector(sel);
const refreshIcons = () => window.lucide?.createIcons();

const state = { months: 6, section: 'hero' };
let calc;

const els = {
  header: $('#site-header'),
  previewTotal: $('#preview-total'),
  previewWeekly: $('#preview-weekly'),
  previewMonthly: $('#preview-monthly'),
  previewCount: $('#preview-count'),
  previewHint: $('#preview-hint'),
  pillsCalc: $('#duration-pills'),
  pillsResults: $('#duration-pills-results'),
  resultEmpty: $('#result-empty'),
  resultBody: $('#result-body'),
  resultTotal: $('#result-total'),
  resultHeadline: $('#result-headline'),
  resultSub: $('#result-sub'),
  resultStats: $('#result-stats'),
  resultBreakdown: $('#result-breakdown'),
  resultNext: $('#result-next'),
  resultGoals: $('#result-goals')
};

/* ---------------- Ringkasan live di section kalkulator ---------------- */

function updatePreview(habits) {
  const total = calcTotal(habits, state.months);
  animateCounter(els.previewTotal, total, { duration: 650 });
  els.previewWeekly.textContent = formatRupiah(weeklyTotal(habits));
  els.previewMonthly.textContent = formatRupiah(monthlyTotal(habits));
  els.previewCount.textContent = habits.filter((h) => h.active).length;

  const best = getBestGoal(total);
  els.previewHint.textContent = best
    ? `Setara dengan ${best.name}`
    : total > 0
      ? 'Terus tambah kebiasaan untuk mencapai target pertama'
      : 'Aktifkan kebiasaan untuk mulai menghitung';

  if (state.section === 'results') {
    renderResults();
    playResults({ fresh: false });
  }
}

/* ---------------- Render hasil & goal visualizer ---------------- */

const statCard = (icon, label, value) => `
  <div class="glow-card p-5 reveal">
    <div class="flex items-center gap-3 text-slate-400 text-sm">
      <i data-lucide="${icon}" class="w-4 h-4 text-emerald-300"></i>${label}
    </div>
    <p class="mt-2 text-2xl font-extrabold tabular-nums">${value}</p>
  </div>`;

const breakdownRow = (item) => `
  <div>
    <div class="flex items-center justify-between gap-3 text-sm mb-2">
      <span class="flex items-center gap-2 font-medium min-w-0">
        <i data-lucide="${item.icon}" class="w-4 h-4 text-emerald-300 shrink-0"></i>
        <span class="truncate">${escapeHtml(item.name)}</span>
      </span>
      <span class="text-slate-300 tabular-nums shrink-0">${formatRupiah(item.total)} · ${Math.round(item.share * 100)}%</span>
    </div>
    <div class="progress"><div class="progress-bar" data-w="${(item.share * 100).toFixed(1)}"></div></div>
  </div>`;

const goalCard = (g, i, total) => {
  const pct = goalProgress(total, g.price);
  const ok = total >= g.price;
  const qty = Math.floor(total / g.price);
  const chip = ok ? (qty > 1 ? `Bisa ${qty}×` : 'Tercapai') : `${Math.floor(pct)}%`;
  return `
    <article class="goal-card glow-card reveal ${ok ? 'is-achieved' : ''}" style="--i:${i % 3}">
      <div class="flex items-start justify-between">
        <div class="goal-icon"><i data-lucide="${g.icon}" class="w-6 h-6"></i></div>
        <span class="status-chip ${ok ? 'is-ok' : ''}">${chip}</span>
      </div>
      <h4 class="mt-4 font-semibold text-lg">${g.name}</h4>
      <p class="mt-1 text-sm text-slate-400">${g.note}</p>
      <p class="mt-4 text-sm font-semibold text-emerald-300 tabular-nums">${formatRupiah(g.price)}</p>
      <div class="progress mt-3"><div class="progress-bar" data-w="${pct.toFixed(1)}"></div></div>
    </article>`;
};

function nextGoalHTML(total, monthly) {
  const next = getNextGoal(total);
  if (!next) {
    return `
      <p class="eyebrow">Target berikutnya</p>
      <div class="mt-4 flex items-center gap-3">
        <div class="goal-icon"><i data-lucide="trophy" class="w-6 h-6"></i></div>
        <div><h4 class="font-semibold">Semua target tercapai</h4>
        <p class="text-sm text-slate-400">Saatnya menaikkan ambisimu.</p></div>
      </div>`;
  }
  const pct = goalProgress(total, next.price);
  const kurang = next.price - total;
  const bulan = monthly > 0 ? Math.ceil(kurang / monthly) : null;
  return `
    <p class="eyebrow">Target berikutnya</p>
    <div class="mt-4 flex items-center gap-3">
      <div class="goal-icon"><i data-lucide="${next.icon}" class="w-6 h-6"></i></div>
      <div class="min-w-0">
        <h4 class="font-semibold truncate">${next.name}</h4>
        <p class="text-sm text-slate-400 tabular-nums">${formatRupiah(next.price)}</p>
      </div>
    </div>
    <div class="progress mt-6"><div class="progress-bar" data-w="${pct.toFixed(1)}"></div></div>
    <div class="mt-2 flex justify-between text-xs text-slate-400">
      <span>${Math.floor(pct)}% tercapai</span><span class="tabular-nums">kurang ${formatRupiah(kurang)}</span>
    </div>
    <p class="mt-5 text-sm text-slate-300 leading-relaxed">
      ${bulan ? `Dengan ritme hemat ini, kira-kira <b class="text-emerald-300">${bulan} bulan lagi</b> kamu sampai di sana.` : ''}
    </p>`;
}

function renderResults() {
  const habits = calc.getHabits();
  const total = calcTotal(habits, state.months);
  const hasData = total > 0;

  els.resultEmpty.classList.toggle('hidden', hasData);
  els.resultBody.classList.toggle('hidden', !hasData);
  if (!hasData) return;

  const monthly = monthlyTotal(habits);
  const best = getBestGoal(total);
  const achievedCount = getAchieved(total).length;
  const label = durationLabel(state.months);

  els.resultHeadline.innerHTML = best
    ? `Selamat! Dalam <span class="text-gradient">${label}</span> kamu bisa beli: <span class="text-gradient">${best.name}</span>`
    : `Awal yang bagus! Konsisten selama <span class="text-gradient">${label}</span> dan targetmu makin dekat.`;

  els.resultSub.textContent = best
    ? `Totalnya cukup untuk ${achievedCount} dari ${GOALS.length} target impian di bawah.`
    : 'Belum ada target yang terjangkau — lihat progresmu di bawah.';

  els.resultStats.innerHTML =
    statCard('calendar-days', 'Hemat per minggu', formatRupiah(weeklyTotal(habits))) +
    statCard('calendar-range', 'Hemat per bulan', formatRupiah(monthly)) +
    statCard('list-checks', 'Kebiasaan dikurangi', `${habits.filter((h) => h.active).length}`);

  els.resultBreakdown.innerHTML = breakdown(habits, state.months).map(breakdownRow).join('');
  els.resultNext.innerHTML = nextGoalHTML(total, monthly);
  els.resultGoals.innerHTML = GOALS.map((g, i) => goalCard(g, i, total)).join('');

  refreshIcons();
  observeReveals(els.resultBody);
}

/** Jalankan animasi hasil (harus dipanggil saat section sudah tampil). */
function playResults({ fresh }) {
  const total = calcTotal(calc.getHabits(), state.months);
  if (fresh) els.resultTotal._current = 0;
  animateCounter(els.resultTotal, total, { duration: fresh ? 1800 : 900, delay: fresh ? 250 : 0 });

  // Dua frame agar transisi lebar progress bar benar-benar teranimasi
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      els.resultBody.querySelectorAll('[data-w]').forEach((bar) => {
        bar.style.width = `${bar.dataset.w}%`;
      });
    })
  );

  if (fresh && getBestGoal(total)) setTimeout(confettiBurst, 500);
}

/* ---------------- Navigasi antar section ---------------- */

function updateNav() {
  document.querySelectorAll('[data-nav]').forEach((btn) =>
    btn.classList.toggle('is-active', btn.dataset.nav === state.section)
  );
}

async function go(name) {
  if (name === 'results' && weeklyTotal(calc.getHabits()) <= 0) {
    toast('Aktifkan minimal satu kebiasaan dulu ya.');
    if (state.section === 'calculator') return;
    name = 'calculator';
  }
  if (name === state.section) return;

  if (name === 'results') renderResults();
  await transitionTo(name);
  state.section = name;
  updateNav();
  if (name === 'results') playResults({ fresh: true });
}

function setMonths(months) {
  state.months = months;
  renderPills();
  updatePreview(calc.getHabits());
}

function renderPills() {
  renderDurationPills(els.pillsCalc, state.months, setMonths);
  renderDurationPills(els.pillsResults, state.months, setMonths);
}

/* ---------------- Init ---------------- */

async function init() {
  refreshIcons();
  initPointerGlow();

  calc = initCalculator({
    listEl: $('#habit-list'),
    formEl: $('#custom-form'),
    onChange: updatePreview
  });
  renderPills();
  observeReveals();

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-goto]');
    if (target) go(target.dataset.goto);
  });

  // Link "Lihat cara kerja" membuka kalkulator lalu scroll ke penjelasan
  $('#how-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await go('calculator');
    $('#cara-kerja')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  window.addEventListener('scroll', () => els.header.classList.toggle('is-scrolled', window.scrollY > 12), { passive: true });

  await runSplash($('#splash'));
  document.body.classList.add('hero-ready');
}

init();
