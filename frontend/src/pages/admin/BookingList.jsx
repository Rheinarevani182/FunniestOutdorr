import React, { useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { BookTable } from "../../components/admin";
import {
  Button,
  Field,
  Link,
  Loading,
  Notice,
  Panel,
  Title,
} from "../../components/ui";
import { statusLabels } from "../../constants";
import { useResource } from "../../hooks";
import { csv } from "../../utils";

export function BookingList({ mode }) {
  const { data, error, refresh } = useResource("/bookings", { pollMs: 5000 }),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [from, setFrom] = useState("");
  if (error) return <Notice>{error}</Notice>;
  if (!data) return <Loading />;
  const rows = data.bookings.filter(
    (b) =>
      (mode !== "reservasi" || b.source === "web") &&
      (status === "all" || status === b.status) &&
      (!from || b.start_at.slice(0, 10) >= from) &&
      (b.code + " " + b.customer_name + " " + b.phone)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Title
        title={
          mode === "nota"
            ? "Nota Digital"
            : mode === "reservasi"
              ? "Manajemen Reservasi"
              : "Pesanan Sewa"
        }
        description="Pantau pesanan, pembayaran, dan jadwal perlengkapan dalam satu tempat."
      >
        <Button
          variant="outline"
          onClick={() =>
            csv("pesanan-funniest.csv", [
              [
                "Kode",
                "Pelanggan",
                "WhatsApp",
                "Ambil",
                "Kembali",
                "Status",
                "Biaya sewa",
                "DP minimal",
                "Total",
                "Dibayar",
              ],
              ...rows.map((b) => [
                b.code,
                b.customer_name,
                b.phone,
                b.start_at,
                b.end_at,
                statusLabels[b.status],
                b.rental,
                Math.ceil(b.rental / 2),
                b.total,
                b.paid,
              ]),
            ])
          }
        >
          <Download size={17} />
          Ekspor CSV
        </Button>
        <Link className="btn orange" to="/admin/pos">
          <Plus size={17} />
          Transaksi Baru
        </Link>
      </Title>
      <div className="tabs">
        {[["all", "Semua"], ...Object.entries(statusLabels)].map(([s, l]) => (
          <button
            type="button"
            key={s}
            className={status === s ? "active" : ""}
            onClick={() => setStatus(s)}
          >
            {l}
          </button>
        ))}
      </div>
      <Panel>
        <div className="toolbar">
          <div className="input-search">
            <Search size={18} />
            <input
              aria-label="Cari pesanan"
              placeholder="Cari kode, nama, atau WhatsApp…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="actions">
            <Field label="Mulai tanggal ambil">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Button variant="outline" onClick={refresh}>
              Perbarui
            </Button>
          </div>
        </div>
        <BookTable rows={rows} invoice={mode === "nota"} />
        <p className="muted small">
          {rows.length} pesanan ditampilkan. Maksimal 500 pesanan terbaru per
          tampilan.
        </p>
      </Panel>
    </>
  );
}