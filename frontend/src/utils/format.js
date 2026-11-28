export const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

export const fmt = (d) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

export const day = (n = 0) =>
  new Date(Date.now() + n * 86400000 + 7 * 3600000).toISOString().slice(0, 10);

export const defaultDates = { start: day(1), end: day(3) };

export const datePayload = (d) => ({
  start_at: d.start + "T10:00:00+07:00",
  end_at: d.end + "T10:00:00+07:00",
});