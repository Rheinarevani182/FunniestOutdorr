import React, { useState } from "react";
import {
  Badge,
  Button,
  Empty,
  Field,
  Link,
  LiveStatus,
  Loading,
  Notice,
  Title,
} from "../../components/ui";
import { useResource } from "../../hooks";
import { fmt, money } from "../../utils";

export function RentalList() {
  const [q, setQ] = useState("");
  const requested = new URLSearchParams(location.search).get("status");
  const [status, setStatus] = useState(
    ["confirmed", "rented", "late", "returned", "all"].includes(requested)
      ? requested
      : "rented",
  );
  const r = useResource("/bookings", { pollMs: 5000 });
  if (!r.data) return r.error ? <Notice>{r.error}</Notice> : <Loading />;
  const rows = r.data.bookings
    .filter((b) => ["confirmed", "rented", "returned"].includes(b.status))
    .filter(
      (b) =>
        (status === "all" ||
          (status === "late" && b.status === "rented" && b.late_days > 0) ||
          status === b.status) &&
        (
          b.customer_name +
          " " +
          b.phone +
          " " +
          b.code +
          " " +
          b.items.map((l) => l.name).join(" ")
        )
          .toLowerCase()
          .includes(q.toLowerCase()),
    );
  const count = (type) =>
    r.data.bookings.filter((b) => b.status === type).length;
  const filters = [
    ["rented", "Dibawa, belum kembali"],
    ["confirmed", "Di-keep, belum diambil"],
    ["late", "Terlambat"],
    ["returned", "Sudah dikembalikan"],
    ["all", "Semua status"],
  ];
  return (
    <>
      <Title
        title="Daftar Penyewaan"
        description="Barang di-keep masih di toko. Barang belum kembali hanya yang sudah diserahkan kepada pelanggan."
      >
        <Button variant="outline" onClick={r.refresh}>
          Perbarui
        </Button>
      </Title>
      <div className="rental-status-tabs">
        <button
          className={status === "rented" ? "active" : ""}
          onClick={() => setStatus("rented")}
        >
          Dibawa · {count("rented")}
        </button>
        <button
          className={status === "confirmed" ? "active" : ""}
          onClick={() => setStatus("confirmed")}
        >
          Belum diambil · {count("confirmed")}
        </button>
        <button
          className={status === "returned" ? "active" : ""}
          onClick={() => setStatus("returned")}
        >
          Sudah kembali · {count("returned")}
        </button>
      </div>
      <div className="report-filters">
        <Field label="Cari penyewa / barang">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nama, WhatsApp, kode atau barang…"
          />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {filters.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <LiveStatus updatedAt={r.updatedAt} error={r.error} />
      {rows.length ? (
        <section className="rental-list" aria-label="Daftar penyewaan">
          {rows.map((b) => (
            <article key={b.id} className="rental-row">
              <div className="rental-main">
                <Link className="text-button" to={"/admin/pesanan/" + b.id}>
                  {b.code} · {b.customer_name}
                </Link>
                <p className="rental-items">
                  {b.items
                    .map((l) => `${l.name} (${l.label}) × ${l.quantity}`)
                    .join(" · ")}
                </p>
                <small>
                  {b.status === "confirmed" ? "Ambil" : "Sewa"}{" "}
                  {fmt(b.start_at)} · Kembali {fmt(b.end_at)}
                </small>
              </div>
              <div className="rental-state">
                <Badge status={b.status} />
                {b.late_days > 0 && (
                  <strong className="error">
                    Telat {b.late_days} hari · {money(b.late_fee)}
                  </strong>
                )}
                <small>
                  Dibayar {money(b.paid)} / {money(b.total)}
                </small>
              </div>
              <Link
                className="btn outline rental-detail"
                to={"/admin/pesanan/" + b.id}
              >
                Lihat Detail
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <Empty
          title="Tidak ada penyewaan untuk status ini"
          description={
            status === "rented"
              ? "Belum ada barang yang sedang dibawa pelanggan. Reservasi ber-DP bisa dilihat pada status Di-keep, belum diambil."
              : "Coba status atau kata pencarian lain."
          }
        />
      )}
      <p className="muted small">
        {rows.length} pesanan ditampilkan. Rincian pelanggan, nota, jaminan,
        serta tindakan serah terima tersedia di halaman detail.
      </p>
    </>
  );
}