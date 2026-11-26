import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool, query, withTransaction } from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../middleware/errorHandler.js";
import { getVariantAvailability } from "../services/availability.js";
import { calculateQuote, getStoreSettings } from "../services/pricing.js";

const router = Router();

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(100),
      }),
    )
    .min(1, "Pilih minimal satu perlengkapan."),
  bundle_id: z.string().optional().default(""),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  exclude_id: z.string().nullable().optional(),
});

const itemUpsertSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter.").max(140),
  category: z.enum(["Tenda", "Carrier", "Sepatu", "Kursi", "Perlengkapan"]),
  price: z.coerce.number().int().min(0),
  image: z.coerce.number().int().min(0).max(11).default(4),
  photo_url: z.string().max(450000).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  tags: z.string().max(500).optional().default(""),
  active: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)),
  variants: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80).optional(),
        label: z.string().trim().min(1, "Label varian wajib diisi.").max(80),
        stock: z.coerce.number().int().min(0).max(1000),
        maintenance: z.coerce.number().int().min(0).max(1000).optional().default(0),
      }),
    )
    .min(1, "Minimal harus memiliki 1 varian."),
});

function slugify(text) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "item"}-${crypto.randomBytes(2).toString("hex")}`;
}

async function fetchCatalogItems(client) {
  const [itemsRes, variantsRes] = await Promise.all([
    client.query(
      `SELECT id, name, category, price, image, photo_url, description, tags, active
       FROM items
       ORDER BY created_at ASC, name ASC`,
    ),
    client.query(
      `SELECT id, item_id, label, stock, maintenance
       FROM item_variants
       ORDER BY created_at ASC, id ASC`,
    ),
  ]);

  const variantsByItem = new Map();
  for (const v of variantsRes.rows) {
    if (!variantsByItem.has(v.item_id)) variantsByItem.set(v.item_id, []);
    variantsByItem.get(v.item_id).push({
      id: v.id,
      item_id: v.item_id,
      label: v.label,
      stock: Number(v.stock),
      maintenance: Number(v.maintenance),
    });
  }

  return itemsRes.rows.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    image: Number(item.image),
    photo_url: item.photo_url || "",
    description: item.description || "",
    tags: item.tags || "",
    active: item.active ? 1 : 0,
    variants: variantsByItem.get(item.id) || [],
  }));
}

async function fetchBundles(client) {
  const [bundlesRes, recipeRes] = await Promise.all([
    client.query(
      `SELECT id, name, description, category, image, photo_url, discount_per_day
       FROM bundles
       WHERE active = TRUE
       ORDER BY created_at ASC`,
    ),
    client.query(
      `SELECT bundle_id, variant_id, quantity FROM bundle_items ORDER BY bundle_id, variant_id`,
    ),
  ]);

  const recipeByBundle = new Map();
  for (const r of recipeRes.rows) {
    if (!recipeByBundle.has(r.bundle_id)) recipeByBundle.set(r.bundle_id, []);
    recipeByBundle.get(r.bundle_id).push({
      variant_id: r.variant_id,
      quantity: Number(r.quantity),
    });
  }

  return bundlesRes.rows.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description || "",
    category: b.category || "Paket",
    image: Number(b.image),
    photo_url: b.photo_url || "",
    discount_per_day: Number(b.discount_per_day),
    recipe: recipeByBundle.get(b.id) || [],
  }));
}

router.get("/bootstrap", async (req, res) => {
  const [items, bundles, settings] = await Promise.all([
    fetchCatalogItems(pool),
    fetchBundles(pool),
    getStoreSettings(pool),
  ]);

  res.json({
    user: req.user || null,
    items,
    bundles,
    settings,
  });
});

router.get("/availability", async (req, res) => {
  const { start, end, exclude } = req.query;
  if (!start || !end) {
    throw new AppError(400, "Parameter start dan end wajib diisi.");
  }

  const variants = await getVariantAvailability(pool, {
    startAt: String(start),
    endAt: String(end),
    excludeBookingId: exclude ? String(exclude) : null,
  });

  res.json({ variants });
});

router.post("/quote", validate(quoteSchema), async (req, res) => {
  const quote = await calculateQuote(pool, {
    items: req.body.items,
    bundleId: req.body.bundle_id,
    startAt: req.body.start_at,
    endAt: req.body.end_at,
    excludeBookingId: req.body.exclude_id || null,
    checkStock: true,
  });

  res.json(quote);
});

router.put("/items", requireAdmin, validate(itemUpsertSchema), async (req, res) => {
  const payload = req.body;

  for (const v of payload.variants) {
    if (v.maintenance > v.stock) {
      throw new AppError(400, `Unit maintenance varian "${v.label}" tidak boleh melebihi total stok.`);
    }
  }

  const savedItem = await withTransaction(async (client) => {
    const itemId = payload.id || slugify(payload.name);

    await client.query(
      `INSERT INTO items (id, name, category, price, image, photo_url, description, tags, active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         price = EXCLUDED.price,
         image = EXCLUDED.image,
         photo_url = EXCLUDED.photo_url,
         description = EXCLUDED.description,
         tags = EXCLUDED.tags,
         active = EXCLUDED.active,
         updated_at = NOW()`,
      [
        itemId,
        payload.name,
        payload.category,
        payload.price,
        payload.image,
        payload.photo_url,
        payload.description,
        payload.tags,
        payload.active,
      ],
    );

    const savedVariants = [];
    for (const v of payload.variants) {
      const variantId = v.id || `var-${slugify(v.label)}`;
      const { rows } = await client.query(
        `INSERT INTO item_variants (id, item_id, label, stock, maintenance, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET
           label = EXCLUDED.label,
           stock = EXCLUDED.stock,
           maintenance = EXCLUDED.maintenance,
           updated_at = NOW()
         RETURNING id, item_id, label, stock, maintenance`,
        [variantId, itemId, v.label, v.stock, v.maintenance],
      );
      savedVariants.push({
        ...rows[0],
        stock: Number(rows[0].stock),
        maintenance: Number(rows[0].maintenance),
      });
    }

    return {
      id: itemId,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      image: payload.image,
      photo_url: payload.photo_url,
      description: payload.description,
      tags: payload.tags,
      active: payload.active ? 1 : 0,
      variants: savedVariants,
    };
  });

  res.json({ item: savedItem });
});

export default router;
