import React, { useEffect, useState } from "react";
import { Menu, Mountain, ShoppingCart, Tent, UserRound, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Brand, Link } from "../ui";
import { SocialLinks } from "./SocialLinks";

export function Shell({ children }) {
  const { path, cart, settings, user } = useApp(),
    [menu, setMenu] = useState(false),
    n = cart.reduce((s, x) => s + x.quantity, 0);
  useEffect(() => setMenu(false), [path]);
  return (
    <>
      <header className="public-header">
        <div className="container nav-inner">
          <Brand />
          <nav className={menu ? "open" : ""}>
            {[
              ["/", "Beranda"],
              ["/katalog", "Katalog"],
              ["/paket", "Paket Sewa"],
              ["/tentang", "Tentang Kami"],
            ].map(([to, label]) => (
              <Link key={to} to={to} className={path === to ? "active" : ""}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-tools">
            <Link
              to="/keranjang"
              className="cart-link"
              aria-label={"Keranjang, " + n + " barang"}
            >
              <ShoppingCart />
              {n ? <span>{n}</span> : null}
            </Link>
            <Link
              to={
                user?.role === "customer" ? "/akun" : user ? "/admin" : "/masuk"
              }
              className="btn light nav-login"
            >
              {user ? "Akun" : "Masuk"}
            </Link>
            <button
              type="button"
              className="icon-btn mobile-toggle"
              aria-label="Menu navigasi"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div className="container footer-grid">
          <div>
            <Brand />
            <p>
              Perlengkapan untuk setiap cerita
              <br />
              di luar.
            </p>
          </div>
          <div>
            <h4>Rencanakan perjalanan</h4>
            <Link to="/katalog">Katalog perlengkapan</Link>
            <Link to="/paket">Paket sewa</Link>
            <Link to="/tentang">Panduan & ketentuan sewa</Link>
          </div>
          <div>
            <h4>Basecamp kami</h4>
            <p>{settings.address}</p>
            <p>{settings.hours}</p>
            {settings.phone ? (
              <a
                href={"https://wa.me/" + settings.phone}
                target="_blank"
                rel="noreferrer"
              >
                Hubungi WhatsApp
              </a>
            ) : (
              <Link to="/tentang">Informasi pengambilan</Link>
            )}
          </div>
        </div>
        <div className="container footer-bottom">
          <small>© {new Date().getFullYear()} Funniest Outdoor</small>
          <SocialLinks />
        </div>
      </footer>
      <nav className="bottom-nav">
        {[
          ["/", "Beranda", Mountain],
          ["/katalog", "Katalog", Tent],
          ["/keranjang", "Keranjang", ShoppingCart],
          ["/masuk", "Akun", UserRound],
        ].map(([to, label, I]) => (
          <Link key={to} to={to} className={path === to ? "active" : ""}>
            <I size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}