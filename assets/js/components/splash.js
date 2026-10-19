// components/splash.js — intro animation saat website pertama kali dibuka

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Menjalankan splash screen. Promise resolve saat splash mulai bergeser keluar,
 * sehingga animasi hero bisa mulai bersamaan dengan transisi splash.
 * Pengguna bisa melewati dengan klik/tap atau menekan tombol keyboard.
 */
export function runSplash(el) {
  return new Promise((resolve) => {
    if (!el) return resolve();

    // Pecah "Hematify" jadi huruf-huruf beranimasi bertahap
    const word = el.querySelector('[data-splash-word]');
    if (word) {
      const text = word.textContent.trim();
      word.setAttribute('aria-label', text);
      word.innerHTML = [...text]
        .map((c, i) => `<span class="splash-letter" aria-hidden="true" style="--d:${i}">${c}</span>`)
        .join('');
    }

    document.body.classList.add('is-splashing');
    el.classList.add('is-running');

    let finished = false;
    let timer;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      window.removeEventListener('keydown', finish);
      el.classList.add('is-leaving');
      document.body.classList.remove('is-splashing');
      resolve();
      setTimeout(() => el.remove(), 1000);
    };

    timer = setTimeout(finish, prefersReduced ? 500 : 2700);
    el.addEventListener('click', finish, { once: true });
    window.addEventListener('keydown', finish);
  });
}
