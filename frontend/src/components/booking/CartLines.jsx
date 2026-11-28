import React from "react";
import { Minus, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { money } from "../../utils";
import { Photo } from "../product";

export function CartLines({ lines, setLines }) {
  const { items } = useApp();
  const change = (id, n) =>
    setLines(
      lines
        .map((x) => (x.variant_id === id ? { ...x, quantity: n } : x))
        .filter((x) => x.quantity > 0),
    );
  return (
    <div className="cart-lines">
      {lines.map((l) => {
        const p = items.find((p) =>
            p.variants.some((v) => v.id === l.variant_id),
          ),
          v = p?.variants.find((v) => v.id === l.variant_id);
        return (
          <div className="cart-line" key={l.variant_id}>
            <Photo product={p} />
            <div className="cart-info">
              <strong>{p?.name || "Produk tidak tersedia"}</strong>
              <small>
                {v?.label} · {money(p?.price)} / hari
              </small>
              <button
                type="button"
                className="text-button danger"
                onClick={() => change(l.variant_id, 0)}
              >
                Hapus
              </button>
            </div>
            <div className="quantity">
              <button
                type="button"
                aria-label={"Kurangi " + p?.name}
                onClick={() => change(l.variant_id, l.quantity - 1)}
              >
                <Minus size={15} />
              </button>
              <input
                aria-label={"Jumlah " + p?.name}
                type="number"
                min="1"
                max="100"
                value={l.quantity}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 1 && n <= 100) change(l.variant_id, n);
                }}
              />
              <button
                type="button"
                aria-label={"Tambah " + p?.name}
                onClick={() =>
                  change(l.variant_id, Math.min(100, l.quantity + 1))
                }
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}