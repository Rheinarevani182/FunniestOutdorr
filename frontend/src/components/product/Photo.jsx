import React from "react";
import {
  Armchair,
  Backpack,
  Flame,
  Footprints,
  Lightbulb,
  ShieldCheck,
  Tent,
  Utensils,
  Wind,
} from "lucide-react";

const icons = [
  Footprints,
  Backpack,
  Armchair,
  Tent,
  Wind,
  ShieldCheck,
  Flame,
  Utensils,
  Lightbulb,
  Footprints,
  Wind,
  ShieldCheck,
];

export function Photo({ product, className = "" }) {
  const i = Number(product?.image) || 0,
    I = icons[i] || Tent;
  return (
    <div className={"photo " + className}>
      {product?.photo_url ? (
        <img
          className="uploaded-photo"
          src={product.photo_url}
          alt={product.name}
          loading="lazy"
        />
      ) : i < 4 ? (
        <img
          src="/assets/gear.jpg"
          alt={product?.name || "Perlengkapan outdoor"}
          loading="lazy"
          style={{
            left: -(i % 2) * 100 + "%",
            top: -Math.floor(i / 2) * 100 + "%",
          }}
        />
      ) : (
        <div className="gear-icon">
          <I size={80} strokeWidth={1.1} />
          <span>{product?.category}</span>
        </div>
      )}
    </div>
  );
}