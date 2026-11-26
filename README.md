# Funniest Outdoor — Platform Reservasi, POS Kasir & Rekomendasi Gear Cerdas

> **Status:** 🚧 *Work in Progress (MVP Development)* — Asah 2026 Capstone Project  
> **ID Tim:** `A26-CS144` (Nexa 404)  
> **Mitra UMKM:** Funniest Outdoor (Jasa Sewa Peralatan Pendakian Gunung, Surabaya Utara)

Platform web terpadu (*standalone MVP*) untuk membantu operasional penyewaan perlengkapan pendakian gunung di **Funniest Outdoor** dengan validasi stok berbasis rentang tanggal (*schedule-aware booking*), panel kasir cepat (*In-Store POS*) yang stabil untuk transaksi banyak barang, pencarian katalog semantik (*Semantic Search*), rekomendasi paket perlengkapan pelengkap (*Gear Bundling*), serta dasbor analisis bisnis *real-time*.

---

## Fitur Utama

### 1. Portal Pelanggan (Web Publik)
* **Pemilih Rentang Tanggal Dinamis (*Schedule-Aware*):** Mengecek ketersediaan unit berdasarkan irisan jadwal tanpa mengunci stok di tanggal lain.
* **Katalog, Paket Hemat & Kalkulator Tarif Bertingkat:** Perhitungan otomatis berdasarkan durasi sewa dan kelengkapan isi paket.
* **Pencarian Cerdas (*Semantic Search*):** Mendukung pencarian bahasa natural (terintegrasi dengan AI Service + *fallback* `pg_trgm`/keyword anti-*typo*).
* **Rekomendasi Perlengkapan Pelengkap (*Gear Bundling*):** Menyarankan alat komplementer pada keranjang sewa.
* **Reservasi & Nota Digital:** Pelanggan dapat melacak status DP/sewa dan membuka struk digital ringkas via tautan web.

### 2. Panel Staf & Kasir (*In-Store POS*)
* **Dynamic Order Editor:** Menambah/mengubah item (10+ barang) dan mengubah durasi sewa secara instan tanpa hapus-ulang transaksi.
* **Alur Operasional Lengkap:** Pencatatan DP/pelunasan manual (transfer/tunai), konfirmasi *keep* stok, serah terima + jaminan KTP/SIM, pengembalian alat & perhitungan biaya keterlambatan otomatis, hingga kirim nota via WhatsApp.

### 3. Dasbor Pemilik Usaha (Admin)
* **Analisis Bisnis *Real-Time*:** Ringkasan pendapatan sewa, pesanan aktif, penyewa belum kembali, tren 7 hari terakhir, produk terlaris, dan ekspor CSV.
* **Manajemen Inventaris & Pengaturan Toko:** Kelola produk, varian stok, tarif bertingkat, rekening DP, dan akun staf kasir.

---

## Arsitektur & Tech Stack

```text
[Frontend: React 19 + Vite 6]
             │  HTTP /api/*
             ▼
[Core Backend: Node.js + Express v5 + Zod]  ◄── Auth, POS, Schedule-Aware Booking, Nota, Analytics
      │                       │
      │ SQL (pg)              │ HTTP (timeout 1s + fallback otomatis)
      ▼                       ▼
[PostgreSQL + pgvector] ◄── [AI Service: Python + FastAPI] (In Progress)
                              • POST /search     (Semantic Search - Embedding + pgvector)
                              • POST /recommend  (Gear Bundling - Co-occurrence / Two-Tower)
```

| Layer | Teknologi |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Lucide React, Custom CSS |
| **Core Backend** | Node.js (ESM), Express v5, Zod, `bcryptjs`, `jsonwebtoken`, `helmet` |
| **Database** | PostgreSQL 14+ (`pg`), `pgvector` (opsional/cloud), `pg_trgm` |
| **AI Service *(Planned/WIP)*** | Python, FastAPI, Embedding Model (IndoBERT / MiniLM / Multilingual E5), Recommender Model |

---

## Struktur Repositori

