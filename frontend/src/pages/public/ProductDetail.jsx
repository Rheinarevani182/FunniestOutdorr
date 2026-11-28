import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Dates } from "../../components/booking";
import { Photo } from "../../components/product";
import { Badge, Button, Empty, Field, Link, Panel } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { go, money } from "../../utils";

export function ProductDetail({ productId }) {
  const { items, availability, add, settings } = useApp(),
    [vid, setVid] = useState(""),
    [qty, setQty] = useState(1),
    p = items.find((p) => p.id === productId);
  if (!p) return <Empty title="Produk tidak ditemukan" />;
  const selected = vid || p.variants[0].id,
    v = availability.find((x) => x.id === selected);
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/katalog">Katalog</Link> / {p.name}
      </div>
      <div className="product-detail">
        <Photo product={p} />
        <div>
          <Badge status={v?.available === 0 ? "cancelled" : "available"}>
            {v?.available === 0 ? "Tidak tersedia" : "Tersedia untuk jadwalmu"}
          </Badge>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <div className="detail-price">
            {money(p.price)}
            <small> / hari / unit</small>
          </div>
          <h4>Pilih varian</h4>
          <div className="variants">
            {p.variants.map((v) => (
              <button
                type="button"
                key={v.id}
                className={v.id === selected ? "active" : ""}
                onClick={() => setVid(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="muted">
            {v ? v.available + " unit tersedia" : "Memeriksa stok…"}
          </p>
          <Dates compact />
          <Field
            label="Jumlah"
            type="number"
            min="1"
            max="100"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
          <Button
            className="full"
            disabled={
              !Number.isInteger(qty) ||
              qty < 1 ||
              qty > 100 ||
              (v && qty > v.available)
            }
            onClick={() => add(selected, qty)}
          >
            <Plus size={18} />
            Tambahkan ke Keranjang
          </Button>
          <Button
            variant="outline full"
            onClick={() =>
              go(
                "/tanya-admin?variant=" +
                  encodeURIComponent(selected) +
                  "&qty=" +
                  qty,
              )
            }
          >
            Tanya Admin via WhatsApp
          </Button>
          <p className="muted">Alat diperiksa sebelum dan sesudah disewa.</p>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Tarif bertingkat">
          {settings.tiers.map((t) => (
            <div className="pair" key={t.min_days}>
              <span>Mulai {t.min_days} hari</span>
              <strong>
                {Math.round(t.factor * 100)}% × harga harian × durasi
              </strong>
            </div>
          ))}
        </Panel>
        <Panel title="Ketentuan pemakaian">
          <p>{settings.terms}</p>
          <p className="muted">
            Tanpa deposit uang. Jaminan KTP/SIM diserahkan saat pengambilan.
          </p>
        </Panel>
      </div>
    </div>
  );
}