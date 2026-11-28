import { useEffect, useState } from "react";
import { defaultDates, go, stored } from "../utils";

export function useCart(notify) {
  const [cart, setCart] = useState(() => stored("fo-cart-v2", [])),
    [dates, setDates] = useState(() => stored("fo-dates-v2", defaultDates)),
    [bundle, setBundle] = useState(() => stored("fo-bundle-v2", ""));
  useEffect(() => {
    try {
      localStorage.setItem("fo-cart-v2", JSON.stringify(cart));
      localStorage.setItem("fo-dates-v2", JSON.stringify(dates));
      localStorage.setItem("fo-bundle-v2", JSON.stringify(bundle));
    } catch {}
  }, [cart, dates, bundle]);
  const add = (variant_id, quantity = 1) => {
    setCart((prev) =>
      prev.some((x) => x.variant_id === variant_id)
        ? prev.map((x) =>
            x.variant_id === variant_id
              ? { ...x, quantity: Math.min(100, x.quantity + quantity) }
              : x,
          )
        : [...prev, { variant_id, quantity }],
    );
    notify("Perlengkapan ditambahkan ke keranjang.");
  };
  const addBundle = (b) => {
    setCart((prev) => {
      const m = new Map(prev.map((x) => [x.variant_id, x.quantity]));
      for (const l of b.recipe)
        m.set(
          l.variant_id,
          Math.min(100, (m.get(l.variant_id) || 0) + l.quantity),
        );
      return [...m].map(([variant_id, quantity]) => ({ variant_id, quantity }));
    });
    setBundle(b.id);
    notify("Paket ditambahkan. Stok diperiksa sesuai jadwalmu.");
    go("/keranjang");
  };
  return { cart, setCart, dates, setDates, bundle, setBundle, add, addBundle };
}