import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../config/db.js";
import { env } from "../config/env.js";

const DEFAULT_ITEMS = [
  {
    id: "tenda-dome-4p",
    name: "Tenda Dome 4P Double Layer",
    category: "Tenda",
    price: 45000,
    image: 3,
    description:
      "Tenda dome double layer kapasitas 4 orang dengan frame alloy kokoh dan flysheet waterproof PU3000mm. Cocok untuk pendakian gunung berangin dan hujan.",
    tags: "tenda dome 4 orang 4p tahan badai waterproof double layer camping gunung",
    variants: [
      { id: "var-tenda-4p-std", label: "Kapasitas 4P", stock: 6, maintenance: 0 },
    ],
  },
  {
    id: "tenda-dome-2p",
    name: "Tenda Dome 2P Ultralight",
    category: "Tenda",
    price: 35000,
    image: 3,
    description:
      "Tenda ringan double layer untuk 2 orang dengan ventilasi baik dan pemasangan cepat. Ideal untuk pendaki ringkas maupun pasangan.",
    tags: "tenda dome 2 orang 2p ultralight ringan double layer waterproof",
    variants: [
      { id: "var-tenda-2p-std", label: "Kapasitas 2P", stock: 8, maintenance: 0 },
    ],
  },
  {
    id: "carrier-60l",
    name: "Carrier Gunung 60L + Raincover",
    category: "Carrier",
    price: 30000,
    image: 1,
    description:
      "Tas gunung berkapasitas 60 liter dengan backsystem ergonomis dan rangka aluminium. Sudah termasuk raincover tahan hujan.",
    tags: "carrier keril tas gunung 60l 60 liter backsystem raincover pendakian",
    variants: [
      { id: "var-carrier-45l", label: "45L", stock: 5, maintenance: 0 },
      { id: "var-carrier-60l", label: "60L", stock: 8, maintenance: 0 },
    ],
  },
  {
    id: "sepatu-hiking",
    name: "Sepatu Hiking Waterproof Mid-Cut",
    category: "Sepatu",
    price: 35000,
    image: 0,
    description:
      "Sepatu trekking mid-cut dengan sol grip anti-slip untuk jalur tanah basah dan berbatu. Nyaman menopang pergelangan kaki.",
    tags: "sepatu gunung hiking trekking waterproof anti slip outdoor",
    variants: [
      { id: "var-sepatu-40", label: "Ukuran 40", stock: 4, maintenance: 0 },
      { id: "var-sepatu-41", label: "Ukuran 41", stock: 5, maintenance: 0 },
      { id: "var-sepatu-42", label: "Ukuran 42", stock: 6, maintenance: 0 },
      { id: "var-sepatu-43", label: "Ukuran 43", stock: 4, maintenance: 0 },
    ],
  },
  {
    id: "kursi-lipat",
    name: "Kursi Lipat Camping Portable",
    category: "Kursi",
    price: 15000,
    image: 2,
    description:
      "Kursi lipat ringan berbahan rangka besi/alloy kuat dengan tas jinjing. Praktis untuk bersantai di camp ground dan pantai.",
    tags: "kursi lipat camping santai portable ringan outdoor",
    variants: [
      { id: "var-kursi-std", label: "Standar", stock: 12, maintenance: 0 },
    ],
  },
  {
    id: "matras-foil",
    name: "Matras Aluminium Foil / Spons",
    category: "Perlengkapan",
    price: 8000,
    image: 4,
    description:
      "Alas tidur pelindung dingin dari permukaan tanah yang lembap. Ringan digulung dan mudah diikat di luar carrier.",
    tags: "matras alas tidur foil spons anti dingin tenda",
    variants: [
      { id: "var-matras-std", label: "Standar", stock: 20, maintenance: 0 },
    ],
  },
  {
    id: "sleeping-bag",
    name: "Sleeping Bag Polar Hangat",
    category: "Perlengkapan",
    price: 15000,
    image: 5,
    description:
      "Kantung tidur berlapis polar tebal yang nyaman untuk suhu dingin pegunungan hingga 5 derajat Celcius.",
    tags: "sleeping bag sb kantung tidur polar hangat dingin gunung",
    variants: [
      { id: "var-sb-std", label: "Standar", stock: 16, maintenance: 0 },
    ],
  },
  {
    id: "kompor-portable",
    name: "Kompor Portable Windproof",
    category: "Perlengkapan",
    price: 15000,
    image: 6,
    description:
      "Kompor lipat anti-angin (bunga/kotak) yang hemat gas dan stabil untuk memasak air maupun makanan di puncak gunung.",
    tags: "kompor portable windproof masak gunung gas hi-cook",
    variants: [
      { id: "var-kompor-std", label: "Standar", stock: 10, maintenance: 0 },
    ],
  },
  {
    id: "nesting-cookset",
    name: "Cookset Nesting DS-300",
    category: "Perlengkapan",
    price: 15000,
    image: 7,
    description:
      "Set peralatan masak lengkap anti-lengket berisi panci, teflon, teko, dan sendok lipat untuk 2–4 orang.",
    tags: "cookset nesting panci masak teko camping gunung",
    variants: [
      { id: "var-cookset-std", label: "Set 2-4 Orang", stock: 10, maintenance: 0 },
    ],
  },
  {
    id: "headlamp-led",
    name: "Headlamp LED Rechargeable",
    category: "Perlengkapan",
    price: 10000,
    image: 8,
    description:
      "Senter kepala LED terang dengan mode sorot jauh dan redup untuk summit attack maupun aktivitas malam di tenda.",
    tags: "headlamp senter kepala lampu led summit malam",
    variants: [
      { id: "var-headlamp-std", label: "Standar", stock: 15, maintenance: 0 },
    ],
  },
  {
    id: "trekking-pole",
    name: "Trekking Pole Aluminium (Sepasang)",
    category: "Perlengkapan",
    price: 15000,
    image: 9,
    description:
      "Tongkat pendakian anti-shock membantu menjaga keseimbangan dan mengurangi beban lutut saat menanjak atau menurun.",
    tags: "trekking pole tongkat gunung pendakian lutut",
    variants: [
      { id: "var-tpole-std", label: "Sepasang (2 pcs)", stock: 10, maintenance: 0 },
    ],
  },
  {
    id: "flysheet-3x4",
    name: "Flysheet Waterproof 3x4m + Tali",
    category: "Perlengkapan",
    price: 15000,
    image: 10,
    description:
      "Tarp pelindung hujan dan panas serbaguna untuk teras tenda atau shelter darurat di jalur pendakian.",
    tags: "flysheet tarp pelindung hujan teras tenda shelter",
    variants: [
      { id: "var-flysheet-3x4", label: "3x4 Meter", stock: 8, maintenance: 0 },
    ],
  },
];

