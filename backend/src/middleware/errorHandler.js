import { ZodError } from "zod";

export class AppError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.` });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const msg = first
      ? `${first.path.length ? first.path.join(".") + ": " : ""}${first.message}`
      : "Data permintaan tidak valid.";
    return res.status(400).json({
      error: msg,
      details: err.flatten().fieldErrors,
    });
  }

  // PostgreSQL known error codes
  if (err?.code === "23505") {
    return res.status(409).json({ error: "Data sudah terdaftar (duplikat)." });
  }
  if (err?.code === "23503") {
    return res.status(400).json({ error: "Referensi data tidak ditemukan atau masih digunakan." });
  }
  if (err?.code === "22P02") {
    return res.status(400).json({ error: "Format parameter atau tanggal tidak valid." });
  }
  if (err?.code === "ECONNREFUSED" || err?.code === "57P01") {
    return res.status(503).json({ error: "Koneksi ke basis data PostgreSQL belum tersedia." });
  }

  console.error("[Unhandled Error]", err);
  return res.status(500).json({
    error: "Terjadi kesalahan internal pada server.",
  });
}
