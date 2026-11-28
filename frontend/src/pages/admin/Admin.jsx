import React, { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Brand, Empty, Link } from "../../components/ui";
import { adminNav } from "../../constants";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { go } from "../../utils";
import { Analytics } from "./Analytics";
import { BookingDetail } from "./BookingDetail";
import { BookingList } from "./BookingList";
import { Dashboard } from "./Dashboard";
import { Inventory } from "./Inventory";
import { OrderEditor } from "./OrderEditor";
import { RentalList } from "./RentalList";
import { StoreSettings } from "./StoreSettings";

export function Admin() {
  const { user, path, reload } = useApp(),
    [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  if (!user || !["admin", "cashier"].includes(user.role))
    return (
      <div className="page container">
        <Empty
          title="Masuk untuk membuka panel staf"
          description="Halaman ini hanya tersedia untuk akun staf yang berwenang."
        >
          <Link className="btn" to="/masuk">
            Masuk
          </Link>
        </Empty>
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Brand />
        <span className="eyebrow">PANEL STAF</span>
        <nav>
          {adminNav.map(([to, label, I]) => (
            <Link
              key={to}
              to={to}
              className={
                (to === "/admin" ? path === to : path.startsWith(to))
                  ? "active"
                  : ""
              }
            >
              <I size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/">Lihat website pelanggan</Link>

          <button
            type="button"
            onClick={async () => {
              await api("/logout", {});
              await reload();
              go("/masuk");
            }}
          >
            <LogOut size={17} />
            Keluar
          </button>
        </div>
      </aside>
      {menu ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="sidebar-overlay"
          onClick={() => setMenu(false)}
        />
      ) : null}
      <div className="admin-main">
        <header className="admin-top">
          <div className="row">
            <button
              type="button"
              className="icon-btn mobile-toggle"
              aria-label="Menu panel staf"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <span>
              Funniest Outdoor <small>/ Panel Staf</small>
            </span>
          </div>
          <div className="profile">
            <span>{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role === "admin" ? "Administrator" : "Kasir"}</small>
            </div>
          </div>
        </header>
        <main className="admin-content">
          {path === "/admin" ? (
            <Dashboard />
          ) : path === "/admin/pos" ? (
            <OrderEditor />
          ) : path === "/admin/disewa" ? (
            <RentalList />
          ) : path === "/admin/inventaris" ? (
            <Inventory />
          ) : path === "/admin/analisis" ? (
            <Analytics />
          ) : path === "/admin/pengaturan" ? (
            <StoreSettings />
          ) : path.startsWith("/admin/pesanan/") ? (
            <BookingDetail bookingId={path.split("/")[3]} />
          ) : ["/admin/reservasi", "/admin/pesanan", "/admin/nota"].includes(
              path,
            ) ? (
            <BookingList mode={path.split("/")[2]} />
          ) : (
            <Empty title="Halaman tidak ditemukan" />
          )}
        </main>
      </div>
    </div>
  );
}