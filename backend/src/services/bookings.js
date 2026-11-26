import crypto from "node:crypto";
import { getStoreSettings } from "./pricing.js";

const DAY_MS = 86_400_000;

export function generateBookingCode() {
  const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
  const ymd = nowWib.toISOString().slice(0, 10).replaceAll("-", "");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `FO-${ymd}-${rand}`;
}

export function generateBookingToken() {
  return crypto.randomBytes(16).toString("hex");
}

export function computeLateMetrics(booking, items, settings) {
  const dailySum = items.reduce(
    (sum, l) => sum + Number(l.unit_price) * Number(l.quantity),
    0,
  );
  const lateRate = Number(settings?.late_daily || 0) > 0
    ? Number(settings.late_daily)
    : dailySum;

  if (booking.status !== "rented") {
    return { late_days: 0, late_rate: lateRate, late_fee: 0 };
  }

  const overdueMs = Date.now() - Date.parse(booking.end_at);
  if (overdueMs <= 0) {
    return { late_days: 0, late_rate: lateRate, late_fee: 0 };
  }

  const lateDays = Math.ceil(overdueMs / DAY_MS);
  return {
    late_days: lateDays,
    late_rate: lateRate,
    late_fee: lateDays * lateRate,
  };
}

export function computePaymentStatus(booking) {
  const total = Number(booking.total);
  const rental = Number(booking.rental);
  const paid = Number(booking.paid);
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0 && paid >= Math.ceil(rental / 2)) return "dp_paid";
  return "unpaid";
}

export async function hydrateBookings(client, bookingRows) {
  if (!bookingRows.length) return [];

  const settings = await getStoreSettings(client);
  const ids = bookingRows.map((b) => b.id);

  const [itemsRes, logsRes] = await Promise.all([
    client.query(
      `SELECT id, booking_id, item_id, variant_id, name, label, image, photo_url, unit_price, quantity, amount
       FROM booking_items
       WHERE booking_id = ANY($1)
       ORDER BY id`,
      [ids],
    ),
    client.query(
      `SELECT booking_id, action, actor, created_at
       FROM booking_logs
       WHERE booking_id = ANY($1)
       ORDER BY created_at DESC, id DESC`,
      [ids],
    ),
  ]);

  const itemsByBooking = new Map();
  for (const row of itemsRes.rows) {
    if (!itemsByBooking.has(row.booking_id)) itemsByBooking.set(row.booking_id, []);
    itemsByBooking.get(row.booking_id).push({
      ...row,
      image: Number(row.image),
      unit_price: Number(row.unit_price),
      quantity: Number(row.quantity),
      amount: Number(row.amount),
    });
  }

  const logsByBooking = new Map();
  for (const row of logsRes.rows) {
    if (!logsByBooking.has(row.booking_id)) logsByBooking.set(row.booking_id, []);
    logsByBooking.get(row.booking_id).push({
      action: row.action,
      actor: row.actor,
      created_at: row.created_at,
    });
  }

  return bookingRows.map((b) => {
    const items = itemsByBooking.get(b.id) || [];
    const logs = logsByBooking.get(b.id) || [];
    const late = computeLateMetrics(b, items, settings);

    return {
      id: b.id,
      code: b.code,
      token: b.token,
      user_id: b.user_id,
      source: b.source,
      status: b.status,
      customer_name: b.customer_name,
      phone: b.phone,
      address: b.address,
      identity_type: b.identity_type,
      note: b.note,
      bundle_id: b.bundle_id || "",
      start_at: b.start_at,
      end_at: b.end_at,
      days: Number(b.days),
      subtotal: Number(b.subtotal),
      discount: Number(b.discount),
      rental: Number(b.rental),
      total: Number(b.total),
      paid: Number(b.paid),
      payment_status: computePaymentStatus(b),
      collateral_received: Boolean(b.collateral_received),
      return_details: b.return_details || null,
      returned_at: b.returned_at || null,
      version: Number(b.version),
      created_at: b.created_at,
      updated_at: b.updated_at,
      ...late,
      items,
      logs,
    };
  });
}

export async function getBookingById(client, id) {
  const { rows } = await client.query("SELECT * FROM bookings WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const [hydrated] = await hydrateBookings(client, rows);
  return hydrated;
}

export async function getBookingByToken(client, token) {
  const { rows } = await client.query("SELECT * FROM bookings WHERE token = $1", [token]);
  if (!rows[0]) return null;
  const [hydrated] = await hydrateBookings(client, rows);
  return hydrated;
}
