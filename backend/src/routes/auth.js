import crypto from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../config/db.js";
import { validate } from "../middleware/validate.js";
import {
  clearSessionCookie,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signSessionToken,
} from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  email: z.string().trim().email("Format email tidak valid.").max(160),
  password: z.string().min(10, "Kata sandi minimal 10 karakter.").max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Nama staf minimal 2 karakter.").max(100),
  email: z.string().trim().email("Format email tidak valid.").max(160),
  password: z.string().min(10, "Kata sandi minimal 10 karakter.").max(128),
  role: z.enum(["cashier", "admin"]).default("cashier"),
});

const changePasswordSchema = z.object({
  current: z.string().min(1, "Kata sandi saat ini wajib diisi."),
  next: z.string().min(10, "Kata sandi baru minimal 10 karakter.").max(128),
});

router.post("/register", validate(registerSchema), async (req, res) => {
  const email = req.body.email.toLowerCase();
  const exists = await query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
  if (exists.rows[0]) {
    throw new AppError(409, "Email sudah terdaftar. Silakan masuk.");
  }

  const id = `usr-${crypto.randomUUID()}`;
  const passwordHash = await bcrypt.hash(req.body.password, 10);

  const { rows } = await query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'customer')
     RETURNING id, name, email, role`,
    [id, req.body.name, email, passwordHash],
  );

  const user = rows[0];
  setSessionCookie(res, signSessionToken(user));
  res.status(201).json(user);
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const email = req.body.email.toLowerCase();
  const { rows } = await query(
    "SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = $1",
    [email],
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(req.body.password, row.password_hash))) {
    throw new AppError(401, "Email atau kata sandi salah.");
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  setSessionCookie(res, signSessionToken(user));
  res.json(user);
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.post("/users", requireAdmin, validate(createStaffSchema), async (req, res) => {
  const email = req.body.email.toLowerCase();
  const exists = await query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
  if (exists.rows[0]) {
    throw new AppError(409, "Email staf sudah terdaftar.");
  }

  const id = `usr-${crypto.randomUUID()}`;
  const passwordHash = await bcrypt.hash(req.body.password, 10);

  const { rows } = await query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role`,
    [id, req.body.name, email, passwordHash, req.body.role],
  );

  res.status(201).json(rows[0]);
});

router.post("/password", requireAuth, validate(changePasswordSchema), async (req, res) => {
  const { rows } = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
  if (!rows[0] || !(await bcrypt.compare(req.body.current, rows[0].password_hash))) {
    throw new AppError(400, "Kata sandi saat ini tidak sesuai.");
  }

  const nextHash = await bcrypt.hash(req.body.next, 10);
  await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
    nextHash,
    req.user.id,
  ]);

  res.json({ ok: true });
});

export default router;
