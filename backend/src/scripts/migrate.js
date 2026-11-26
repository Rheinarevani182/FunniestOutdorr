import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../../db/schema.sql");

async function migrate() {
  const sql = await fs.readFile(schemaPath, "utf8");
  const client = await pool.connect();
  try {
    console.log("Menjalankan migrasi PostgreSQL dari db/schema.sql...");
    await client.query(sql);

    const extRes = await client.query(
      "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'vector', 'pgcrypto')",
    );
    const activeExts = extRes.rows.map((r) => r.extname);
    console.log("Migrasi selesai. Ekstensi aktif:", activeExts.join(", ") || "(standar)");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migrasi gagal:", err.message);
  process.exit(1);
});