// Bundle IDs deliberately match frontend dropdown options ("camping4", "hiker", "rest")
const DEFAULT_BUNDLES = [
  {
    id: "camping4",
    name: "Camping Bareng 4 Orang",
    description:
      "Paket lengkap untuk rombongan 4 orang: tenda double layer, alas tidur, kompor, dan peralatan masak siap pakai.",
    image: 3,
    discount_per_day: 16000,
    recipe: [
      { variant_id: "var-tenda-4p-std", quantity: 1 },
      { variant_id: "var-matras-std", quantity: 4 },
      { variant_id: "var-kompor-std", quantity: 1 },
      { variant_id: "var-cookset-std", quantity: 1 },
    ],
  },
  {
    id: "hiker",
    name: "Pendaki Ringkas",
    description:
      "Paket solo hiker siap summit: carrier 60L, sleeping bag hangat, matras, dan headlamp LED.",
    image: 1,
    discount_per_day: 10000,
    recipe: [
      { variant_id: "var-carrier-60l", quantity: 1 },
      { variant_id: "var-sb-std", quantity: 1 },
      { variant_id: "var-matras-std", quantity: 1 },
      { variant_id: "var-headlamp-std", quantity: 1 },
    ],
  },
  {
    id: "rest",
    name: "Istirahat di Alam",
    description:
      "Paket camping santai untuk 2 orang: tenda 2P, dua kursi lipat, flysheet, dan kompor portable.",
    image: 2,
    discount_per_day: 12000,
    recipe: [
      { variant_id: "var-tenda-2p-std", quantity: 1 },
      { variant_id: "var-kursi-std", quantity: 2 },
      { variant_id: "var-flysheet-3x4", quantity: 1 },
      { variant_id: "var-kompor-std", quantity: 1 },
    ],
  },
];

async function seed() {
  await withTransaction(async (client) => {
    // 1. Store settings singleton
    await client.query(`
      INSERT INTO store_settings (
        id, name, phone, address, hours, bank_name, bank_holder, late_daily, tiers, terms
      ) VALUES (
        1,
        'Funniest.Outdoor',
        '6281234567890',
        'Surabaya Utara, Jawa Timur',
        'Setiap hari · 08.00 – 21.00 WIB',
        'BCA',
        'Funniest Outdoor',
        0,
        '[{"min_days":1,"factor":1},{"min_days":3,"factor":0.9},{"min_days":5,"factor":0.85}]'::jsonb,
        'Alat diperiksa bersama saat pengambilan dan pengembalian. Tanpa deposit uang; jaminan KTP/SIM asli diserahkan saat pengambilan.'
      )
      ON CONFLICT (id) DO NOTHING
    `);

    // 2. Default staff accounts (admin & cashier)
    const adminHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10);
    const cashierHash = await bcrypt.hash(env.SEED_CASHIER_PASSWORD, 10);

    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ["usr-admin-1", "Ismail (Owner)", env.SEED_ADMIN_EMAIL.toLowerCase(), adminHash],
    );

    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'cashier')
       ON CONFLICT (email) DO NOTHING`,
      ["usr-cashier-1", "Kasir Toko", env.SEED_CASHIER_EMAIL.toLowerCase(), cashierHash],
    );

    // 3. Catalog items & variants
    for (const item of DEFAULT_ITEMS) {
      await client.query(
        `INSERT INTO items (id, name, category, price, image, photo_url, description, tags, active)
         VALUES ($1, $2, $3, $4, $5, '', $6, $7, TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.name, item.category, item.price, item.image, item.description, item.tags],
      );

      for (const v of item.variants) {
        await client.query(
          `INSERT INTO item_variants (id, item_id, label, stock, maintenance)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [v.id, item.id, v.label, v.stock, v.maintenance],
        );
      }
    }

    // 4. Bundles
    for (const b of DEFAULT_BUNDLES) {
      await client.query(
        `INSERT INTO bundles (id, name, description, category, image, discount_per_day, active)
         VALUES ($1, $2, $3, 'Paket', $4, $5, TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [b.id, b.name, b.description, b.image, b.discount_per_day],
      );

      for (const r of b.recipe) {
        await client.query(
          `INSERT INTO bundle_items (bundle_id, variant_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (bundle_id, variant_id) DO NOTHING`,
          [b.id, r.variant_id, r.quantity],
        );
      }
    }
  });

  console.log("Seed data Funniest Outdoor berhasil!");
  console.log(`  Admin   : ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`);
  console.log(`  Kasir   : ${env.SEED_CASHIER_EMAIL} / ${env.SEED_CASHIER_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed gagal:", err.message);
  process.exit(1);
});
