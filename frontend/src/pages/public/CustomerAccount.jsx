import React from "react";
import {
  Badge,
  Button,
  Empty,
  Link,
  LiveStatus,
  Loading,
  Title,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useResource } from "../../hooks";
import { api } from "../../services/api";
import { fmt, go, money } from "../../utils";

export function CustomerAccount() {
  const { user, reload } = useApp();
  const r = useResource(user ? "/my-bookings" : null, { pollMs: 5000 });
  if (!user)
    return (
      <div className="container page">
        <Empty title="Masuk untuk melihat riwayat reservasi">
          <Link className="btn" to="/masuk">
            Masuk / Daftar
          </Link>
        </Empty>
      </div>
    );
  return (
    <div className="container page">
      <Title
        title={"Halo, " + user.name}
        description="Dashboard pelanggan · riwayat reservasi, pembayaran DP, dan pembaruan pesananmu."
      >
        <Link className="btn" to="/katalog">
          Reservasi Baru
        </Link>
        <Button
          variant="outline"
          onClick={async () => {
            await api("/logout", {});
            await reload();
            go("/");
          }}
        >
          Keluar
        </Button>
      </Title>
      <LiveStatus updatedAt={r.updatedAt} error={r.error} />
      {!r.data ? (
        <Loading />
      ) : r.data.bookings.length ? (
        <section className="rental-list" aria-label="Riwayat reservasi">
          {r.data.bookings.map((b) => (
            <article className="rental-row" key={b.id}>
              <div className="rental-main">
                <strong>{b.code}</strong>
                <p className="rental-items">
                  {b.items.map((l) => `${l.name} × ${l.quantity}`).join(" · ")}
                </p>
                <small>
                  {fmt(b.start_at)} – {fmt(b.end_at)}
                </small>
              </div>
              <div className="rental-state">
                <Badge status={b.status} />
                <strong
                  className={
                    b.payment_status === "unpaid" ? "muted" : "payment-ok"
                  }
                >
                  {b.payment_status === "paid"
                    ? "Lunas"
                    : b.payment_status === "dp_paid"
                      ? "DP terverifikasi"
                      : "Menunggu DP 50%"}
                </strong>
                <small>
                  Dibayar {money(b.paid)} · Sisa{" "}
                  {money(Math.max(0, b.total - b.paid))}
                </small>
                {b.status === "confirmed" && (
                  <small>Barang di-keep di toko, belum kamu ambil.</small>
                )}
                {b.status === "rented" && (
                  <small>Barang sudah dibawa. Kembalikan sesuai jadwal.</small>
                )}
              </div>
              <Link
                className="btn outline rental-detail"
                to={"/booking/" + b.token}
              >
                Detail & Pembayaran
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <Empty
          title="Belum ada reservasi"
          description="Pesanan yang dibuat setelah masuk akan tercatat di sini."
        />
      )}
    </div>
  );
}