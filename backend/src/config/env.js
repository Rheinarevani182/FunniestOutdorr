import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5173),
  CORS_ORIGIN: z.string().default("http://localhost:5174,http://127.0.0.1:5174"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/funniest_outdoor"),
  DATABASE_SSL: z
    .string()
    .default("false")
    .transform((v) => v.toLowerCase() === "true"),
  JWT_SECRET: z
    .string()
    .min(16)
    .default("funniest-outdoor-dev-secret-change-in-production-32chars"),
  SESSION_COOKIE_NAME: z.string().default("fo_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@funniestoutdoor.id"),
  SEED_ADMIN_PASSWORD: z.string().min(10).default("AdminFunniest2026!"),
  SEED_CASHIER_EMAIL: z.string().email().default("kasir@funniestoutdoor.id"),
  SEED_CASHIER_PASSWORD: z.string().min(10).default("KasirFunniest2026!"),
  AI_SERVICE_URL: z.string().optional().default(""),
  AI_TIMEOUT_MS: z.coerce.number().int().min(100).max(10000).default(1000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Konfigurasi environment tidak valid:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  AI_SERVICE_URL: parsed.data.AI_SERVICE_URL.replace(/\/+$/, ""),
};