```text
FunniestOutdoor/
├── frontend/               # Aplikasi SPA pelanggan & panel POS/Admin (React + Vite)
│   ├── public/assets/      # Aset gambar & font lokal
│   ├── src/                # Komponen UI (main.jsx, core.jsx, public.jsx, admin.jsx, style.css)
│   └── vite.config.js      # Dev server port 5174 + proxy /api -> 127.0.0.1:5173
├── backend/                # Core Backend API & AI Gateway (Express v5 + PostgreSQL)
│   ├── db/schema.sql       # Skema relasional PostgreSQL (+ pgvector & pg_trgm ready)
│   ├── src/
│   │   ├── config/         # Validasi env & PostgreSQL pool
│   │   ├── middleware/     # Auth JWT cookie, Zod validator, error handler
│   │   ├── routes/         # auth, catalog, bookings, ai, admin, health/openapi
│   │   ├── services/       # availability (sweep-line), pricing, bookings, aiGateway
│   │   └── scripts/        # migrate.js & seed.js
│   └── tests/              # Unit test core logic (node --test)
└── README.md
```

---

## Cara Menjalankan Secara Lokal

### Prasyarat
* **Node.js** `>= 20.x` (disarankan v22/v24)
* **PostgreSQL** `>= 14` (lokal atau *managed* seperti Supabase / Neon)

### 1. Setup Database & Backend
```powershell
cd backend
npm install
copy .env.example .env
```
Edit `backend/.env` dan sesuaikan `DATABASE_URL` dengan kredensial PostgreSQL Anda (pastikan database `funniest_outdoor` sudah dibuat):
```powershell
psql -U postgres -c "CREATE DATABASE funniest_outdoor;"
```
Jalankan migrasi skema dan seed data awal:
```powershell
npm run db:setup
npm run dev
```
Backend akan berjalan di `http://127.0.0.1:5173`.
* Health check: `http://127.0.0.1:5173/api/health`
* OpenAPI spec: `http://127.0.0.1:5173/api/openapi.json`

### 2. Jalankan Frontend
Buka terminal baru:
```powershell
cd frontend
npm install
npm run dev
```
Buka aplikasi di `http://localhost:5174`.

### Akun Uji Bawaan (Hasil `db:seed`)
| Peran | Email | Kata Sandi |
| :--- | :--- | :--- |
| **Admin (Owner)** | `admin@funniestoutdoor.id` | `AdminFunniest2026!` |
| **Kasir (POS)** | `kasir@funniestoutdoor.id` | `KasirFunniest2026!` |

### Menjalankan Unit Test Backend
```powershell
cd backend
npm test
```

---

## Kontrak Integrasi AI Service (FastAPI)

Untuk menghubungkan layanan AI Python, isi `AI_SERVICE_URL` di `backend/.env` (contoh: `http://127.0.0.1:8000`). Jika kosong atau tidak merespons dalam `1000 ms`, Core Backend otomatis beralih ke *fallback* PostgreSQL.

* **`POST /search`**
  * Request: `{ "query": "tenda tahan badai kapasitas 4 orang" }`
  * Response: `{ "ids": ["tenda-dome-4p"], "mode": "semantic", "suggestions": [] }`
* **`POST /recommend`**
  * Request: `{ "item_ids": ["tenda-dome-4p"], "top_k": 4 }`
  * Response: `{ "ids": ["matras-foil", "flysheet-3x4", "sleeping-bag"], "mode": "ml-recommender" }`

---

## Evaluasi Model AI *(Akan Dilengkapi pada Minggu 3–4)*

* **Sistem Rekomendasi (*Gear Bundling*):** Perbandingan metrik `NDCG@K` & `Recall@K` terhadap *baseline* popularitas *(TBD)*.
* **Pencarian Semantik (*Semantic Search*):** Perbandingan metrik `Hit@K` & `MRR` terhadap *baseline* pencarian kata kunci *(TBD)*.

---

## Tim Pengembang (`A26-CS144` — Nexa 404)

| ID Peserta | Nama | Learning Path |
| :--- | :--- | :--- |
| `FS284B6X1556` | Rheina Revani | AI Full Stack Developer |
| `FS284B6Y1056` | Muhamad Affan Malakaini | AI Full Stack Developer |
| `DS284B6Y0982` | Michal Rivaldo Fresca Kurniawan | Data Science Specialist |
| `DS284B6Y1532` | Reihan Alvarizy | Data Science Specialist |
| `AE284B6Y0776` | Ihza Budi Cendhika | Next-Gen AI Engineer |
| `AE284B6Y1073` | Muhammad Safa al-Kahfi | Next-Gen AI Engineer |
