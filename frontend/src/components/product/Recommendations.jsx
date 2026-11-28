import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { ProductCard } from "./ProductCard";

export function Recommendations({ lines }) {
  const { items } = useApp(),
    ids = [
      ...new Set(
        lines
          .map(
            (l) =>
              items.find((p) => p.variants.some((v) => v.id === l.variant_id))
                ?.id,
          )
          .filter(Boolean),
      ),
    ],
    key = ids.join(","),
    [rec, setRec] = useState([]);
  useEffect(() => {
    let alive = true;
    api("/recommend", { item_ids: ids })
      .then((r) => alive && setRec(r.ids))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return rec.length ? (
    <section className="recommendations">
      <h2>Lengkapi perjalananmu</h2>
      <p className="muted">Perlengkapan yang bisa melengkapi pilihanmu.</p>
      <div className="product-grid">
        {rec.map((id) => {
          const p = items.find((p) => p.id === id);
          return p ? <ProductCard key={id} product={p} /> : null;
        })}
      </div>
    </section>
  ) : null;
}