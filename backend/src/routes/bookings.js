import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../config/db.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertAvailability } from "../services/availability.js";
import { calculateQuote, getStoreSettings } from "../services/pricing.js";
import {
  generateBookingCode,
  generateBookingToken,
  getBookingById,
  getBookingByToken,
  hydrateBookings,
} from "../services/bookings.js";

const router = Router();

const phoneRegex = /^(08\d{8,12}|628\d{8,12})$/;

function normalizePhone(raw) {
  const cleaned = String(raw || "").replace(/[\s()+-]/g, "");
  if (!phoneRegex.test(cleaned)) {
    throw new AppError(400, "Masukkan nomor WhatsApp Indonesia yang valid (contoh: 0812xxxx atau 62812xxxx).");
  }
  return cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
}

const lineSchema = z.object({
  variant_id: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(100),
});

const createBookingSchema = z.object({
  customer_name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter.").max(100),
  phone: z.string().trim().min(9, "Nomor WhatsApp wajib diisi.").max(30),
  address: z.string().trim().max(500).optional().default(""),
  identity_type: z.enum(["KTP", "SIM"]).optional().default("KTP"),
  note: z.string().trim().max(1000).optional().default(""),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  items: z.array(lineSchema).min(1, "Pilih minimal satu perlengkapan.").max(100),
  bundle_id: z.string().optional().default(""),
  source: z.enum(["web", "pos"]).optional().default("web"),
});

const patchBookingSchema = z.object({
  // Dynamic Order Editor fields
  customer_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(9).max(30).optional(),
  address: z.string().trim().max(500).optional(),
  identity_type: z.enum(["KTP", "SIM"]).optional(),
  note: z.string().trim().max(1000).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  items: z.array(lineSchema).min(1).max(100).optional(),
  bundle_id: z.string().optional(),
  version: z.coerce.number().int().min(1).optional(),
  // Status transition fields
  status: z.enum(["confirmed", "rented", "cancelled"]).optional(),
  refund_confirmed: z.boolean().optional(),
  collateral_received: z.boolean().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().int().min(1, "Nominal pembayaran harus lebih dari 0."),
  method: z.enum(["transfer", "cash"]),
});

const returnSchema = z.object({
  fee: z.coerce.number().int().min(0).default(0),
  note: z.string().trim().max(1000).optional().default(""),
  conditions: z.record(z.string(), z.boolean()).default({}),
  settled: z.boolean(),
  identity_returned: z.boolean(),
});

// Staff list (max 500 latest)
router.get("/bookings", requireStaff, async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 500",
  );
  const bookings = await hydrateBookings(pool, rows);
  res.json({ bookings });
});

// Logged-in customer booking history
router.get("/my-bookings", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
    [req.user.id],
  );
  const bookings = await hydrateBookings(pool, rows);
  res.json({ bookings });
});

// Staff booking detail
router.get("/bookings/:id", requireStaff, async (req, res) => {
  const booking = await getBookingById(pool, req.params.id);
  if (!booking) {
    throw new AppError(404, "Pesanan tidak ditemukan.");
  }
  res.json({ booking });
});

