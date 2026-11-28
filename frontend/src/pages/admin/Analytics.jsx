import React, { useState } from "react";
import { Download } from "lucide-react";
import { Chart, Metric } from "../../components/admin";
import {
  Button,
  Empty,
  Field,
  Loading,
  Notice,
  Panel,
  Title,
} from "../../components/ui";
import { useResource } from "../../hooks";
import { csv, money } from "../../utils";

export function Analytics() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    { data: d, error } = useResource("/analytics?from=" + from + "&to=" + to);
  if (error) return <Notice>{error}</Notice>;
  if (!d) return <Loading />;
  return (
    <>
      <Title
        title="Analisis Bisnis"
        description="Laporan berdasarkan data transaksi yang tersimpan."
      >
        <Button
          variant="outline"
          onClick={() =>
            csv("analisis-funniest.csv", [
              ["Metrik", "Nilai"],
              ["Pendapatan sewa", d.revenue],
              ["Pesanan", d.orders],
              ["Sewa aktif", d.active],
              ["Penyewa belum mengembalikan", d.unreturned],
              [],
              ["Produk", "Jumlah disewa", "Nilai sewa sebelum diskon"],
              ...d.top.map((p) => [p.name, p.quantity, p.amount]),
            ])
          }
        >
          <Download size={17} />
          Unduh Laporan
        </Button>
      </Title>
      <div className="report-filters">
        <Field label="Dari tanggal">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="Sampai tanggal">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Button
          variant="outline"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
        >
          Semua periode
        </Button>
      </div>
      <div className="metrics">
        <Metric
          label="Pendapatan sewa"
          value={money(d.revenue)}
          description="Pendapatan sewa dari pesanan lunas"
        />
        <Metric
          label="Pesanan tercatat"
          value={d.orders}
          description="Selain pembatalan"
        />
        <Metric
          label="Sedang disewa"
          value={d.active}
          description="Alat dibawa pelanggan"
        />
        <Metric
          label="Penyewa belum kembali"
          value={d.unreturned}
          description="Buka daftar untuk melihat detail"
        />
      </div>
      <div className="dashboard-grid">
        <Panel title="Tren pendapatan">
          <Chart data={d.daily} />
          <p className="muted">
            7 hari terakhir yang termasuk periode dipilih.
          </p>
        </Panel>
        <Panel title="Indikator operasional">
          <div className="pair">
            <span>Menunggu konfirmasi</span>
            <strong>{d.pending} pesanan</strong>
          </div>
          <div className="pair">
            <span>Rata-rata nilai sewa</span>
            <strong>{money(d.averageRental)}</strong>
          </div>
          <Notice>
            Pantau daftar barang disewa untuk melihat pelanggan yang belum
            mengembalikan dan biaya keterlambatan.
          </Notice>
        </Panel>
      </div>
      <Panel title="Performa perlengkapan">
        {d.top.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Perlengkapan</th>
                  <th>Unit disewa</th>
                  <th>Nilai sewa sebelum diskon</th>
                </tr>
              </thead>
              <tbody>
                {d.top.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Belum ada data pada periode ini" />
        )}
      </Panel>
    </>
  );
}