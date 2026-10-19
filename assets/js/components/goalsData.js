// components/goalsData.js — data target impian & helper pencocokan
// Harga hanyalah estimasi. Silakan ubah sesuai harga terbaru (mis. harga emas Antam).

export const GOALS = [
  { id: 'headset',  name: 'Headset Bluetooth',        price: 500_000,    icon: 'headphones', note: 'Musik tanpa kabel, fokus tanpa ribet.' },
  { id: 'sneakers', name: 'Sneakers Baru',            price: 1_200_000,  icon: 'footprints', note: 'Langkah baru dengan hasil hematmu.' },
  { id: 'antam1',   name: 'Emas Antam 1 Gram',        price: 2_500_000,  icon: 'gem',        note: 'Investasi kecil yang nilainya terjaga.' },
  { id: 'liburan',  name: 'Tiket Liburan Domestik',   price: 3_500_000,  icon: 'plane',      note: 'Pesawat PP + akomodasi sederhana.' },
  { id: 'hp',       name: 'HP Baru',                  price: 4_500_000,  icon: 'smartphone', note: 'Upgrade HP tanpa cicilan.' },
  { id: 'antam2',   name: 'Emas Antam 2 Gram',        price: 5_000_000,  icon: 'gem',        note: 'Dua kali lipat tabungan emasmu.' },
  { id: 'laptop',   name: 'Laptop Baru',              price: 8_000_000,  icon: 'laptop',     note: 'Teman belajar & berkarya.' },
  { id: 'jepang',   name: 'Liburan ke Jepang',        price: 15_000_000, icon: 'mountain',   note: 'Tiket, penginapan, dan jajan di sana.' },
  { id: 'motor',    name: 'DP Motor',                 price: 20_000_000, icon: 'bike',       note: 'Uang muka tanpa pinjaman.' }
].sort((a, b) => a.price - b.price);

/** Semua target yang sudah terjangkau. */
export const getAchieved = (total) => GOALS.filter((g) => g.price <= total);

/** Target termahal yang sudah terjangkau (untuk headline). */
export const getBestGoal = (total) => getAchieved(total).at(-1) ?? null;

/** Target termurah yang belum terjangkau. */
export const getNextGoal = (total) => GOALS.find((g) => g.price > total) ?? null;

/** Persentase progres 0–100 menuju sebuah target. */
export const goalProgress = (total, price) => Math.min(100, Math.max(0, (total / price) * 100));
