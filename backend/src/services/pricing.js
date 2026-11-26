import { AppError } from "../middleware/errorHandler.js";
import { assertAvailability, parseDateRange } from "./availability.js";

const DAY_MS = 86_400_000;

export function calculateDays(startAt, endAt) {
  const { startMs, endMs } = parseDateRange(startAt, endAt);
  return Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));
}

export function resolveTierFactor(tiers, days) {
  if (!Array.isArray(tiers) || tiers.length === 0) return 1;
  const sorted = [...tiers].sort((a, b) => Number(b.min_days) - Number(a.min_days));
  const match = sorted.find((t) => days >= Number(t.min_days));
  return match ? Number(match.factor) : 1;
}

export function normalizeLines(rawLines) {
  const map = new Map();
  for (const l of rawLines || []) {
    const qty = Number(l.quantity);
    if (!l.variant_id || !Number.isInteger(qty) || qty < 1 || qty > 100) {
      throw new AppError(400, "Jumlah item harus berupa angka bulat antara 1 sampai 100.");
    }
    map.set(l.variant_id, Math.min(100, (map.get(l.variant_id) || 0) + qty));
  }
  return [...map.entries()].map(([variant_id, quantity]) => ({ variant_id, quantity }));
}

export async function getStoreSettings(client) {
  const { rows } = await client.query("SELECT * FROM store_settings WHERE id = 1");
  if (rows[0]) {
    return {
      ...rows[0],
      late_daily: Number(rows[0].late_daily || 0),
      tiers: Array.isArray(rows[0].tiers)
        ? rows[0].tiers
        : [{ min_days: 1, factor: 1 }],
    };
  }
  return {
    name: "Funniest.Outdoor",
    phone: "",
    address: "Surabaya Utara, Jawa Timur",
    hours: "Setiap hari · 08.00 – 21.00 WIB",
    instagram: "",
    tiktok: "",
    maps: "",
    bank_name: "BCA",
    bank_account: "",
    bank_holder: "Funniest Outdoor",
    late_daily: 0,
    tiers: [
      { min_days: 1, factor: 1 },
      { min_days: 3, factor: 0.9 },
      { min_days: 5, factor: 0.85 },
    ],
    terms: "",
  };
}

export async function calculateQuote(
  client,
  { items: rawItems, bundleId = "", startAt, endAt, excludeBookingId = null, checkStock = true, lockRows = false },
) {
  const lines = normalizeLines(rawItems);
  if (lines.length === 0) {
    throw new AppError(400, "Pilih minimal satu perlengkapan.");
  }

  const { startAt: normStart, endAt: normEnd } = parseDateRange(startAt, endAt);
  const days = calculateDays(normStart, normEnd);

  if (checkStock) {
    await assertAvailability(client, {
      requestedLines: lines,
      startAt: normStart,
      endAt: normEnd,
      excludeBookingId,
      lockRows,
    });
  }

  const settings = await getStoreSettings(client);
  const factor = resolveTierFactor(settings.tiers, days);

  const variantIds = lines.map((l) => l.variant_id);
  const { rows: variantRows } = await client.query(
    `SELECT v.id AS variant_id, v.item_id, v.label, i.name, i.price, i.image, i.photo_url, i.active
     FROM item_variants v
     JOIN items i ON i.id = v.item_id
     WHERE v.id = ANY($1)`,
    [variantIds],
  );
  const variantMap = new Map(variantRows.map((r) => [r.variant_id, r]));

  const detailedItems = lines.map((line) => {
    const info = variantMap.get(line.variant_id);
    if (!info) {
      throw new AppError(400, `Perlengkapan tidak ditemukan (${line.variant_id}).`);
    }
    const unitPrice = Number(info.price);
    const amount = Math.round(unitPrice * line.quantity * days * factor);
    return {
      variant_id: info.variant_id,
      item_id: info.item_id,
      name: info.name,
      label: info.label,
      image: Number(info.image),
      photo_url: info.photo_url || "",
      unit_price: unitPrice,
      quantity: line.quantity,
      amount,
    };
  });

  const subtotal = detailedItems.reduce((sum, l) => sum + l.amount, 0);

  // Apply bundle discount only if the full bundle recipe is present in cart
  let discount = 0;
  let appliedBundleId = null;
  if (bundleId) {
    const bundleRes = await client.query(
      "SELECT id, discount_per_day FROM bundles WHERE id = $1 AND active = TRUE",
      [bundleId],
    );
    if (bundleRes.rows[0]) {
      const recipeRes = await client.query(
        "SELECT variant_id, quantity FROM bundle_items WHERE bundle_id = $1",
        [bundleId],
      );
      const qtyMap = new Map(lines.map((l) => [l.variant_id, l.quantity]));
      const complete =
        recipeRes.rows.length > 0 &&
        recipeRes.rows.every((r) => (qtyMap.get(r.variant_id) || 0) >= Number(r.quantity));

      if (complete) {
        discount = Math.min(subtotal, Number(bundleRes.rows[0].discount_per_day) * days);
        appliedBundleId = bundleRes.rows[0].id;
      }
    }
  }

  const rental = Math.max(0, subtotal - discount);
  const total = rental;

  return {
    start_at: normStart,
    end_at: normEnd,
    days,
    factor,
    subtotal,
    discount,
    rental,
    total,
    dp_min: Math.ceil(rental / 2),
    bundle_id: appliedBundleId,
    items: detailedItems,
  };
}
