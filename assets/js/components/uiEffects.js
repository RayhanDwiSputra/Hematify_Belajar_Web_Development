// components/uiEffects.js — animasi & efek UI (counter, transisi, reveal, confetti, toast)
import { formatRupiah } from '../utils/formatters.js';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animasi angka naik/turun menuju target.
 * Menyimpan nilai terakhir di elemen, jadi perubahan berikutnya mulai dari angka yang tampil.
 */
export function animateCounter(el, target, { duration = 1200, delay = 0, format = formatRupiah } = {}) {
  if (!el) return;
  cancelAnimationFrame(el._raf);
  clearTimeout(el._timer);

  const from = el._current ?? 0;
  if (prefersReduced || from === target) {
    el._current = target;
    el.textContent = format(target);
    return;
  }

  const run = () => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el._current = from + (target - from) * easeOutExpo(p);
      el.textContent = format(el._current);
      if (p < 1) {
        el._raf = requestAnimationFrame(tick);
      } else {
        el._current = target;
        el.textContent = format(target);
      }
    };
    el._raf = requestAnimationFrame(tick);
  };

  if (delay) el._timer = setTimeout(run, delay);
  else run();
}

/** Transisi halus antar section: section lama fade-out, section baru fade-in. */
export function transitionTo(targetName) {
  const current = document.querySelector('.section.is-active');
  const next = document.querySelector(`.section[data-section="${targetName}"]`);
  if (!next || next === current) return Promise.resolve(next);

  return new Promise((resolve) => {
    const show = () => {
      next.classList.add('is-active');
      window.scrollTo(0, 0);
      observeReveals(next);
      resolve(next);
    };

    if (!current || prefersReduced) {
      current?.classList.remove('is-active');
      show();
      return;
    }

    current.classList.add('is-leaving');
    current.classList.remove('is-active');
    setTimeout(() => {
      current.classList.remove('is-leaving');
      show();
    }, 320);
  });
}

/** Munculkan elemen .reveal saat masuk viewport. */
let observer;
export function observeReveals(root = document) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
  }
  root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => observer.observe(el));
}

/** Efek cahaya mengikuti kursor pada kartu .glow-card. */
export function initPointerGlow() {
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = e.target.closest?.('.glow-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    },
    { passive: true }
  );
}

/** Toast singkat di bawah layar. */
export function toast(message) {
  const host = document.getElementById('toast-host');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2800);
}

/** Confetti ringan (canvas) untuk perayaan hasil. */
export function confettiBurst() {
  if (prefersReduced) return;
  const canvas = document.getElementById('confetti');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#34d399', '#6ee7b7', '#10b981', '#a7f3d0', '#e2e8f0', '#94a3b8'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 140,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -12 - 4,
    g: 0.32 + Math.random() * 0.1,
    s: 4 + Math.random() * 5,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
    life: 1
  }));

  let frames = 0;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    frames++;
    let alive = false;
    for (const p of pieces) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.r += p.vr;
      p.life -= 0.008;
      if (p.life > 0 && p.y < H + 20) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      }
    }
    if (alive && frames < 300) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(tick);
}
