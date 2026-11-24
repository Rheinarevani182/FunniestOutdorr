import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle2, X } from "lucide-react";
import {
  C,
  api,
  usePath,
  go,
  defaultDates,
  datePayload,
  Choose,
  Loading,
  Empty,
  Button,
} from "./core";
import {
  Shell,
  Home,
  Catalog,
  ProductDetail,
  Packages,
  Cart,
  Reservation,
  BookingStatus,
  About,
  Login,
  Invoice,
  CustomerAccount,
} from "./public";
import { Admin } from "./admin";
import "./style.css";
function stored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function App() {
  const path = usePath(),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [cart, setCart] = useState(() => stored("fo-cart-v2", [])),
    [dates, setDates] = useState(() => stored("fo-dates-v2", defaultDates)),
    [bundle, setBundle] = useState(() => stored("fo-bundle-v2", "")),
    [availability, setAvailability] = useState([]),
    [choose, setChoose] = useState(null);
  const notify = useCallback(setToast, []),
    reload = useCallback(async () => {
      try {
        setData(await api("/bootstrap"));
        setError("");
      } catch (e) {
        setError(e.message);
      }
    }, []);
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    try {
      localStorage.setItem("fo-cart-v2", JSON.stringify(cart));
      localStorage.setItem("fo-dates-v2", JSON.stringify(dates));
      localStorage.setItem("fo-bundle-v2", JSON.stringify(bundle));
    } catch {}
  }, [cart, dates, bundle]);
  useEffect(() => {
    let alive = true;
    api(
      "/availability?start=" +
        encodeURIComponent(datePayload(dates).start_at) +
        "&end=" +
        encodeURIComponent(datePayload(dates).end_at),
    )
      .then((r) => alive && setAvailability(r.variants))
      .catch(() => alive && setAvailability([]));
    return () => {
      alive = false;
    };
  }, [dates, data]);
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
  return (
    <C.Provider
      value={{
        ...data,
        path,
        reload,
        notify,
        cart,
        setCart,
        dates,
        setDates,
        bundle,
        setBundle,
        availability,
        add,
        choose: setChoose,
        addBundle,
      }}
    >
      {!data ? (
        error ? (
          <Empty title="Belum dapat terhubung" description={error}>
            <Button onClick={reload}>Coba Lagi</Button>
          </Empty>
        ) : (
          <Loading />
        )
      ) : path.startsWith("/admin") ? (
        <Admin />
      ) : path.startsWith("/nota/") ? (
        <Invoice token={path.split("/")[2]} />
      ) : path === "/masuk" ? (
        <Login />
      ) : (
        <Shell>
          {path === "/" ? (
            <Home />
          ) : path === "/katalog" ? (
            <Catalog />
          ) : path.startsWith("/produk/") ? (
            <ProductDetail key={path} productId={path.split("/")[2]} />
          ) : path === "/paket" ? (
            <Packages />
          ) : path === "/keranjang" ? (
            <Cart />
          ) : path === "/akun" ? (<CustomerAccount />
          ) : path === "/tanya-admin" ? (<Reservation inquiry />
          ) : path === "/reservasi" ? (
            <Reservation />
          ) : path.startsWith("/booking/") ? (
            <BookingStatus token={path.split("/")[2]} />
          ) : path === "/tentang" ? (
            <About />
          ) : (
            <Empty title="Halaman tidak ditemukan" />
          )}
        </Shell>
      )}
      {choose ? (
        <Choose product={choose} onClose={() => setChoose(null)} />
      ) : null}
      {toast ? (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          {toast}
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setToast("")}
          >
            <X size={17} />
          </button>
        </div>
      ) : null}
    </C.Provider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