// Create booking (web reservation or in-store POS)
router.post("/bookings", requireAuth, validate(createBookingSchema), async (req, res) => {
  const isStaff = ["admin", "cashier"].includes(req.user.role);
  const source = req.body.source === "pos" && isStaff ? "pos" : "web";
  const phone = normalizePhone(req.body.phone);

  const created = await withTransaction(async (client) => {
    const quote = await calculateQuote(client, {
      items: req.body.items,
      bundleId: req.body.bundle_id,
      startAt: req.body.start_at,
      endAt: req.body.end_at,
      checkStock: true,
      lockRows: true,
    });

    const id = `bkg-${crypto.randomUUID()}`;
    const code = generateBookingCode();
    const token = generateBookingToken();

    await client.query(
      `INSERT INTO bookings (
        id, code, token, user_id, source, status,
        customer_name, phone, address, identity_type, note, bundle_id,
        start_at, end_at, days, subtotal, discount, rental, total, paid
      ) VALUES (
        $1, $2, $3, $4, $5, 'pending',
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, 0
      )`,
      [
        id,
        code,
        token,
        source === "web" ? req.user.id : null,
        source,
        req.body.customer_name,
        phone,
        req.body.address,
        req.body.identity_type,
        req.body.note,
        quote.bundle_id,
        quote.start_at,
        quote.end_at,
        quote.days,
        quote.subtotal,
        quote.discount,
        quote.rental,
        quote.total,
      ],
    );

    for (const item of quote.items) {
      await client.query(
        `INSERT INTO booking_items (
          id, booking_id, item_id, variant_id, name, label, image, photo_url, unit_price, quantity, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `bi-${crypto.randomUUID()}`,
          id,
          item.item_id,
          item.variant_id,
          item.name,
          item.label,
          item.image,
          item.photo_url,
          item.unit_price,
          item.quantity,
          item.amount,
        ],
      );
    }

    await client.query(
      "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
      [
        id,
        source === "pos"
          ? `Transaksi kasir dibuat (${quote.items.length} jenis barang, ${quote.days} hari)`
          : `Reservasi website dibuat (${quote.items.length} jenis barang, ${quote.days} hari)`,
        req.user.name,
      ],
    );

    return getBookingById(client, id);
  });

  res.status(201).json(created);
});

// Dynamic Order Editor & Status Transition (Staff only)
router.patch("/bookings/:id", requireStaff, validate(patchBookingSchema), async (req, res) => {
  const bookingId = req.params.id;
  const body = req.body;

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM bookings WHERE id = $1 FOR UPDATE",
      [bookingId],
    );
    const existing = rows[0];
    if (!existing) {
      throw new AppError(404, "Pesanan tidak ditemukan.");
    }

    // Mode 1: Status transition (confirmed / rented / cancelled)
    if (body.status) {
      const currentStatus = existing.status;
      const nextStatus = body.status;

      if (["returned", "cancelled"].includes(currentStatus)) {
        throw new AppError(400, "Pesanan yang sudah selesai atau dibatalkan tidak dapat diubah.");
      }

      if (nextStatus === "confirmed") {
        if (currentStatus !== "pending") {
          throw new AppError(400, "Hanya pesanan berstatus menunggu DP yang dapat dikonfirmasi.");
        }
        const minDp = Math.ceil(Number(existing.rental) / 2);
        if (Number(existing.paid) < minDp) {
          throw new AppError(
            400,
            `Pembayaran DP minimal 50% (Rp${minDp.toLocaleString("id-ID")}) belum terpenuhi.`,
          );
        }

        // Re-verify schedule-aware availability atomically before locking stock
        const lineRes = await client.query(
          "SELECT variant_id, quantity FROM booking_items WHERE booking_id = $1",
          [bookingId],
        );
        await assertAvailability(client, {
          requestedLines: lineRes.rows.map((r) => ({
            variant_id: r.variant_id,
            quantity: Number(r.quantity),
          })),
          startAt: existing.start_at,
          endAt: existing.end_at,
          excludeBookingId: bookingId,
          lockRows: true,
        });

        await client.query(
          `UPDATE bookings SET status = 'confirmed', version = version + 1, updated_at = NOW() WHERE id = $1`,
          [bookingId],
        );
        await client.query(
          "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
          [bookingId, "Reservasi dikonfirmasi · stok di-keep sesuai jadwal", req.user.name],
        );
      } else if (nextStatus === "rented") {
        if (currentStatus !== "confirmed") {
          throw new AppError(400, "Pesanan harus berstatus dikonfirmasi sebelum serah terima.");
        }
        if (!body.collateral_received) {
          throw new AppError(400, "Konfirmasi penerimaan jaminan KTP/SIM terlebih dahulu.");
        }
        if (Number(existing.paid) < Number(existing.total)) {
          throw new AppError(400, "Lunasi sisa pembayaran sewa terlebih dahulu sebelum serah terima alat.");
        }

        await client.query(
          `UPDATE bookings
           SET status = 'rented', collateral_received = TRUE, version = version + 1, updated_at = NOW()
           WHERE id = $1`,
          [bookingId],
        );
        await client.query(
          "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
          [
            bookingId,
            `Alat diserahkan ke penyewa · jaminan ${existing.identity_type} diterima`,
            req.user.name,
          ],
        );
      } else if (nextStatus === "cancelled") {
        if (!["pending", "confirmed"].includes(currentStatus)) {
          throw new AppError(400, "Pesanan yang sedang dibawa tidak dapat dibatalkan; gunakan proses pengembalian.");
        }
        const paid = Number(existing.paid);
        if (paid > 0 && !body.refund_confirmed) {
          throw new AppError(400, "Konfirmasi pengembalian dana pembayaran terlebih dahulu.");
        }

        const returnDetails = paid > 0
          ? { fee: 0, cancelled_refund: paid, note: "Pesanan dibatalkan dan pembayaran dikembalikan manual." }
          : null;

        await client.query(
          `UPDATE bookings
           SET status = 'cancelled', return_details = $2, version = version + 1, updated_at = NOW()
           WHERE id = $1`,
          [bookingId, returnDetails ? JSON.stringify(returnDetails) : null],
        );
        await client.query(
          "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
          [bookingId, "Pesanan dibatalkan · alokasi stok dilepas", req.user.name],
        );
      }

      return getBookingById(client, bookingId);
    }

    // Mode 2: Dynamic Order Editor (edit items, dates, duration, customer details)
    if (!["pending", "confirmed", "rented"].includes(existing.status)) {
      throw new AppError(400, "Pesanan yang sudah selesai atau dibatalkan tidak dapat diedit.");
    }
    if (body.version !== undefined && Number(body.version) !== Number(existing.version)) {
      throw new AppError(
        409,
        "Pesanan baru saja diubah oleh staf lain. Muat ulang halaman sebelum menyimpan perubahan.",
      );
    }
    if (!body.items?.length) {
      throw new AppError(400, "Minimal satu perlengkapan wajib ada di pesanan.");
    }

    const phone = body.phone ? normalizePhone(body.phone) : existing.phone;
    const startAt = body.start_at || existing.start_at;
    const endAt = body.end_at || existing.end_at;

    const quote = await calculateQuote(client, {
      items: body.items,
      bundleId: body.bundle_id ?? existing.bundle_id ?? "",
      startAt,
      endAt,
      excludeBookingId: bookingId,
      checkStock: true,
      lockRows: true,
    });

    await client.query(
      `UPDATE bookings SET
         customer_name = $2,
         phone = $3,
         address = $4,
         identity_type = $5,
         note = $6,
         bundle_id = $7,
         start_at = $8,
         end_at = $9,
         days = $10,
         subtotal = $11,
         discount = $12,
         rental = $13,
         total = $14,
         version = version + 1,
         updated_at = NOW()
       WHERE id = $1`,
      [
        bookingId,
        body.customer_name ?? existing.customer_name,
        phone,
        body.address ?? existing.address,
        body.identity_type ?? existing.identity_type,
        body.note ?? existing.note,
        quote.bundle_id,
        quote.start_at,
        quote.end_at,
        quote.days,
        quote.subtotal,
        quote.discount,
        quote.rental,
        quote.total,
      ],
    );

    await client.query("DELETE FROM booking_items WHERE booking_id = $1", [bookingId]);
    for (const item of quote.items) {
      await client.query(
        `INSERT INTO booking_items (
          id, booking_id, item_id, variant_id, name, label, image, photo_url, unit_price, quantity, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `bi-${crypto.randomUUID()}`,
          bookingId,
          item.item_id,
          item.variant_id,
          item.name,
          item.label,
          item.image,
          item.photo_url,
          item.unit_price,
          item.quantity,
          item.amount,
        ],
      );
    }

    await client.query(
      "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
      [
        bookingId,
        `Pesanan diubah (${quote.items.length} jenis barang, ${quote.days} hari, total Rp${quote.total.toLocaleString("id-ID")})`,
        req.user.name,
      ],
    );

    return getBookingById(client, bookingId);
  });

  res.json({ booking: updated });
});

