import React from "react";
import { CartLines, Dates, Summary } from "../../components/booking";
import { Recommendations } from "../../components/product";
import { Button, Empty, Field, Link, Panel, Title } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useQuote } from "../../hooks";
import { go } from "../../utils";

export function Cart() {
  const { cart, setCart, dates, bundle, setBundle, user } = useApp(),
    { quote, error, loading } = useQuote(cart, bundle, dates);
  if (!cart.length)
    return (
      <div className="container page">
        <Empty
          title="Keranjangmu masih kosong"
          description="Mulai dari perlengkapan yang menemani perjalananmu."
        >
          <Link className="btn" to="/katalog">
            Jelajahi Katalog
          </Link>
        </Empty>
      </div>
    );
  return (
    <div className="container page">
      <div className="steps">
        <strong>1 Keranjang</strong>
        <span>2 Data Reservasi</span>
        <span>3 Konfirmasi</span>
      </div>
      <Title
        title="Siapkan perjalananmu"
        description="Periksa perlengkapan dan jadwal sebelum reservasi."
      />
      <div className="checkout-grid">
        <div>
          <Dates compact />
          <Panel
            title="Perlengkapan dipilih"
            action={
              <Link className="text-button" to="/katalog">
                Tambah alat
              </Link>
            }
          >
            <CartLines lines={cart} setLines={setCart} />
            <Field label="Paket yang diterapkan">
              <select
                value={bundle}
                onChange={(e) => setBundle(e.target.value)}
              >
                <option value="">Tanpa paket</option>
                <option value="camping4">Camping Bareng 4 Orang</option>
                <option value="hiker">Pendaki Ringkas</option>
                <option value="rest">Istirahat di Alam</option>
              </select>
            </Field>
          </Panel>
        </div>
        <Summary quote={quote} loading={loading}>
          {error ? <p className="error">{error}</p> : null}
          <Button
            className="full"
            disabled={!quote || loading}
            onClick={() => go(user ? "/reservasi" : "/masuk?next=/reservasi")}
          >
            Reservasi · DP 50%
          </Button>
          <Button variant="outline full" onClick={() => go("/tanya-admin")}>
            Tanya Admin via WhatsApp
          </Button>
          <p className="muted">
            Bertanya belum menahan stok. Prioritas untuk DP yang lebih dahulu
            terverifikasi.
          </p>
        </Summary>
      </div>
      <Recommendations lines={cart} />
    </div>
  );
}