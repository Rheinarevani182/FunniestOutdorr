-- ============================================================================
-- Funniest Outdoor - PostgreSQL Schema (Relational + Optional pgvector/pg_trgm)
-- Compatible with PostgreSQL 14+ (Local, Supabase, Neon)
-- ============================================================================

-- 1. Optional extensions (gracefully skipped if unavailable on local machine)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extension pgcrypto tidak tersedia: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extension pg_trgm tidak tersedia (fallback ILIKE tetap aktif): %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extension pgvector belum terpasang (kolom embedding dilewati hingga pgvector aktif): %', SQLERRM;
END $$;

-- ============================================================================
-- 2. Users (admin, cashier, customer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'cashier', 'customer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- ============================================================================
-- 3. Store Settings (singleton id = 1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name         TEXT NOT NULL DEFAULT 'Funniest.Outdoor',
  phone        TEXT NOT NULL DEFAULT '6281234567890',
  address      TEXT NOT NULL DEFAULT 'Surabaya Utara, Jawa Timur',
  hours        TEXT NOT NULL DEFAULT 'Setiap hari · 08.00 – 21.00 WIB',
  instagram    TEXT NOT NULL DEFAULT '',
  tiktok       TEXT NOT NULL DEFAULT '',
  maps         TEXT NOT NULL DEFAULT '',
  bank_name    TEXT NOT NULL DEFAULT 'BCA',
  bank_account TEXT NOT NULL DEFAULT '',
  bank_holder  TEXT NOT NULL DEFAULT 'Funniest Outdoor',
  late_daily   INTEGER NOT NULL DEFAULT 0 CHECK (late_daily >= 0),
  tiers        JSONB NOT NULL DEFAULT '[{"min_days":1,"factor":1},{"min_days":3,"factor":0.9},{"min_days":5,"factor":0.85}]'::jsonb,
  terms        TEXT NOT NULL DEFAULT 'Alat wajib dijaga kebersihan dan kelengkapannya. Kerusakan atau kehilangan menjadi tanggung jawab penyewa sesuai kesepakatan.',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. Catalog Items & Variants
-- ============================================================================
CREATE TABLE IF NOT EXISTS items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('Tenda', 'Carrier', 'Sepatu', 'Kursi', 'Perlengkapan')),
  price       INTEGER NOT NULL CHECK (price >= 0),
  image       INTEGER NOT NULL DEFAULT 4 CHECK (image >= 0 AND image <= 11),
  photo_url   TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tags        TEXT NOT NULL DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_active ON items (active);

-- Attach pgvector column + HNSW index automatically when pgvector is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE items ADD COLUMN IF NOT EXISTS embedding vector(384);
    CREATE INDEX IF NOT EXISTS idx_items_embedding_hnsw
      ON items USING hnsw (embedding vector_cosine_ops);
  END IF;
END $$;

-- Attach pg_trgm GIN index for typo-tolerant fallback search when pg_trgm is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_items_search_trgm
      ON items USING gin ((name || ' ' || category || ' ' || tags || ' ' || description) gin_trgm_ops);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS item_variants (
  id          TEXT PRIMARY KEY,
  item_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  maintenance INTEGER NOT NULL DEFAULT 0 CHECK (maintenance >= 0 AND maintenance <= stock),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_variants_item_id ON item_variants (item_id);

-- ============================================================================
-- 5. Rental Bundles (Paket Hemat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bundles (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL DEFAULT 'Paket',
  image            INTEGER NOT NULL DEFAULT 3,
  photo_url        TEXT NOT NULL DEFAULT '',
  discount_per_day INTEGER NOT NULL DEFAULT 0 CHECK (discount_per_day >= 0),
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  bundle_id  TEXT NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES item_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  PRIMARY KEY (bundle_id, variant_id)
);

-- ============================================================================
-- 6. Bookings (Schedule-Aware Reservations & POS Transactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id                  TEXT PRIMARY KEY,
  code                TEXT NOT NULL UNIQUE,
  token               TEXT NOT NULL UNIQUE,
  user_id             TEXT REFERENCES users(id) ON DELETE SET NULL,
  source              TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'pos')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rented', 'returned', 'cancelled')),
  customer_name       TEXT NOT NULL,
  phone               TEXT NOT NULL,
  address             TEXT NOT NULL DEFAULT '',
  identity_type       TEXT NOT NULL DEFAULT 'KTP' CHECK (identity_type IN ('KTP', 'SIM')),
  note                TEXT NOT NULL DEFAULT '',
  bundle_id           TEXT REFERENCES bundles(id) ON DELETE SET NULL,
  start_at            TIMESTAMPTZ NOT NULL,
  end_at              TIMESTAMPTZ NOT NULL,
  days                INTEGER NOT NULL CHECK (days >= 1),
  subtotal            INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount            INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  rental              INTEGER NOT NULL DEFAULT 0 CHECK (rental >= 0),
  total               INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid                INTEGER NOT NULL DEFAULT 0 CHECK (paid >= 0),
  collateral_received BOOLEAN NOT NULL DEFAULT FALSE,
  return_details      JSONB,
  returned_at         TIMESTAMPTZ,
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_booking_dates CHECK (end_at > start_at)
);

-- Core index for fast schedule-aware overlap queries
CREATE INDEX IF NOT EXISTS idx_bookings_schedule
  ON bookings (status, start_at, end_at)
  WHERE status IN ('confirmed', 'rented');

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings (token);

CREATE TABLE IF NOT EXISTS booking_items (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  item_id    TEXT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  variant_id TEXT NOT NULL REFERENCES item_variants(id) ON DELETE RESTRICT,
  name       TEXT NOT NULL,
  label      TEXT NOT NULL,
  image      INTEGER NOT NULL DEFAULT 4,
  photo_url  TEXT NOT NULL DEFAULT '',
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity   INTEGER NOT NULL CHECK (quantity >= 1),
  amount     INTEGER NOT NULL CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON booking_items (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_variant_id ON booking_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_item_id ON booking_items (item_id);

-- ============================================================================
-- 7. Payments & Activity Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL CHECK (amount > 0),
  method     TEXT NOT NULL CHECK (method IN ('transfer', 'cash')),
  recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);

CREATE TABLE IF NOT EXISTS booking_logs (
  id         BIGSERIAL PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  actor      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON booking_logs (booking_id, created_at DESC);
