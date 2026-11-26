import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, withTransaction } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, "../../data/synthetic_order_details_v3.csv");

// Komposisi komponen alat untuk 14 paket di CSV (P001 - P014)
const BUNDLE_RECIPES = {
  P001: [{ item_id: "P030", qty: 1 }, { item_id: "P037", qty: 1 }, { item_id: "P054", qty: 1 }], // Paket Tektok
  P002: [{ item_id: "P028", qty: 1 }, { item_id: "P034", qty: 1 }, { item_id: "P042", qty: 1 }, { item_id: "P054", qty: 1 }], // Paket Pendakian
  P003: [{ item_id: "P063", qty: 1 }, { item_id: "P066", qty: 1 }], // Paket Flysheet
  P004: [{ item_id: "P015", qty: 1 }, { item_id: "P034", qty: 2 }, { item_id: "P042", qty: 2 }, { item_id: "P046", qty: 1 }, { item_id: "P049", qty: 1 }], // Paket 2 Orang
  P005: [{ item_id: "P016", qty: 1 }, { item_id: "P034", qty: 3 }, { item_id: "P042", qty: 3 }, { item_id: "P046", qty: 1 }, { item_id: "P049", qty: 1 }], // Paket 3 Orang
  P006: [{ item_id: "P017", qty: 1 }, { item_id: "P034", qty: 4 }, { item_id: "P042", qty: 4 }, { item_id: "P045", qty: 1 }, { item_id: "P049", qty: 1 }], // Paket 4 Orang
  P007: [{ item_id: "P018", qty: 1 }, { item_id: "P034", qty: 6 }, { item_id: "P042", qty: 6 }, { item_id: "P045", qty: 1 }, { item_id: "P049", qty: 1 }], // Paket 6 Orang
  P008: [{ item_id: "P046", qty: 1 }, { item_id: "P051", qty: 1 }, { item_id: "P052", qty: 1 }], // Paket Grill A
  P009: [{ item_id: "P045", qty: 1 }, { item_id: "P051", qty: 1 }, { item_id: "P052", qty: 1 }], // Paket Grill B
  P010: [{ item_id: "P045", qty: 1 }, { item_id: "P051", qty: 1 }, { item_id: "P052", qty: 2 }, { item_id: "P060", qty: 1 }], // Paket Grill C
  P011: [{ item_id: "P059", qty: 1 }], // Paket Kursi 1
  P012: [{ item_id: "P059", qty: 2 }, { item_id: "P060", qty: 1 }], // Paket Kursi 2
  P013: [{ item_id: "P059", qty: 3 }, { item_id: "P060", qty: 1 }], // Paket Kursi 3
  P014: [{ item_id: "P059", qty: 4 }, { item_id: "P060", qty: 1 }], // Paket Kursi 4
};

