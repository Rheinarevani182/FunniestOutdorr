import React from "react";
import {
  Backpack,
  CalendarDays,
  ChartNoAxesCombined,
  Plus,
  ReceiptText,
  Tent,
} from "lucide-react";
import { BookTable, Chart, Metric } from "../../components/admin";
import {
  Badge,
  Empty,
  Link,
  Loading,
  Notice,
  Panel,
  Title,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useResource } from "../../hooks";
import { money } from "../../utils";

export function Dashboard() {
  const r = useResource("/analytics", { pollMs: 5000 }),
    b = useResource("/bookings", { pollMs: 5000 }),
    { user } = useApp();
  if (r.error) return <Notice>{r.error}</Notice>;
  if (!r.data) return <Loading />;
  const d = r.data;
  return (
    <>
      <Title
        title={"Halo, " + user.name + "!"}
        description="Ringkasan aktivitas penyewaan dan operasional yang tercatat."
      >
        <Link to="/admin/analisis" className="btn outline">
          Lihat Laporan
        </Link>
        <Link to="/admin/pos" className="btn orange">
          <Plus size={18} />
          Transaksi Baru
        </Link>
      </Title>
      <div className="metrics">
        <Metric
          label="Pendapatan sewa"
          value={money(d.revenue)}
          description="Pendapatan sewa dari pesanan lunas"
          icon={ChartNoAxesCombined}
        />
        <Metric
          label="Reservasi menunggu"
          value={d.pending}
          description="Perlu ditinjau dan dikonfirmasi"
          icon={CalendarDays}
        />
        <Metric
          label="Sedang disewa"
          value={d.active}
          description="Perlengkapan dibawa pelanggan"
          icon={Backpack}
        />
        <Metric
          label="Pesanan tercatat"
          value={d.orders}
          description="Selain pesanan dibatalkan"
          icon={ReceiptText}
        />
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Pendapatan sewa"
          action={<Badge status="available">7 hari terakhir</Badge>}
        >
          <Chart data={d.daily} />
        </Panel>
        <Panel title="Perlengkapan terlaris">
          {d.top.length ? (
            d.top.slice(0, 4).map((p) => (
              <div className="popular-row" key={p.id}>
                <Tent size={20} />
                <div>
                  <strong>{p.name}</strong>
                  <div className="meter">
                    <span
                      style={{
                        width: (p.quantity / d.top[0].quantity) * 100 + "%",
                      }}
                    />
                  </div>
                </div>
                <small>{p.quantity} unit</small>
              </div>
            ))
          ) : (
            <Empty
              title="Perjalanan baru dimulai"
              description="Performa produk muncul setelah ada pesanan."
            />
          )}
        </Panel>
      </div>
      <Panel
        title="Reservasi & pesanan terbaru"
        action={
          <Link className="text-button" to="/admin/pesanan">
            Lihat semua
          </Link>
        }
      >
        <BookTable rows={b.data?.bookings.slice(0, 5) || []} />
      </Panel>
    </>
  );
}