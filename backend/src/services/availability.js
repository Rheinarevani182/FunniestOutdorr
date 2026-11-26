import { AppError } from "../middleware/errorHandler.js";

/**
 * Exact peak concurrency over [rangeStartMs, rangeEndMs) using a sweep-line.
 * Back-to-back bookings (end === nextStart) do NOT conflict because release
 * events (-qty) are processed before acquisition events (+qty) at equal timestamps.
 */
export function computePeakAllocated(intervals, rangeStartMs, rangeEndMs) {
  const events = [];

  for (const iv of intervals) {
    const start = Math.max(rangeStartMs, iv.start);
    const end = Math.min(rangeEndMs, iv.end);
    if (end <= start || iv.qty <= 0) continue;
    events.push({ time: start, delta: iv.qty });
    events.push({ time: end, delta: -iv.qty });
  }

  if (events.length === 0) return 0;

  // Sort by timestamp ASC; at the same timestamp, process releases (-delta) first
  events.sort((a, b) => a.time - b.time || a.delta - b.delta);

  let current = 0;
  let peak = 0;
  for (const ev of events) {
    current += ev.delta;
    if (current > peak) peak = current;
  }
  return peak;
}

export function parseDateRange(startStr, endStr) {
  const startMs = Date.parse(startStr);
  const endMs = Date.parse(endStr);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new AppError(400, "Format tanggal ambil atau tanggal kembali tidak valid.");
  }
  if (endMs <= startMs) {
    throw new AppError(400, "Tanggal kembali harus lebih lambat dari tanggal ambil.");
  }
  return {
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    startMs,
    endMs,
  };
}

/**
 * Computes schedule-aware available units per variant for [startAt, endAt).
 * Only confirmed and rented bookings lock inventory; pending orders do not hold stock.
 */
export async function getVariantAvailability(client, { startAt, endAt, excludeBookingId = null, variantIds = null }) {
  const { startMs, endMs } = parseDateRange(startAt, endAt);

  const variantSql = variantIds?.length
    ? `SELECT id, item_id, label, stock, maintenance FROM item_variants WHERE id = ANY($1) ORDER BY item_id, id`
    : `SELECT id, item_id, label, stock, maintenance FROM item_variants ORDER BY item_id, id`;

  const variantRes = await client.query(variantSql, variantIds?.length ? [variantIds] : []);

  const overlapParams = [endAt, startAt];
  let overlapWhere = `b.status IN ('confirmed', 'rented') AND b.start_at < $1 AND b.end_at > $2`;
  if (excludeBookingId) {
    overlapParams.push(excludeBookingId);
    overlapWhere += ` AND b.id <> $${overlapParams.length}`;
  }
  if (variantIds?.length) {
    overlapParams.push(variantIds);
    overlapWhere += ` AND bi.variant_id = ANY($${overlapParams.length})`;
  }

  const overlapRes = await client.query(
    `SELECT bi.variant_id, bi.quantity, b.start_at, b.end_at
     FROM booking_items bi
     JOIN bookings b ON b.id = bi.booking_id
     WHERE ${overlapWhere}`,
    overlapParams,
  );

  const intervalsByVariant = new Map();
  for (const row of overlapRes.rows) {
    if (!intervalsByVariant.has(row.variant_id)) {
      intervalsByVariant.set(row.variant_id, []);
    }
    intervalsByVariant.get(row.variant_id).push({
      start: Date.parse(row.start_at),
      end: Date.parse(row.end_at),
      qty: Number(row.quantity),
    });
  }

  return variantRes.rows.map((v) => {
    const stock = Number(v.stock);
    const maintenance = Number(v.maintenance);
    const allocated = computePeakAllocated(
      intervalsByVariant.get(v.id) || [],
      startMs,
      endMs,
    );
    const available = Math.max(0, stock - maintenance - allocated);
    return {
      id: v.id,
      item_id: v.item_id,
      label: v.label,
      stock,
      maintenance,
      allocated,
      available,
    };
  });
}

/**
 * Locks involved variants in deterministic order inside an active transaction
 * and asserts requested quantities fit within schedule-aware availability.
 */
export async function assertAvailability(client, { requestedLines, startAt, endAt, excludeBookingId = null, lockRows = false }) {
  const variantIds = [...new Set(requestedLines.map((l) => l.variant_id))].sort();
  if (!variantIds.length) return;

  if (lockRows) {
    await client.query(
      "SELECT id FROM item_variants WHERE id = ANY($1) ORDER BY id FOR UPDATE",
      [variantIds],
    );
  }

  const availList = await getVariantAvailability(client, {
    startAt,
    endAt,
    excludeBookingId,
    variantIds,
  });
  const availMap = new Map(availList.map((v) => [v.id, v]));

  const namesRes = await client.query(
    `SELECT v.id, i.name, v.label
     FROM item_variants v
     JOIN items i ON i.id = v.item_id
     WHERE v.id = ANY($1)`,
    [variantIds],
  );
  const nameMap = new Map(namesRes.rows.map((r) => [r.id, `${r.name} (${r.label})`]));

  for (const line of requestedLines) {
    const info = availMap.get(line.variant_id);
    if (!info) {
      throw new AppError(400, `Varian perlengkapan tidak ditemukan (${line.variant_id}).`);
    }
    if (line.quantity > info.available) {
      const label = nameMap.get(line.variant_id) || line.variant_id;
      throw new AppError(
        409,
        `Stok ${label} tidak tersedia pada rentang tanggal yang dipilih (tersisa ${info.available} unit).`,
      );
    }
  }
}
