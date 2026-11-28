import { fmt, money } from "./format";

export const waLink = (phone, text) =>
  "https://wa.me/" +
  String(phone || "")
    .replace(/^0/, "62")
    .replace(/[^0-9]/g, "") +
  "?text=" +
  encodeURIComponent(text);

export const invoiceText = (b) =>
  `Halo ${b.customer_name}, berikut nota digital ${b.code} dari Funniest Outdoor.\n${b.items.map((l) => `${l.name} (${l.label}) × ${l.quantity}`).join("\n")}\nSewa: ${fmt(b.start_at)} – ${fmt(b.end_at)}\nTotal: ${money(b.total)}\nDibayar: ${money(b.paid)}\nSisa: ${money(Math.max(0, b.total - b.paid))}\n${location.origin}/nota/${b.token}\nJaminan KTP/SIM diserahkan saat pengambilan dan dikembalikan setelah penyelesaian sewa.`;

export const reminderText = (b) =>
  `Halo ${b.customer_name}, pengingat pengembalian ${b.code} dari Funniest Outdoor.\nBarang: ${b.items.map((l) => `${l.name} (${l.label}) × ${l.quantity}`).join(", ")}.\nBatas kembali: ${fmt(b.end_at)}, 10.00 WIB.\nTerlambat ${b.late_days} hari. Tarif keterlambatan: ${money(b.late_rate)}/hari. Total biaya keterlambatan saat ini: ${money(b.late_fee)}.\nMohon segera kembalikan perlengkapan. Biaya keterlambatan dibayar di tempat saat pengembalian, kemudian jaminan KTP/SIM diserahkan kembali. Biaya diperbarui mengikuti waktu pengembalian.`;