// Record payment (DP or remaining settlement)
router.post("/bookings/:id/payment", requireStaff, validate(paymentSchema), async (req, res) => {
  const bookingId = req.params.id;
  const { amount, method } = req.body;

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM bookings WHERE id = $1 FOR UPDATE",
      [bookingId],
    );
    const existing = rows[0];
    if (!existing) {
      throw new AppError(404, "Pesanan tidak ditemukan.");
    }
    if (["cancelled", "returned"].includes(existing.status)) {
      throw new AppError(400, "Tidak dapat mencatat pembayaran untuk pesanan yang sudah selesai/dibatalkan.");
    }

    const remaining = Math.max(0, Number(existing.total) - Number(existing.paid));
    if (amount > remaining) {
      throw new AppError(
        400,
        `Nominal melebihi sisa tagihan (Rp${remaining.toLocaleString("id-ID")}).`,
      );
    }

    await client.query(
      `INSERT INTO payments (id, booking_id, amount, method, recorded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [`pay-${crypto.randomUUID()}`, bookingId, amount, method, req.user.id],
    );

    await client.query(
      `UPDATE bookings SET paid = paid + $2, version = version + 1, updated_at = NOW() WHERE id = $1`,
      [bookingId, amount],
    );

    await client.query(
      "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
      [
        bookingId,
        `Pembayaran Rp${amount.toLocaleString("id-ID")} dicatat (${method === "cash" ? "Tunai" : "Transfer"})`,
        req.user.name,
      ],
    );

    return getBookingById(client, bookingId);
  });

  res.json({ booking: updated });
});

// Process gear return
router.post("/bookings/:id/return", requireStaff, validate(returnSchema), async (req, res) => {
  const bookingId = req.params.id;
  const { fee, note, conditions, settled, identity_returned } = req.body;

  if (!settled || !identity_returned) {
    throw new AppError(
      400,
      "Pastikan seluruh alat diperiksa, biaya tambahan dilunasi, dan jaminan KTP/SIM telah dikembalikan.",
    );
  }

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM bookings WHERE id = $1 FOR UPDATE",
      [bookingId],
    );
    const existing = rows[0];
    if (!existing) {
      throw new AppError(404, "Pesanan tidak ditemukan.");
    }
    if (existing.status !== "rented") {
      throw new AppError(400, "Hanya pesanan berstatus sedang disewa yang dapat diproses pengembaliannya.");
    }

    const returnDetails = {
      fee,
      deposit_returned: 0,
      extra_due: 0,
      note: note || "Seluruh perlengkapan kembali lengkap dan diperiksa.",
      conditions,
      returned_at: new Date().toISOString(),
    };

    await client.query(
      `UPDATE bookings
       SET status = 'returned',
           return_details = $2,
           returned_at = NOW(),
           version = version + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [bookingId, JSON.stringify(returnDetails)],
    );

    await client.query(
      "INSERT INTO booking_logs (booking_id, action, actor) VALUES ($1, $2, $3)",
      [
        bookingId,
        fee > 0
          ? `Pengembalian selesai · biaya tambahan Rp${fee.toLocaleString("id-ID")} lunas · jaminan dikembalikan`
          : "Pengembalian selesai tepat kondisi · jaminan KTP/SIM dikembalikan",
        req.user.name,
      ],
    );

    return getBookingById(client, bookingId);
  });

  res.json({ booking: updated });
});

// Public booking status by secret token
router.get("/booking/:token", async (req, res) => {
  const [booking, settings] = await Promise.all([
    getBookingByToken(pool, req.params.token),
    getStoreSettings(pool),
  ]);
  if (!booking) {
    throw new AppError(404, "Tautan reservasi tidak ditemukan.");
  }
  res.json({ booking, settings });
});

// Public digital receipt (nota) by secret token
router.get("/invoice/:token", async (req, res) => {
  const [booking, settings] = await Promise.all([
    getBookingByToken(pool, req.params.token),
    getStoreSettings(pool),
  ]);
  if (!booking) {
    throw new AppError(404, "Nota digital tidak ditemukan.");
  }
  res.json({ booking, settings });
});

export default router;
