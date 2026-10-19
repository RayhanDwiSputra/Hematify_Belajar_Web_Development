# Hematify

Kalkulator penghematan & target finansial interaktif. Pilih pengeluaran kecil yang ingin dikurangi (kopi/boba, jajan online, dll.), tentukan jangka waktu, lalu lihat berapa yang berhasil dihemat dan target impian apa yang setara.

**Stack:** HTML5 · Tailwind CSS (CDN) · Vanilla JavaScript (ES Modules) · Lucide Icons (CDN)
**Tema:** Soft dark minimalis — Emerald/Mint, Slate Grey, aksen putih.

## Struktur Project

```
hematify/
├── index.html
├── assets/
│   ├── css/
│   │   ├── main.css          # token warna, komponen (kartu, tombol, form, progress)
│   │   └── animations.css    # keyframes, splash, transisi section, reveal
│   └── js/
│       ├── app.js            # entry point: navigasi, render hasil, merangkai modul
│       ├── components/
│       │   ├── splash.js     # intro animation
│       │   ├── calculator.js # rumus + UI daftar kebiasaan + pill durasi
│       │   ├── goalsData.js  # data target impian + helper pencocokan
│       │   └── uiEffects.js  # counter, transisi section, reveal, confetti, toast
│       └── utils/
│           └── formatters.js # format Rupiah, parse angka, escape HTML
└── README.md
```

## Cara Menjalankan di VS Code

Karena memakai **ES Modules**, file tidak bisa dibuka langsung lewat `file://` (browser memblokir `import`). Gunakan server lokal:

1. Buka folder `hematify` di VS Code.
2. Install ekstensi **Live Server** (Ritwick Dey).
3. Klik kanan `index.html` → **Open with Live Server**.

Alternatif tanpa ekstensi:

```bash
npx serve .
# atau
python -m http.server 5500
```

Lalu buka `http://localhost:5500`. Butuh koneksi internet untuk memuat Tailwind, Lucide, dan font dari CDN.

## Rumus

```
hemat per minggu = Σ (harga × frekuensi × (7 jika satuan "per hari", 1 jika "per minggu"))
total hemat      = hemat per minggu × (52 / 12) × jumlah bulan
```

Contoh: Kopi Rp 25.000 × 3/minggu + Jajan Online Rp 50.000 × 2/minggu = Rp 175.000/minggu → 6 bulan = **Rp 4.550.000**.

## Kustomisasi

- **Target impian & harga** → `assets/js/components/goalsData.js`. Harga di sana hanya estimasi (terutama emas Antam); sesuaikan dengan harga terbaru. Tambah objek baru dengan `id`, `name`, `price`, `icon` (nama ikon [Lucide](https://lucide.dev/icons)), dan `note`.
- **Preset kebiasaan** → konstanta `PRESETS` di `assets/js/components/calculator.js`.
- **Pilihan durasi** → konstanta `DURATIONS` di file yang sama.
- **Warna** → variabel CSS di `:root` pada `assets/css/main.css`.
- **Durasi splash** → `runSplash` di `assets/js/components/splash.js` (default ±2,7 detik, bisa dilewati dengan klik/tombol).

## Fitur UX & Aksesibilitas

- Splash screen + hero entrance bertahap
- Counter angka animatif (Rupiah) saat kalkulasi berubah
- Transisi fade/slide antar section (Beranda → Hitung → Hasil)
- Hover halus pada tombol dan kartu, plus efek cahaya mengikuti kursor
- Progress bar & perbandingan kontribusi tiap kebiasaan
- Confetti saat ada target yang tercapai
- Toggle memakai `role="switch"`, fokus keyboard terlihat, dan `prefers-reduced-motion` dihormati

## Deploy

Karena murni statis, project ini bisa langsung di-deploy ke **GitHub Pages**, **Netlify**, atau **Vercel** tanpa build step.

## Ide Pengembangan

- Simpan kebiasaan & durasi di `localStorage`
- Mode terang (light) dengan toggle tema
- Bagikan hasil sebagai gambar (`html2canvas`)
- Input target kustom: "Aku mau beli X seharga Rp Y"
- Migrasi ke React + Vite + Framer Motion bila fitur makin kompleks

> Hematify hanya alat bantu motivasi dan gambaran kasar, bukan saran keuangan.
