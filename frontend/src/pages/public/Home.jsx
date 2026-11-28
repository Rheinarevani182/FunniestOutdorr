import React, { useState } from "react";
import { CalendarDays, CheckCircle2, Tent } from "lucide-react";
import { Dates } from "../../components/booking";
import { RentalGuide } from "../../components/common";
import { Categories, ProductCard, SearchBox } from "../../components/product";
import { Link } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { go, money } from "../../utils";

export function Home() {
  const { items, settings, bundles } = useApp(),
    [q, setQ] = useState("");
  return (
    <>
      <section className="hero">
        <img
          src="/assets/hero.jpg"
          alt="Perkemahan di pegunungan hijau"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="container hero-copy">
          <p className="eyebrow">
            FUNNIEST OUTDOOR · SIAP MENEMANI PERJALANANMU
          </p>
          <h1>
            Petualangan dimulai dari
            <br />
            perlengkapan yang tepat.
          </h1>
          <div className="accent" />
          <p>
            Sewa perlengkapan pendakian yang lengkap, terawat, dan siap dipakai
            untuk mendukung rencana petualanganmu.
          </p>
        </div>
      </section>
      <div className="container home-controls">
        <Dates />
        <SearchBox
          value={q}
          onChange={setQ}
          onSearch={() => go("/katalog?q=" + encodeURIComponent(q))}
        />
      </div>
      <div className="container home-content">
        <Categories
          value="Semua"
          onChange={(c) => go("/katalog?category=" + encodeURIComponent(c))}
        />
        <div className="section-heading">
          <div>
            <h2>Perlengkapan Pilihan</h2>
            <p>Teman perjalanan yang siap menemani langkahmu.</p>
          </div>
          <Link to="/katalog" className="text-button">
            Lihat semua perlengkapan
          </Link>
        </div>
        <div className="product-grid">
          {items.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="bundle-banner">
          <Tent size={88} strokeWidth={1} />
          <div>
            <span className="eyebrow">LEBIH PRAKTIS, LEBIH HEMAT</span>
            <h2>Paket Hemat</h2>
            <p>Perlengkapan saling melengkapi untuk cerita yang lebih seru.</p>
          </div>
          <div>
            <small>Mulai dari / hari</small>
            <strong>
              {money(
                Math.min(
                  ...bundles.map(
                    (b) =>
                      b.recipe.reduce(
                        (s, r) =>
                          s +
                          (items.find((p) =>
                            p.variants.some((v) => v.id === r.variant_id),
                          )?.price || 0) *
                            r.quantity,
                        0,
                      ) - b.discount_per_day,
                  ),
                ),
              )}
            </strong>
          </div>
          <Link className="btn" to="/paket">
            Lihat Paket
          </Link>
        </div>
        <div className="benefits">
          {[
            [
              CalendarDays,
              "Pilih tanggal & alat",
              "Lihat perlengkapan yang tersedia untuk jadwalmu.",
            ],
            [
              CheckCircle2,
              "Reservasi atau tanya admin",
              "Tanya lewat WhatsApp, atau masuk dan bayar DP 50% agar alat di-keep.",
            ],
            [
              Tent,
              "Ambil & mulai perjalanan",
              "Lunasi sisa sewa, serahkan KTP/SIM, lalu ambil alat. Kembalikan tepat waktu untuk mengambil jaminan.",
            ],
          ].map(([I, t, d]) => (
            <div key={t}>
              <I size={28} />
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <p className="sample-note">
          Rencanakan perjalanan dengan tenang. Pilih alatmu, pastikan jadwalnya,
          dan amankan dengan DP 50%.
        </p>
        <RentalGuide />
      </div>
    </>
  );
}