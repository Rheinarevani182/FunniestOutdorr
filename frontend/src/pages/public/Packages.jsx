import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Dates } from "../../components/booking";
import { Photo } from "../../components/product";
import { Badge, Button, Title } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { money } from "../../utils";

export function Packages() {
  const { bundles, items, addBundle } = useApp();
  return (
    <div className="container page">
      <Title
        title="Lebih praktis dengan Paket Hemat"
        description="Perlengkapan saling melengkapi, harga lebih hemat, cerita lebih seru."
      />
      <Dates />
      <div className="package-grid">
        {bundles.map((b) => {
          const price =
            b.recipe.reduce(
              (s, r) =>
                s +
                (items.find((p) =>
                  p.variants.some((v) => v.id === r.variant_id),
                )?.price || 0) *
                  r.quantity,
              0,
            ) - b.discount_per_day;
          return (
            <article className="package-card" key={b.id}>
              <Photo product={b} />
              <div className="product-body">
                <Badge status="available">Paket sewa</Badge>
                <h2>{b.name}</h2>
                <p>{b.description}</p>
                {b.recipe.map((r) => (
                  <p key={r.variant_id} className="row">
                    <CheckCircle2 size={15} />
                    {
                      items.find((p) =>
                        p.variants.some((v) => v.id === r.variant_id),
                      )?.name
                    }{" "}
                    × {r.quantity}
                  </p>
                ))}
                <hr />
                <h3 className="price">
                  {money(price)}
                  <small> / hari</small>
                </h3>
                <Button className="full" onClick={() => addBundle(b)}>
                  Pilih Paket
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}