function mapCategory(productId, csvCategory) {
  if (productId === "P035") return { category: "Sepatu", image: 0 };
  if (productId === "P059") return { category: "Kursi", image: 2 };
  if (csvCategory.startsWith("Tenda")) return { category: "Tenda", image: 3 };
  if (csvCategory.startsWith("Carrier")) return { category: "Carrier", image: 1 };
  return { category: "Perlengkapan", image: 4 };
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function importCsv() {
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = parseCsvLine(lines[0]);

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? "";
    });
    return obj;
  });

  console.log(`Membaca ${rows.length} baris dari CSV...`);

  const itemsMap = new Map();
  const bundlesMap = new Map();

  for (const r of rows) {
    const pid = r.product_id;
    const unitPrice = Number(r.unit_price) || 0;
    const duration = Number(r.duration_days) || 0;

    if (r.product_type === "bundle") {
      if (!bundlesMap.has(pid)) {
        bundlesMap.set(pid, {
          id: pid,
          name: r.product_name,
          category: r.category,
          basePrice: unitPrice,
        });
      } else if (duration === 1) {
        bundlesMap.get(pid).basePrice = unitPrice;
      }
    } else {
      if (!itemsMap.has(pid)) {
        const mapped = mapCategory(pid, r.category);
        itemsMap.set(pid, {
          id: pid,
          name: r.product_name,
          category: mapped.category,
          image: mapped.image,
          price: unitPrice,
          tags: `${r.product_name} ${r.category} ${r.product_type}`.toLowerCase(),
        });
      } else if (duration === 1) {
        itemsMap.get(pid).price = unitPrice;
      } else if (unitPrice < itemsMap.get(pid).price) {
        itemsMap.get(pid).price = unitPrice;
      }
    }
  }

  const txMap = new Map();
  for (const r of rows) {
    const txId = r.transaction_id;
    if (!txMap.has(txId)) {
      txMap.set(txId, {
        id: txId,
        split: r.split,
        scenarioType: r.scenario_type,
        dataSource: r.data_source || "synthetic",
        rentalStart: "",
        rentalEnd: "",
        days: 1,
        bundleId: null,
        totalSubtotal: 0,
        lines: [],
      });
    }
    const tx = txMap.get(txId);
    if (r.rental_start && !tx.rentalStart) {
      tx.rentalStart = r.rental_start;
      tx.rentalEnd = r.rental_end;
      tx.days = Math.max(1, Math.round(Number(r.duration_days) || 1));
    }
    if (r.product_type === "bundle") {
      tx.bundleId = r.product_id;
    }
    tx.totalSubtotal += Number(r.subtotal) || 0;
    tx.lines.push(r);
  }

  console.log("Menyimpan ke PostgreSQL...");

  await withTransaction(async (client) => {
    for (const item of itemsMap.values()) {
      await client.query(
        `INSERT INTO items (id, name, category, price, image, photo_url, description, tags, active)
         VALUES ($1, $2, $3, $4, $5, '', '', $6, TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.name, item.category, item.price, item.image, item.tags],
      );

      await client.query(
        `INSERT INTO item_variants (id, item_id, label, stock, maintenance)
         VALUES ($1, $2, 'Standard', 50, 0)
         ON CONFLICT (id) DO NOTHING`,
        [`var-${item.id}`, item.id],
      );
    }

    for (const b of bundlesMap.values()) {
      await client.query(
        `INSERT INTO bundles (id, name, description, category, image, photo_url, discount_per_day, active)
         VALUES ($1, $2, $3, 'Paket', 3, '', 0, TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [b.id, b.name, `Paket sewa ${b.name} (${b.category})`],
      );

      const recipe = BUNDLE_RECIPES[b.id] || [];
      for (const comp of recipe) {
        await client.query(
          `INSERT INTO bundle_items (bundle_id, variant_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (bundle_id, variant_id) DO NOTHING`,
          [b.id, `var-${comp.item_id}`, comp.qty],
        );
      }
    }

    let bookingCount = 0;
    let itemLineCount = 0;

    for (const tx of txMap.values()) {
      const startAt = `${tx.rentalStart}T08:00:00+07:00`;
      const endAt = `${tx.rentalEnd}T08:00:00+07:00`;
      const token = crypto.randomBytes(12).toString("hex");
      const note = `dataset:${tx.dataSource} | split:${tx.split} | scenario:${tx.scenarioType}`;

      await client.query(
        `INSERT INTO bookings (
          id, code, token, user_id, source, status,
          customer_name, phone, address, identity_type, note,
          bundle_id, start_at, end_at, days,
          subtotal, discount, rental, total, paid, collateral_received
        ) VALUES (
          $1, $2, $3, NULL, 'pos', 'returned',
          'Customer Sintetis', '08000000000', '', 'KTP', $4,
          $5, $6, $7, $8,
          $9, 0, $9, $9, $9, TRUE
        ) ON CONFLICT (id) DO NOTHING`,
        [
          tx.id,
          tx.id,
          token,
          note,
          tx.bundleId,
          startAt,
          endAt,
          tx.days,
          tx.totalSubtotal,
        ],
      );
      bookingCount++;

      let lineIdx = 1;
      for (const r of tx.lines) {
        const qty = Math.max(1, Number(r.quantity) || 1);
        const unitPrice = Number(r.unit_price) || 0;
        const subtotal = Number(r.subtotal) || 0;

        if (r.product_type === "bundle") {
          const recipe = BUNDLE_RECIPES[r.product_id] || [];
          for (let idx = 0; idx < recipe.length; idx++) {
            const comp = recipe[idx];
            const compItem = itemsMap.get(comp.item_id);
            const compQty = comp.qty * qty;
            const lineAmount = idx === 0 ? subtotal : 0;
            const lineUnitPrice = idx === 0 ? Math.round(subtotal / compQty) : 0;

            itemLineCount++;
            const biId = `${tx.id}-BI-${String(lineIdx++).padStart(3, "0")}`;
            await client.query(
              `INSERT INTO booking_items (
                id, booking_id, item_id, variant_id, name, label, image, photo_url, unit_price, quantity, amount
              ) VALUES ($1, $2, $3, $4, $5, 'Standard', $6, '', $7, $8, $9)
              ON CONFLICT (id) DO NOTHING`,
              [
                biId,
                tx.id,
                comp.item_id,
                `var-${comp.item_id}`,
                compItem ? compItem.name : comp.item_id,
                compItem ? compItem.image : 4,
                lineUnitPrice,
                compQty,
                lineAmount,
              ],
            );
          }
        } else {
          const masterItem = itemsMap.get(r.product_id);
          itemLineCount++;
          const biId = `${tx.id}-BI-${String(lineIdx++).padStart(3, "0")}`;
          await client.query(
            `INSERT INTO booking_items (
              id, booking_id, item_id, variant_id, name, label, image, photo_url, unit_price, quantity, amount
            ) VALUES ($1, $2, $3, $4, $5, 'Standard', $6, '', $7, $8, $9)
            ON CONFLICT (id) DO NOTHING`,
            [
              biId,
              tx.id,
              r.product_id,
              `var-${r.product_id}`,
              r.product_name,
              masterItem ? masterItem.image : 4,
              unitPrice,
              qty,
              subtotal,
            ],
          );
        }
      }
    }

    console.log(`Import selesai: ${itemsMap.size} items, ${bundlesMap.size} bundles, ${bookingCount} bookings, ${itemLineCount} booking_items.`);
  });

  await pool.end();
}

importCsv().catch((err) => {
  console.error("Import CSV gagal:", err);
  process.exit(1);
});