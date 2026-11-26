import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/db.js";
import { requireAdmin, requireStaff } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(500).optional().default(""),
  hours: z.string().trim().max(160).optional().default(""),
  instagram: z.string().trim().max(300).optional().default(""),
  tiktok: z.string().trim().max(300).optional().default(""),
  maps: z.string().trim().max(500).optional().default(""),
  bank_name: z.string().trim().max(80).optional().default(""),
  bank_account: z.string().trim().max(80).optional().default(""),
  bank_holder: z.string().trim().max(120).optional().default(""),
  late_daily: z.coerce.number().int().min(0).optional().default(0),
  tiers: z
    .array(
      z.object({
        min_days: z.coerce.number().int().min(1),
        factor: z.coerce.number().min(0.01).max(2),
      }),
    )
    .min(1),
  terms: z.string().trim().max(2000).optional().default(""),
});

function toWibDateKey(date) {
  return new Date(date.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

router.get("/analytics", requireStaff, async (req, res) => {
  const from = typeof req.query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)
    ? req.query.from
    : null;
  const to = typeof req.query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to)
    ? req.query.to
    : null;

  const params = [];
  const clauses = ["1=1"];
  if (from) {
    params.push(`${from}T00:00:00+07:00`);
    clauses.push(`b.created_at >= $${params.length}`);
  }
  if (to) {
    params.push(`${to}T23:59:59.999+07:00`);
    clauses.push(`b.created_at <= $${params.length}`);
  }
  const whereSql = clauses.join(" AND ");

  const [summaryRes, topRes, dailyRes] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN b.status <> 'cancelled' AND b.paid >= b.total THEN b.rental ELSE 0 END), 0)::bigint AS revenue,
         COUNT(*) FILTER (WHERE b.status <> 'cancelled')::int AS orders,
         COUNT(*) FILTER (WHERE b.status = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE b.status = 'rented')::int AS active,
         COUNT(*) FILTER (WHERE b.status = 'rented')::int AS unreturned,
         COALESCE(ROUND(AVG(b.rental) FILTER (WHERE b.status <> 'cancelled')), 0)::bigint AS average_rental
       FROM bookings b
       WHERE ${whereSql}`,
      params,
    ),
    pool.query(
      `SELECT
         bi.item_id AS id,
         MAX(bi.name) AS name,
         SUM(bi.quantity)::int AS quantity,
         SUM(bi.amount)::bigint AS amount
       FROM booking_items bi
       JOIN bookings b ON b.id = bi.booking_id
       WHERE b.status <> 'cancelled' AND ${whereSql}
       GROUP BY bi.item_id
       ORDER BY quantity DESC, amount DESC
       LIMIT 20`,
      params,
    ),
    pool.query(
      `SELECT
         TO_CHAR(b.created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day_key,
         COALESCE(SUM(CASE WHEN b.status <> 'cancelled' AND b.paid >= b.total THEN b.rental ELSE 0 END), 0)::bigint AS amount
       FROM bookings b
       WHERE ${whereSql}
       GROUP BY day_key`,
      params,
    ),
  ]);

  const s = summaryRes.rows[0];
  const dailyMap = new Map(dailyRes.rows.map((r) => [r.day_key, Number(r.amount)]));

  // Build 7-day trend ending at `to` (or today WIB)
  const anchor = to ? new Date(`${to}T12:00:00+07:00`) : new Date();
  const daily = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(anchor.getTime() - offset * 86_400_000);
    const key = toWibDateKey(d);
    daily.push({
      date: key,
      amount: dailyMap.get(key) || 0,
    });
  }

  res.json({
    revenue: Number(s.revenue),
    orders: Number(s.orders),
    pending: Number(s.pending),
    active: Number(s.active),
    unreturned: Number(s.unreturned),
    averageRental: Number(s.average_rental),
    daily,
    top: topRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      quantity: Number(r.quantity),
      amount: Number(r.amount),
    })),
  });
});

router.put("/settings", requireAdmin, validate(settingsSchema), async (req, res) => {
  const b = req.body;
  const sortedTiers = [...b.tiers].sort((a, c) => a.min_days - c.min_days);

  const { rows } = await pool.query(
    `INSERT INTO store_settings (
       id, name, phone, address, hours, instagram, tiktok, maps,
       bank_name, bank_account, bank_holder, late_daily, tiers, terms, updated_at
     ) VALUES (
       1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, NOW()
     )
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       phone = EXCLUDED.phone,
       address = EXCLUDED.address,
       hours = EXCLUDED.hours,
       instagram = EXCLUDED.instagram,
       tiktok = EXCLUDED.tiktok,
       maps = EXCLUDED.maps,
       bank_name = EXCLUDED.bank_name,
       bank_account = EXCLUDED.bank_account,
       bank_holder = EXCLUDED.bank_holder,
       late_daily = EXCLUDED.late_daily,
       tiers = EXCLUDED.tiers,
       terms = EXCLUDED.terms,
       updated_at = NOW()
     RETURNING *`,
    [
      b.name,
      b.phone,
      b.address,
      b.hours,
      b.instagram,
      b.tiktok,
      b.maps,
      b.bank_name,
      b.bank_account,
      b.bank_holder,
      b.late_daily,
      JSON.stringify(sortedTiers),
      b.terms,
    ],
  );

  res.json({ settings: rows[0] });
});

export default router;
