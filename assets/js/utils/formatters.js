// utils/formatters.js — helper format angka & teks

const idNumber = new Intl.NumberFormat('id-ID');

/** 4550000 -> "Rp 4.550.000" */
export const formatRupiah = (n) => 'Rp ' + idNumber.format(Math.round(Number(n) || 0));

/** 4550000 -> "4.550.000" */
export const formatNumber = (n) => idNumber.format(Math.round(Number(n) || 0));

/** "Rp 25.000" / "25000" -> 25000 */
export const parseNumber = (value) => {
  const n = Number(String(value ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export const durationLabel = (months) => (months === 12 ? '1 tahun' : `${months} bulan`);

/** Cegah XSS untuk teks input pengguna (nama kebiasaan kustom). */
export const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
