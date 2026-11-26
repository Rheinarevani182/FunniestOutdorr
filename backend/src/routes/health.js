import { Router } from "express";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/health", async (_req, res) => {
  let dbStatus = "disconnected";
  try {
    await pool.query("SELECT 1");
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  res.status(dbStatus === "connected" ? 200 : 503).json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    service: "funniest-outdoor-backend",
    db: dbStatus,
    ai_gateway: env.AI_SERVICE_URL ? "configured" : "fallback-only",
    timestamp: new Date().toISOString(),
  });
});

router.get("/openapi.json", (_req, res) => {
  res.json({
    openapi: "3.0.3",
    info: {
      title: "Funniest Outdoor Core Backend API",
      version: "1.0.0",
      description:
        "Core REST API (Express v5 + PostgreSQL + AI Gateway) untuk reservasi schedule-aware, POS kasir, katalog, dan integrasi FastAPI AI Service.",
    },
    servers: [{ url: "/api" }],
    paths: {
      "/health": { get: { summary: "Health check server & PostgreSQL" } },
      "/bootstrap": { get: { summary: "Muat user aktif, katalog, paket hemat, dan pengaturan toko" } },
      "/availability": { get: { summary: "Cek ketersediaan stok berbasis irisan tanggal (schedule-aware)" } },
      "/quote": { post: { summary: "Hitung tarif bertingkat otomatis & diskon paket" } },
      "/search": { post: { summary: "AI Gateway Semantic Search (FastAPI + fallback pg_trgm/ILIKE)" } },
      "/recommend": { post: { summary: "AI Gateway Rekomendasi Gear Bundling (FastAPI + fallback co-occurrence)" } },
      "/register": { post: { summary: "Registrasi akun pelanggan" } },
      "/login": { post: { summary: "Login dan set HttpOnly JWT cookie" } },
      "/logout": { post: { summary: "Logout dan hapus session cookie" } },
      "/bookings": {
        get: { summary: "Daftar pesanan (Staf)" },
        post: { summary: "Buat reservasi web atau transaksi POS kasir" },
      },
      "/my-bookings": { get: { summary: "Riwayat reservasi pelanggan" } },
      "/bookings/{id}": {
        get: { summary: "Detail pesanan (Staf)" },
        patch: { summary: "Dynamic Order Editor & transisi status pesanan (Staf)" },
      },
      "/bookings/{id}/payment": { post: { summary: "Catat pembayaran DP / pelunasan (Staf)" } },
      "/bookings/{id}/return": { post: { summary: "Proses pengembalian alat & jaminan (Staf)" } },
      "/booking/{token}": { get: { summary: "Status reservasi publik via token" } },
      "/invoice/{token}": { get: { summary: "Nota digital publik via token" } },
      "/items": { put: { summary: "Tambah / ubah produk & varian stok (Admin)" } },
      "/analytics": { get: { summary: "Dasbor analisis performa bisnis (Staf)" } },
      "/settings": { put: { summary: "Perbarui profil toko & tarif bertingkat (Admin)" } },
      "/users": { post: { summary: "Tambah akun kasir / admin baru (Admin)" } },
      "/password": { post: { summary: "Ganti kata sandi akun aktif" } },
    },
  });
});

export default router;
