import React, { useState } from "react";
import { Shell } from "./components/layout";
import { Choose } from "./components/product";
import { Button, Empty, Loading, Toast } from "./components/ui";
import { C } from "./context/AppContext";
import {
  useAvailability,
  useBootstrap,
  useCart,
  usePath,
  useToast,
} from "./hooks";
import { Admin } from "./pages/admin";
import {
  About,
  BookingStatus,
  Cart,
  Catalog,
  CustomerAccount,
  Home,
  Invoice,
  Login,
  Packages,
  ProductDetail,
  Reservation,
} from "./pages/public";

export function App() {
  const path = usePath(),
    { data, error, reload } = useBootstrap(),
    { toast, setToast, notify } = useToast(),
    { cart, setCart, dates, setDates, bundle, setBundle, add, addBundle } =
      useCart(notify),
    availability = useAvailability(dates, data),
    [choose, setChoose] = useState(null);

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
          ) : path === "/akun" ? (
            <CustomerAccount />
          ) : path === "/tanya-admin" ? (
            <Reservation inquiry />
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
      <Toast message={toast} onClose={() => setToast("")} />
    </C.Provider>
  );
}