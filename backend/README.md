# Funniest Outdoor — Core Backend API

Core Backend REST API berbasis **Node.js + Express v5 + Zod + PostgreSQL (`pg`)** yang sekaligus berfungsi sebagai **AI Gateway** menuju FastAPI AI Service (dengan *timeout* 1 detik dan *graceful fallback* otomatis ke PostgreSQL).

## Fitur Utama
- **Schedule-Aware Availability (`GET /api/availability`)**: Validasi irisan jadwal berbasis *sweep-line peak concurrency* dengan row-level locking (`FOR UPDATE`) untuk mencegah *double-booking* tanpa mengunci jadwal masa depan.
- **Dynamic Order Editor & POS (`POST /api/bookings`, `PATCH /api/bookings/:id`)**: Stabil untuk 10+ item, kalkulasi tarif bertingkat otomatis, *optimistic locking* (`version`), catatan pembayaran DP/pelunasan, pengembalian alat, serta tautan nota digital publik (`/api/invoice/:token`).
- **AI Gateway + Automatic Fallback (`POST /api/search`, `POST /api/recommend`)**:
  - Jika `AI_SERVICE_URL` (FastAPI) diisi & responsif (< `AI_TIMEOUT_MS`), permintaan diteruskan ke layanan AI.
  - Jika belum diisi / timeout / error, otomatis *fallback* ke PostgreSQL (`pg_trgm` + `ILIKE` untuk pencarian *typo-tolerant*; *co-occurrence* + produk pelengkap populer untuk rekomendasi).
- **Skema PostgreSQL + `pgvector` Ready ([db/schema.sql](./db/schema.sql))**: Otomatis membuat kolom `items.embedding vector(384)` dan indeks HNSW saat ekstensi `pgvector` aktif (Supabase / Neon), namun tetap berjalan mulus di PostgreSQL lokal tanpa `pgvector`.

## Cara Menjalankan

1. **Salin konfigurasi environment:**
   ```bash
   cp .env.example .env
   ```
   Sesuaikan `DATABASE_URL` (PostgreSQL lokal, Supabase, atau Neon) dan `JWT_SECRET`.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan migrasi skema & seed data awal:**
   ```bash
   npm run db:setup
   ```
   Akun bawaan hasil seed (dapat diubah di `.env`):
   - Admin: `admin@funniestoutdoor.id` / `AdminFunniest2026!`
   - Kasir: `kasir@funniestoutdoor.id` / `KasirFunniest2026!`

4. **Jalankan server development:**
   ```bash
   npm run dev
   ```
   Server berjalan di `http://127.0.0.1:5173` (cocok langsung dengan proxy `/api` di `frontend/vite.config.js`).

5. **Jalankan unit test:**
   ```bash
   npm test
   ```

## Kontrak FastAPI AI Service (untuk Tim DS & GenAI)
Jika `AI_SERVICE_URL` diatur (mis. `http://127.0.0.1:8000`), Core Backend akan memanggil:
- `POST {AI_SERVICE_URL}/search`
  - Request: `{ "query": "tenda tahan badai 4 orang" }`
  - Response: `{ "ids": ["tenda-dome-4p", ...], "mode": "semantic", "suggestions": [] }`
- `POST {AI_SERVICE_URL}/recommend`
  - Request: `{ "item_ids": ["tenda-dome-4p"], "top_k": 4 }`
  - Response: `{ "ids": ["matras-foil", "flysheet-3x4", "sleeping-bag"], "mode": "ml-recommender" }`
