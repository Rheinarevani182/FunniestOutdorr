import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  CalendarDays,
  Package,
  ReceiptText,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Download,
  Pencil,
  Copy,
  CheckCircle2,
  Backpack,
  Tent,
  ShieldCheck,
} from "lucide-react";
import {
  useApp,
  api,
  go,
  Link,
  Button,
  Brand,
  Badge,
  Loading,
  Empty,
  Notice,
  Field,
  Panel,
  Title,
  Photo,
  Categories,
  Dates,
  useResource,
  LiveStatus,
  useQuote,
  Summary,
  CartLines,
  ProductCard,
  Choose,
  Modal,
  money,
  fmt,
  defaultDates,
  datePayload,
  csv,
  statusLabels,
  waLink, invoiceText, reminderText, productPhoto,
} from "./core";
const nav = [
  ["/admin", "Ringkasan", ChartNoAxesCombined],
  ["/admin/pos", "Kasir Cepat (POS)", ShoppingCart],
  ["/admin/reservasi", "Reservasi", CalendarDays],
  ["/admin/pesanan", "Pesanan", Package],
  ["/admin/disewa", "Daftar Penyewaan", Backpack],
  ["/admin/inventaris", "Katalog & Stok", Tent],
  ["/admin/nota", "Nota Digital", ReceiptText],
  ["/admin/analisis", "Analisis Bisnis", ChartNoAxesCombined],
  ["/admin/pengaturan", "Pengaturan", Settings],
];
export function Admin() {
  const { user, path, reload } = useApp(),
    [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  if (!user || !["admin","cashier"].includes(user.role))
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
          {nav.map(([to, label, I]) => (
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
          ) : path === "/admin/disewa" ? (<RentalList />
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
function Metric({ label, value, description, icon: I = Package }) {
  return (
    <Link to={label.includes("Pendapatan")?"/admin/analisis":label.includes("Reservasi")?"/admin/reservasi":label.includes("disewa")||label.includes("kembali")?"/admin/disewa?status=rented":label.includes("Pesanan")?"/admin/pesanan":"/admin/inventaris"} className="metric metric-link">
      <div>
        <span>{label}</span>
        <I size={20} />
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </Link>
  );
}
function Chart({ data }) {
  const max = Math.max(1, ...data.map((x) => x.amount));
  return (
    <div className="chart">
      {data.map((d) => (
        <div className="chart-bar" key={d.date}>
          <small>{d.amount ? money(d.amount) : ""}</small>
          <div className="bar-track">
            <span
              title={fmt(d.date) + ": " + money(d.amount)}
              style={{ height: Math.max(2, (d.amount / max) * 100) + "%" }}
            />
          </div>
          <small>
            {new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })}
          </small>
        </div>
      ))}
    </div>
  );
}
function BookTable({ rows, invoice = false }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No. Reservasi</th>
            <th>Pelanggan</th>
            <th>Tanggal sewa</th>
            <th>Total</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>
                <Link className="text-button" to={"/admin/pesanan/" + b.id}>
                  {b.code}
                </Link>
                <small>{b.source === "pos" ? "Kasir" : "Website"}</small>
              </td>
              <td>
                <strong>{b.customer_name}</strong>
                <small>{b.phone}</small>
              </td>
              <td>
                {fmt(b.start_at)}
                <small>s.d. {fmt(b.end_at)}</small>
              </td>
              <td>
                {money(b.total)}
                <small>
                  {b.paid >= b.total
                    ? "Lunas"
                    : "Sisa " + money(b.total - b.paid)}
                </small>
              </td>
              <td>
                <Badge status={b.status} />
              </td>
              <td>
                <Link
                  className="text-button"
                  to={invoice ? "/nota/" + b.token : "/admin/pesanan/" + b.id}
                >
                  {invoice ? "Buka Nota" : "Detail"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Belum ada pesanan"
      description="Pesanan dari website dan kasir akan muncul di sini."
    />
  );
}
function Dashboard() {
  const r = useResource("/analytics",{pollMs:5000}),
    b = useResource("/bookings",{pollMs:5000}),
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
function BookingList({ mode }) {
  const { data, error, refresh } = useResource("/bookings",{pollMs:5000}),
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
                Math.ceil(b.rental/2),
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
function OrderEditor({ existing, onSaved }) {
  const { items, reload, notify } = useApp(),
    [lines, setLines] = useState(
      existing
        ? existing.items.map((l) => ({
            variant_id: l.variant_id,
            quantity: l.quantity,
          }))
        : [],
    ),
    [dates, setDates] = useState(
      existing
        ? {
            start: existing.start_at.slice(0, 10),
            end: existing.end_at.slice(0, 10),
          }
        : defaultDates,
    ),
    [form, setForm] = useState({
      customer_name: existing?.customer_name || "",
      phone: existing?.phone || "",
      note: existing?.note || "",
      address: existing?.address||"", identity_type:existing?.identity_type||"KTP",
    }),
    [bundle, setBundle] = useState(existing?.bundle_id || ""),
    [cat, setCat] = useState("Semua"),
    [q, setQ] = useState(""),
    [choose, setChoose] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    {
      quote,
      error: quoteError,
      loading,
    } = useQuote(lines, bundle, dates, existing?.id);
  const stockResource=useResource('/availability?start='+encodeURIComponent(datePayload(dates).start_at)+'&end='+encodeURIComponent(datePayload(dates).end_at)+(existing?'&exclude='+existing.id:''),{pollMs:5000});
  const baseStock=stockResource.data?.variants||[];
  const remaining=baseStock.map(v=>({...v,available:Math.max(0,v.available-(lines.find(l=>l.variant_id===v.id)?.quantity||0))}));
  const add = (vid, quantity = 1) => {
    const stock=remaining.find(v=>v.id===vid);
    if(!stock||stock.available<quantity){notify('Stok tidak cukup untuk tanggal yang dipilih.');return;}
    setLines((prev) =>
      prev.some((l) => l.variant_id === vid)
        ? prev.map((l) =>
            l.variant_id === vid
              ? { ...l, quantity: Math.min(100, l.quantity + quantity) }
              : l,
          )
        : [...prev, { variant_id: vid, quantity }],
    );
  };
  return (
    <>
      <Title
        title={
          existing ? "Editor Pesanan · " + existing.code : "Kasir Cepat (POS)"
        }
        description="Tambah alat, ubah jumlah dan durasi, tanpa mengulang transaksi."
      >
        {existing ? (
          <Button variant="outline" onClick={onSaved}>
            Kembali ke detail
          </Button>
        ) : null}
      </Title>
      <form
        className="pos-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const p = {
              ...form,
              ...datePayload(dates),
              items: lines,
              bundle_id: bundle,
            };
            if (existing) {
              await api(
                "/bookings/" + existing.id,
                { ...p, version: existing.version },
                "PATCH",
              );
              onSaved();
            } else {
              const b = await api("/bookings", { ...p, source: "pos" });
              go("/admin/pesanan/" + b.id);
            }
            await reload();
            notify("Pesanan berhasil disimpan.");
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <div className="input-search">
            <Search size={18} />
            <input
              aria-label="Cari perlengkapan kasir"
              placeholder="Cari perlengkapan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Categories value={cat} onChange={setCat} />
          <div className="product-grid pos-products">
            {items
              .filter(
                (p) =>
                  p.active &&
                  (cat === "Semua" || cat === p.category) &&
                  p.name.toLowerCase().includes(q.toLowerCase()),
              )
              .map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  stock={remaining}
                  onAdd={() =>
                    p.variants.length > 1 ? setChoose(p) : add(p.variants[0].id)
                  }
                />
              ))}
          </div>
        </div>
        <div>
          <Panel title="Rincian transaksi">
            <div className="two-col">
              <Field
                label="Nama pelanggan *"
                required
                minLength={2}
                value={form.customer_name}
                onChange={(e) =>
                  setForm({ ...form, customer_name: e.target.value })
                }
              />
              <Field
                label="WhatsApp *"
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Field label="Alamat penyewa"><textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></Field>
            <Field label="Jaminan pengambilan"><select value={form.identity_type} onChange={e=>setForm({...form,identity_type:e.target.value})}><option>KTP</option><option>SIM</option></select></Field>
            <Dates dates={dates} onChange={setDates} compact />
            <CartLines lines={lines} setLines={setLines} />
            {!lines.length ? <Empty title="Pilih alat dari katalog" /> : null}
            <Field label="Paket yang berlaku">
              <select
                value={bundle}
                onChange={(e) => setBundle(e.target.value)}
              >
                <option value="">Tanpa paket</option>
                <option value="camping4">Camping Bareng 4 Orang</option>
                <option value="hiker">Pendaki Ringkas</option>
                <option value="rest">Istirahat di Alam</option>
              </select>
            </Field>
            <small className="muted">
              Diskon diterapkan hanya jika isi paket lengkap.
            </small>
            <Field label="Catatan">
              <textarea
                rows="2"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>
          </Panel>
          <Summary quote={quote} loading={loading}>
            {error || quoteError ? (
              <p className="error" role="alert">
                {error || quoteError}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="orange full"
              busy={busy}
              disabled={!quote || loading}
            >
              {existing ? "Simpan Perubahan" : "Simpan Transaksi"}
            </Button>
          </Summary>
        </div>
      </form>
      {choose ? (
        <Choose product={choose} onClose={() => setChoose(null)} onAdd={add} stock={remaining} />
      ) : null}
    </>
  );
}
function BookingDetail({ bookingId }) {
  const { data, error, refresh } = useResource("/bookings/" + bookingId,{pollMs:5000}),
    { notify } = useApp(),
    [editing, setEditing] = useState(false),
    [action, setAction] = useState(""),
    [amount, setAmount] = useState(""),
    [method, setMethod] = useState("transfer"),
    [fee, setFee] = useState(0),
    [note, setNote] = useState(""),
    [checked, setChecked] = useState(false),
    [checks, setChecks] = useState({}),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  if (error) return <Notice>{error}</Notice>;
  if (!data) return <Loading />;
  const b = data.booking,
    close = () => {
      setAction("");
      setChecked(false);
      setChecks({});
      setErr("");
    };
  if (editing)
    return (
      <OrderEditor
        key={b.version}
        existing={b}
        onSaved={() => {
          setEditing(false);
          refresh();
        }}
      />
    );
  const perform = async () => {
    setBusy(true);
    try {
      if (action === "payment")
        await api("/bookings/" + b.id + "/payment", {
          amount: Number(amount),
          method,
        });
      else if (action === "return")
        await api("/bookings/" + b.id + "/return", {
          fee: Number(fee),
          note,
          conditions: checks,
          settled:checked, identity_returned:checked,
        });
      else
        await api(
          "/bookings/" + b.id,
          { status: action, refund_confirmed: checked, collateral_received:checked },
          "PATCH",
        );
      close();
      refresh();
      notify("Pesanan berhasil diperbarui.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="breadcrumb">
        <Link to="/admin/pesanan">Pesanan</Link> / {b.code}
      </div>
      <Title
        title={b.code}
        description={
          "Dibuat " +
          fmt(b.created_at) +
          " · " +
          (b.source === "pos" ? "Kasir" : "Website")
        }
      >
        <Badge status={b.status} />
        <Link className="btn outline" to={"/nota/" + b.token}>Nota Digital</Link>
        <a className="btn outline" href={waLink(b.phone,invoiceText(b))} target="_blank" rel="noreferrer">Kirim Nota via WhatsApp</a>
        {["pending", "confirmed", "rented"].includes(b.status) ? (
          <Button variant="orange" onClick={() => setEditing(true)}>
            <Pencil size={17} />
            Edit Pesanan
          </Button>
        ) : null}
      </Title>
      <div className="checkout-grid">
        <div>
          {b.late_days>0&&<Panel title="Terlambat mengembalikan"><p>{b.late_days} hari × {money(b.late_rate)} = <strong>{money(b.late_fee)}</strong></p><p>Biaya dihitung sampai pengembalian, dibayar di tempat sebelum KTP/SIM diserahkan kembali.</p><a className="btn orange" href={waLink(b.phone,reminderText(b))} target="_blank" rel="noreferrer">Kirim Peringatan WhatsApp</a></Panel>}
          <Panel title="Pelanggan & jadwal">
            <p>Alamat: {b.address||'Belum dicatat'}</p><p>Jaminan: {b.identity_type} · {b.status==='returned'?'Sudah dikembalikan':b.collateral_received?'Dipegang admin':'Diserahkan saat pengambilan'}</p>
            <div className="two-col">
              <div>
                <div className="pair">
                  <span>Penyewa</span>
                  <strong>{b.customer_name}</strong>
                </div>
                <div className="pair">
                  <span>WhatsApp</span>
                  <a
                    href={"https://wa.me/" + b.phone}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {b.phone}
                  </a>
                </div>
              </div>
              <div>
                <div className="pair">
                  <span>Ambil</span>
                  <strong>{fmt(b.start_at)}</strong>
                </div>
                <div className="pair">
                  <span>Kembali</span>
                  <strong>{fmt(b.end_at)}</strong>
                </div>
              </div>
            </div>
            {b.note ? <Notice>{b.note}</Notice> : null}
          </Panel>
          <Panel title="Perlengkapan dipilih">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Perlengkapan</th>
                    <th>Jumlah</th>
                    <th>Harga / hari</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {b.items.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="row">
                          <Photo product={l} className="tiny" />
                          <div>
                            <strong>{l.name}</strong>
                            <small>{l.label}</small>
                          </div>
                        </div>
                      </td>
                      <td>{l.quantity}</td>
                      <td>{money(l.unit_price)}</td>
                      <td>{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Riwayat aktivitas">
            {b.logs.map((l, i) => (
              <div className="activity" key={i}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>{l.action}</strong>
                  <small>
                    {l.actor} ·{" "}
                    {new Date(l.created_at).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}
                  </small>
                </div>
              </div>
            ))}
          </Panel>
          {b.return_details ? (
            <Panel title="Penyelesaian pengembalian">
              <div className="pair">
                <span>Biaya tambahan</span>
                <strong>{money(b.return_details.fee)}</strong>
              </div>
              <div className="pair">
                <span>Dikembalikan ke pelanggan</span>
                <strong>
                  {money(
                    b.return_details.deposit_returned ??
                      b.return_details.cancelled_refund ??
                      0,
                  )}
                </strong>
              </div>
              {b.return_details.extra_due > 0 ? (
                <Notice>
                  Tambahan perlu ditagih: {money(b.return_details.extra_due)}
                </Notice>
              ) : null}
              <p>{b.return_details.note}</p>
            </Panel>
          ) : null}
        </div>
        <div>
          <Summary quote={b}>
            <div className="pair">
              <span>Sudah dibayar</span>
              <strong>{money(b.paid)}</strong>
            </div>
            <div className="pair">
              <span>Sisa pembayaran</span>
              <strong>{money(Math.max(0, b.total - b.paid))}</strong>
            </div>
            {!["cancelled", "returned"].includes(b.status) &&
            b.paid < b.total ? (
              <Button
                className="full"
                onClick={() => {
                  setAmount(b.status === "pending" ? Math.ceil(b.rental/2) : b.total - b.paid);
                  setAction("payment");
                }}
              >
                Catat Pembayaran
              </Button>
            ) : null}
            {b.status === "pending" && b.paid >= Math.ceil(b.rental/2) ? (
              <Button
                variant="orange full"
                onClick={() => setAction("confirmed")}
              >
                Konfirmasi Reservasi
              </Button>
            ) : null}
            {b.status === "confirmed" ? (
              <Button variant="orange full" onClick={() => setAction("rented")}>
                Serah Terima & Mulai Sewa
              </Button>
            ) : null}
            {b.status === "rented" ? (
              <Button variant="orange full" onClick={() => {setFee(b.late_fee);setNote(b.late_days?`Keterlambatan ${b.late_days} hari`:"");setAction("return");}}>
                Proses Pengembalian
              </Button>
            ) : null}
            {["pending", "confirmed"].includes(b.status) ? (
              <Button
                variant="danger full"
                onClick={() => setAction("cancelled")}
              >
                Batalkan Pesanan
              </Button>
            ) : null}
          </Summary>
          <Panel title="Bagikan nota">
            <p className="muted">
              Tautan nota hanya untuk orang yang memiliki tautannya.
            </p>
            <a className="btn full" href={waLink(b.phone,invoiceText(b))} target="_blank" rel="noreferrer">Kirim Nota ke WhatsApp Pelanggan</a>
            <Button
              variant="outline full"
              onClick={() =>
                navigator.clipboard
                  .writeText(location.origin + "/nota/" + b.token)
                  .then(() => notify("Tautan nota disalin."))
                  .catch(() => notify("Buka nota dan salin alamatnya."))
              }
            >
              <Copy size={16} />
              Salin Tautan Nota
            </Button>
          </Panel>
        </div>
      </div>
      {action ? (
        <Modal
          title={
            action === "payment"
              ? "Catat pembayaran"
              : action === "return"
                ? "Pemeriksaan pengembalian"
                : action === "rented"
                  ? "Serah terima alat"
                  : action === "cancelled"
                    ? "Batalkan pesanan"
                    : "Konfirmasi reservasi"
          }
          onClose={close}
        >
          <p className="muted">
            {b.code} · {b.customer_name}
          </p>
          {action === "payment" ? (
            <>
              <Field
                label="Jumlah diterima (Rp)"
                type="number"
                min="1"
                max={b.total - b.paid}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Field label="Metode">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="transfer">Transfer manual</option>
                  <option value="cash">Tunai</option>
                </select>
              </Field>
              <Notice>
                Catat setelah uang benar-benar diterima dan diverifikasi.
              </Notice>
            </>
          ) : action === "return" ? (
            <>
              {b.items.map((l) => (
                <label className="check-row" key={l.id}>
                  <input
                    type="checkbox"
                    checked={!!checks[l.id]}
                    onChange={(e) =>
                      setChecks({ ...checks, [l.id]: e.target.checked })
                    }
                  />
                  {l.name} · {l.label} × {l.quantity}
                </label>
              ))}
              <Field
                label="Biaya tambahan disepakati (Rp)"
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
              <Field label="Catatan kondisi / alasan biaya">
                <textarea
                  rows="3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <div className="pair grand">
                <span>Biaya dibayar saat pengembalian</span>
                <strong>{money(Number(fee))}</strong>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                Seluruh barang kembali dan diperiksa, biaya tambahan telah dibayar di tempat, serta jaminan KTP/SIM sudah dikembalikan.
              </label>
            </>
          ) : action === "rented" ? (
            <>
              <Notice>Lunasi sisa sewa dan terima jaminan {b.identity_type} sebelum menyerahkan barang.</Notice>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                Kelengkapan diperiksa dan jaminan KTP/SIM telah diterima dari pelanggan.
              </label>
            </>
          ) : action === "cancelled" ? (
            <>
              <Notice>Alokasi stok dilepas setelah pembatalan.</Notice>
              {b.paid > 0 ? (
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  Pembayaran {money(b.paid)} sudah dikembalikan secara manual.
                </label>
              ) : null}
            </>
          ) : (
            <p>
              Konfirmasi reservasi untuk melanjutkan pembayaran dan pengambilan.
            </p>
          )}
          {err ? (
            <p className="error" role="alert">
              {err}
            </p>
          ) : null}
          <div className="modal-actions">
            <Button variant="outline" onClick={close}>
              Kembali
            </Button>
            <Button
              variant="orange"
              busy={busy}
              disabled={
                (action === "return" && b.items.some((l) => !checks[l.id])) ||
                (["return", "rented"].includes(action) && !checked) ||
                (action === "cancelled" && b.paid > 0 && !checked)
              }
              onClick={perform}
            >
              Simpan & Konfirmasi
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
function Inventory() {
  const { items, user, reload, notify } = useApp(),
    [q, setQ] = useState(""),
    [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const total = items
      .flatMap((p) => p.variants)
      .reduce((s, v) => s + v.stock, 0),
    maintenance = items
      .flatMap((p) => p.variants)
      .reduce((s, v) => s + v.maintenance, 0),
    change = (k, v) => setEdit({ ...edit, [k]: v });
  return (
    <>
      <Title
        title="Katalog & Stok"
        description="Kelola perlengkapan, varian, harga, dan kondisi stok."
      >
        {user.role === "admin" ? (
          <Button
            variant="orange"
            onClick={() => {
              setError("");
              setEdit({
                name: "",
                category: "Perlengkapan",
                price: 0,
                image: 4,
                description: "",
                tags: "",
                active: 1,
                variants: [{ label: "Standar", stock: 1, maintenance: 0 }],
              });
            }}
          >
            <Plus size={18} />
            Tambah Produk
          </Button>
        ) : null}
      </Title>
      <div className="metrics">
        <Metric
          label="Produk aktif"
          value={items.filter((p) => p.active).length}
          description="Tampil pada katalog"
        />
        <Metric
          label="Total unit"
          value={total}
          description="Seluruh inventaris"
        />
        <Metric
          label="Siap sewa"
          value={total - maintenance}
          description="Termasuk unit yang dialokasikan"
        />
        <Metric label="Barang belum kembali" value="Lihat daftar" description="Pantau penyewa & batas pengembalian" />
      </div>
      <Panel title="Inventaris perlengkapan">
        <div className="input-search">
          <Search size={18} />
          <input
            aria-label="Cari inventaris"
            placeholder="Cari nama atau kategori…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga / hari</th>
                <th>Varian</th>
                <th>Total</th>

                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((p) =>
                  (p.name + " " + p.category)
                    .toLowerCase()
                    .includes(q.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="row">
                        <Photo product={p} className="tiny" />
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.category}</small>
                        </div>
                      </div>
                    </td>
                    <td>{money(p.price)}</td>
                    <td>{p.variants.map((v) => v.label).join(", ")}</td>
                    <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>

                    <td>
                      <Badge status={p.active ? "available" : "cancelled"}>
                        {p.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td>
                      {user.role === "admin" ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setError("");
                            setEdit(JSON.parse(JSON.stringify(p)));
                          }}
                        >
                          Edit
                        </button>
                      ) : (
                        <small>Akses kasir</small>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Notice>
        Stok pada suatu tanggal dihitung dari puncak jumlah alat yang
        dialokasikan pada jadwal bertabrakan. Jadwal yang tidak bertabrakan
        tetap bisa dipesan.
      </Notice>
      {edit ? (
        <Modal
          wide
          title={edit.id ? "Edit Produk" : "Tambah Produk"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api("/items", edit, "PUT");
                await reload();
                setEdit(null);
                notify("Produk berhasil disimpan.");
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="two-col">
              <Field
                label="Nama produk"
                required
                value={edit.name}
                onChange={(e) => change("name", e.target.value)}
              />
              <Field label="Kategori">
                <select
                  value={edit.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  {["Tenda", "Carrier", "Sepatu", "Kursi", "Perlengkapan"].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field
                label="Harga harian (Rp)"
                type="number"
                min="0"
                required
                value={edit.price}
                onChange={(e) => change("price", Number(e.target.value))}
              />
              <Field label="Tampilan produk">
                <select
                  value={edit.image}
                  onChange={(e) => change("image", Number(e.target.value))}
                >
                  {[
                    "Sepatu",
                    "Carrier",
                    "Kursi",
                    "Tenda",
                    "Matras",
                    "Sleeping Bag",
                    "Kompor",
                    "Cookset",
                    "Headlamp",
                    "Trekking Pole",
                    "Flysheet",
                    "Poncho",
                  ].map((n, i) => (
                    <option key={n} value={i}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Panel title="Foto produk"><Photo product={edit} className="modal-photo"/><div className="two-col">{[['Ambil foto dengan kamera',true],['Pilih dari galeri / perangkat',false]].map(([label,camera])=><Field key={label} label={label}><input type="file" accept="image/jpeg,image/png,image/webp" capture={camera?'environment':undefined} onChange={async e=>{const file=e.target.files?.[0];setBusy(true);try{const photo_url=await productPhoto(file);if(photo_url)setEdit(prev=>({...prev,photo_url}));setError('');}catch(e){setError(e.message);}finally{setBusy(false);}}}/></Field>)}</div><p className="muted">Foto disesuaikan ukurannya dan disimpan bersama produk. Gunakan pilihan perangkat jika kamera tidak tersedia.</p></Panel>
            <Field label="Deskripsi">
              <textarea
                rows="3"
                value={edit.description}
                onChange={(e) => change("description", e.target.value)}
              />
            </Field>
            <Field
              label="Kata kunci"
              value={edit.tags}
              onChange={(e) => change("tags", e.target.value)}
            />
            <h3>Varian & stok</h3>
            {edit.variants.map((v, i) => (
              <div className="variant-row" key={i}>
                {[
                  ["label", "Ukuran / varian", "text"],
                  ["stock", "Total unit", "number"],

                ].map(([k, label, type]) => (
                  <Field
                    key={k}
                    label={label}
                    required
                    type={type}
                    min="0"
                    value={v[k]}
                    onChange={(e) =>
                      change(
                        "variants",
                        edit.variants.map((x, j) =>
                          i === j
                            ? {
                                ...x,
                                [k]:
                                  type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                change("variants", [
                  ...edit.variants,
                  { label: "", stock: 1, maintenance: 0 },
                ])
              }
            >
              Tambah Varian
            </Button>
            <label className="check-row">
              <input
                type="checkbox"
                checked={!!edit.active}
                onChange={(e) => change("active", e.target.checked ? 1 : 0)}
              />
              Tampilkan produk di katalog
            </label>
            {error ? <p className="error">{error}</p> : null}
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setEdit(null)}>
                Batal
              </Button>
              <Button type="submit" busy={busy}>
                Simpan Produk
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
function Analytics() {
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
            Pantau daftar barang disewa untuk melihat pelanggan yang belum mengembalikan dan biaya keterlambatan.
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
function StoreSettings() {
  const { settings, user, reload, notify } = useApp(),
    [form, setForm] = useState({ ...settings }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [staff, setStaff] = useState({
      name: "",
      email: "",
      password: "",
      role: "cashier",
    }),
    [pwd, setPwd] = useState({ current: "", next: "" });
  if (user.role !== "admin")
    return <Notice>Pengaturan hanya tersedia untuk administrator.</Notice>;
  const change = (k, v) => setForm({ ...form, [k]: v });
  return (
    <>
      <Title
        title="Pengaturan Usaha"
        description="Perbarui identitas usaha dan aturan tarif sebelum operasional."
      />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/settings", form, "PUT");
            await reload();
            notify("Pengaturan usaha disimpan.");
            setError("");
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="two-col">
          <Panel title="Profil usaha">
            <Field
              label="Nama usaha"
              required
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
            />
            <Field
              label="WhatsApp usaha"
              type="tel"
              placeholder="08xx xxxx xxxx"
              value={form.phone}
              onChange={(e) => change("phone", e.target.value)}
            />
            <Field label="Alamat pengambilan">
              <textarea
                rows="3"
                value={form.address}
                onChange={(e) => change("address", e.target.value)}
              />
            </Field>
            <Field
              label="Jam operasional"
              value={form.hours}
              onChange={(e) => change("hours", e.target.value)}
            />
            {[['instagram','Link Instagram'],['tiktok','Link TikTok'],['maps','Link Google Maps']].map(([k,l])=><Field key={k} label={l} type="url" placeholder="https://..." value={form[k]||''} onChange={e=>change(k,e.target.value)}/>)}
          </Panel>
          <Panel title="Tarif & ketentuan">
            <Notice>DP 50% dari biaya sewa. Tanpa deposit uang. Jaminan KTP/SIM saat pengambilan.</Notice>
            {[['bank_name','Nama bank'],['bank_account','Nomor rekening DP'],['bank_holder','Atas nama']].map(([k,l])=><Field key={k} label={l} value={form[k]||''} onChange={e=>change(k,e.target.value)}/>)}
            <Field label="Biaya keterlambatan / hari / pesanan (Rp)" type="number" min="0" value={form.late_daily||0} onChange={e=>change('late_daily',Number(e.target.value))}/>
            <p className="muted">Isi 0 untuk mengikuti jumlah tarif harian seluruh barang dalam pesanan. Bagian hari dihitung satu hari.</p>
            <h4>Pengali tarif menurut durasi</h4>
            {form.tiers.map((t, i) => (
              <div className="two-col" key={i}>
                <Field
                  label="Mulai hari ke-"
                  required
                  type="number"
                  min="1"
                  value={t.min_days}
                  onChange={(e) =>
                    change(
                      "tiers",
                      form.tiers.map((x, j) =>
                        j === i
                          ? { ...x, min_days: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
                <Field
                  label="Pengali harga"
                  required
                  type="number"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={t.factor}
                  onChange={(e) =>
                    change(
                      "tiers",
                      form.tiers.map((x, j) =>
                        j === i ? { ...x, factor: Number(e.target.value) } : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <small className="muted">
              0,9 berarti 90% × harga harian × durasi. Sesuaikan dengan tarif
              asli UMKM.
            </small>
            <Field label="Ketentuan sewa">
              <textarea
                rows="4"
                value={form.terms}
                onChange={(e) => change("terms", e.target.value)}
              />
            </Field>
          </Panel>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="save-bar">
          <Button type="submit" variant="orange" busy={busy}>
            Simpan Pengaturan
          </Button>
        </div>
      </form>
      <div className="two-col">
        <Panel title="Tambah akun staf">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/users", staff);
                setStaff({
                  name: "",
                  email: "",
                  password: "",
                  role: "cashier",
                });
                notify("Akun staf berhasil dibuat.");
              } catch (e) {
                notify(e.message);
              }
            }}
          >
            {[
              ["name", "Nama staf", "text"],
              ["email", "Email", "email"],
              ["password", "Kata sandi (minimal 10 karakter)", "password"],
            ].map(([k, l, t]) => (
              <Field
                key={k}
                label={l}
                type={t}
                minLength={k === "password" ? 10 : undefined}
                required
                value={staff[k]}
                onChange={(e) => setStaff({ ...staff, [k]: e.target.value })}
              />
            ))}
            <Field label="Peran">
              <select
                value={staff.role}
                onChange={(e) => setStaff({ ...staff, role: e.target.value })}
              >
                <option value="cashier">Kasir</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
            <Button variant="outline" type="submit">
              Buat Akun Staf
            </Button>
          </form>
        </Panel>
        <Panel title="Akses akun">

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api("/password", pwd);
                  setPwd({ current: "", next: "" });
                  notify("Kata sandi berhasil diganti.");
                } catch (e) {
                  notify(e.message);
                }
              }}
            >
              <Field
                label="Kata sandi saat ini"
                type="password"
                required
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              />
              <Field
                label="Kata sandi baru"
                type="password"
                required
                minLength={10}
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
              <Button variant="outline" type="submit">
                Ganti Kata Sandi
              </Button>
            </form>

          <hr />
          <p className="muted">
            Pembayaran dilakukan manual di kasir atau melalui transfer yang
            diverifikasi staf. Dokumen identitas pelanggan tidak disimpan.
          </p>
        </Panel>
      </div>
    </>
  );
}

function RentalList(){
 const [q,setQ]=useState('');
 const requested=new URLSearchParams(location.search).get('status');
 const [status,setStatus]=useState(['confirmed','rented','late','returned','all'].includes(requested)?requested:'rented');
 const r=useResource('/bookings',{pollMs:5000});
 if(!r.data)return r.error?<Notice>{r.error}</Notice>:<Loading/>;
 const rows=r.data.bookings.filter(b=>['confirmed','rented','returned'].includes(b.status)).filter(b=>(status==='all'||status==='late'&&b.status==='rented'&&b.late_days>0||status===b.status)&&(b.customer_name+' '+b.phone+' '+b.code+' '+b.items.map(l=>l.name).join(' ')).toLowerCase().includes(q.toLowerCase()));
 const count=type=>r.data.bookings.filter(b=>b.status===type).length;
 const filters=[['rented','Dibawa, belum kembali'],['confirmed','Di-keep, belum diambil'],['late','Terlambat'],['returned','Sudah dikembalikan'],['all','Semua status']];
 return <><Title title="Daftar Penyewaan" description="Barang di-keep masih di toko. Barang belum kembali hanya yang sudah diserahkan kepada pelanggan."><Button variant="outline" onClick={r.refresh}>Perbarui</Button></Title>
 <div className="rental-status-tabs"><button className={status==='rented'?'active':''} onClick={()=>setStatus('rented')}>Dibawa · {count('rented')}</button><button className={status==='confirmed'?'active':''} onClick={()=>setStatus('confirmed')}>Belum diambil · {count('confirmed')}</button><button className={status==='returned'?'active':''} onClick={()=>setStatus('returned')}>Sudah kembali · {count('returned')}</button></div>
 <div className="report-filters"><Field label="Cari penyewa / barang"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nama, WhatsApp, kode atau barang…"/></Field><Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}>{filters.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></Field></div>
 <LiveStatus updatedAt={r.updatedAt} error={r.error}/>
 {rows.length?<section className="rental-list" aria-label="Daftar penyewaan">{rows.map(b=><article key={b.id} className="rental-row"><div className="rental-main"><Link className="text-button" to={'/admin/pesanan/'+b.id}>{b.code} · {b.customer_name}</Link><p className="rental-items">{b.items.map(l=>`${l.name} (${l.label}) × ${l.quantity}`).join(' · ')}</p><small>{b.status==='confirmed'?'Ambil':'Sewa'} {fmt(b.start_at)} · Kembali {fmt(b.end_at)}</small></div><div className="rental-state"><Badge status={b.status}/>{b.late_days>0&&<strong className="error">Telat {b.late_days} hari · {money(b.late_fee)}</strong>}<small>Dibayar {money(b.paid)} / {money(b.total)}</small></div><Link className="btn outline rental-detail" to={'/admin/pesanan/'+b.id}>Lihat Detail</Link></article>)}</section>:<Empty title="Tidak ada penyewaan untuk status ini" description={status==='rented'?'Belum ada barang yang sedang dibawa pelanggan. Reservasi ber-DP bisa dilihat pada status Di-keep, belum diambil.':'Coba status atau kata pencarian lain.'}/>}
 <p className="muted small">{rows.length} pesanan ditampilkan. Rincian pelanggan, nota, jaminan, serta tindakan serah terima tersedia di halaman detail.</p></>;
}
