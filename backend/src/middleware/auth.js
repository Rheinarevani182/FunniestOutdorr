import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { AppError } from "./errorHandler.js";

export function signSessionToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: `${env.SESSION_TTL_DAYS}d` },
  );
}

export function setSessionCookie(res, token) {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });
}

export async function attachUser(req, _res, next) {
  try {
    const cookieToken = req.cookies?.[env.SESSION_COOKIE_NAME];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      req.user = null;
      return next();
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      req.user = null;
      return next();
    }

    const { rows } = await query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [payload.sub],
    );
    req.user = rows[0] || null;
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new AppError(401, "Silakan masuk terlebih dahulu."));
  }
  return next();
}

export function requireStaff(req, _res, next) {
  if (!req.user) {
    return next(new AppError(401, "Silakan masuk untuk mengakses panel staf."));
  }
  if (!["admin", "cashier"].includes(req.user.role)) {
    return next(new AppError(403, "Halaman ini hanya tersedia untuk staf yang berwenang."));
  }
  return next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) {
    return next(new AppError(401, "Silakan masuk sebagai administrator."));
  }
  if (req.user.role !== "admin") {
    return next(new AppError(403, "Akses ditolak. Fitur ini khusus administrator."));
  }
  return next();
}
