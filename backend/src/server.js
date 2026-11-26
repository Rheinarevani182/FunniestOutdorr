import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Funniest Outdoor Core Backend berjalan di http://127.0.0.1:${env.PORT}`);
  console.log(`  Health check : http://127.0.0.1:${env.PORT}/api/health`);
  console.log(`  OpenAPI spec : http://127.0.0.1:${env.PORT}/api/openapi.json`);
  console.log(
    `  AI Gateway   : ${env.AI_SERVICE_URL || "Mode fallback PostgreSQL (AI_SERVICE_URL kosong)"}`,
  );
});

async function shutdown(signal) {
  console.log(`\nMenerima ${signal}, menutup server dengan aman...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
