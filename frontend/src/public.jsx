import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Tent,
  Menu,
  X,
  UserRound,
  Mountain,
  Copy,
  Printer,
  MapPin,
  ShieldCheck,
  Plus,
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
  datePayload,
  waLink,
} from "./core";
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
            <Link to={user?.role === "customer" ? "/akun" : user ? "/admin" : "/masuk"} className="btn light nav-login">
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
function SearchBox({ value, onChange, onSearch }) {
  return (
    <form
      className="smart-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.();
      }}
    >
      <span>
        <Sparkles size={16} />
        Pencarian pintar
      </span>
      <input
        aria-label="Cari perlengkapan"
        placeholder="Cari perlengkapan atau ceritakan rencana pendakianmu…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" className="icon-btn" aria-label="Cari">
        <Search size={22} />
      </button>
    </form>
  );
}
export function Home() {
  const { items, settings, bundles } = useApp(),
    [q, setQ] = useState("");
  return (
    <>
      <section className="hero">
        <img
          src="/assets/hero.jpg"
          alt="Perkemahan di pegunungan hijau"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="container hero-copy">
          <p className="eyebrow">
            FUNNIEST OUTDOOR · SIAP MENEMANI PERJALANANMU
          </p>
          <h1>
            Petualangan dimulai dari
            <br />
            perlengkapan yang tepat.
          </h1>
          <div className="accent" />
          <p>
            Sewa perlengkapan pendakian yang lengkap, terawat, dan siap dipakai
            untuk mendukung rencana petualanganmu.
          </p>
        </div>
      </section>
      <div className="container home-controls">
        <Dates />
        <SearchBox
          value={q}
          onChange={setQ}
          onSearch={() => go("/katalog?q=" + encodeURIComponent(q))}
        />
      </div>
      <div className="container home-content">
        <Categories
          value="Semua"
          onChange={(c) => go("/katalog?category=" + encodeURIComponent(c))}
        />
        <div className="section-heading">
          <div>
            <h2>Perlengkapan Pilihan</h2>
            <p>Teman perjalanan yang siap menemani langkahmu.</p>
          </div>
          <Link to="/katalog" className="text-button">
            Lihat semua perlengkapan
          </Link>
        </div>
        <div className="product-grid">
          {items.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="bundle-banner">
          <Tent size={88} strokeWidth={1} />
          <div>
            <span className="eyebrow">LEBIH PRAKTIS, LEBIH HEMAT</span>
            <h2>Paket Hemat</h2>
            <p>Perlengkapan saling melengkapi untuk cerita yang lebih seru.</p>
          </div>
          <div>
            <small>Mulai dari / hari</small>
            <strong>
              {money(
                Math.min(
                  ...bundles.map(
                    (b) =>
                      b.recipe.reduce(
                        (s, r) =>
                          s +
                          (items.find((p) =>
                            p.variants.some((v) => v.id === r.variant_id),
                          )?.price || 0) *
                            r.quantity,
                        0,
                      ) - b.discount_per_day,
                  ),
                ),
              )}
            </strong>
          </div>
          <Link className="btn" to="/paket">
            Lihat Paket
          </Link>
        </div>
        <div className="benefits">
          {[
            [
              CalendarDays,
              "Pilih tanggal & alat",
              "Lihat perlengkapan yang tersedia untuk jadwalmu.",
            ],
            [
              CheckCircle2,
              "Reservasi atau tanya admin",
              "Tanya lewat WhatsApp, atau masuk dan bayar DP 50% agar alat di-keep.",
            ],
            [
              Tent,
              "Ambil & mulai perjalanan",
              "Lunasi sisa sewa, serahkan KTP/SIM, lalu ambil alat. Kembalikan tepat waktu untuk mengambil jaminan.",
            ],
          ].map(([I, t, d]) => (
            <div key={t}>
              <I size={28} />
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <p className="sample-note">Rencanakan perjalanan dengan tenang. Pilih alatmu, pastikan jadwalnya, dan amankan dengan DP 50%.</p>
        <RentalGuide />
      </div>
    </>
  );
}
export function Catalog() {
  const { items, availability } = useApp(),
    params = new URLSearchParams(location.search),
    [q, setQ] = useState(params.get("q") || ""),
    [cat, setCat] = useState(params.get("category") || "Semua"),
    [max, setMax] = useState(150000),
    [only, setOnly] = useState(false),
    [sort, setSort] = useState("popular"),
    [result, setResult] = useState(null),
    [searching, setSearching] = useState(false),
    [filters, setFilters] = useState(false);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!q.trim()) {
        setResult(null);
        return;
      }
      setSearching(true);
      api("/search", { query: q })
        .then((x) => alive && setResult(x))
        .catch(
          () =>
            alive &&
            setResult({
              ids: items
                .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
                .map((p) => p.id),
              mode: "keyword-fallback",
            }),
        )
        .finally(() => alive && setSearching(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);
  let list = items.filter(
    (p) =>
      p.active &&
      (cat === "Semua" || p.category === cat) &&
      p.price <= max &&
      (!only ||
        availability.some((v) => v.item_id === p.id && v.available > 0)) &&
      (!result || result.ids.includes(p.id)),
  );
  if (result)
    list.sort((a, b) => result.ids.indexOf(a.id) - result.ids.indexOf(b.id));
  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);
  const reset = () => {
    setQ("");
    setCat("Semua");
    setOnly(false);
    setMax(150000);
  };
  const filter = (group) => (
    <>
      <h3>Filter perlengkapan</h3>
      <h4>Kategori</h4>
      {["Semua", "Tenda", "Carrier", "Sepatu", "Kursi", "Perlengkapan"].map(
        (c) => (
          <label className="check-row" key={c}>
            <input
              type="radio"
              name={"category-" + group}
              checked={cat === c}
              onChange={() => setCat(c)}
            />
            {c}
            <small>
              {c === "Semua"
                ? items.length
                : items.filter((p) => p.category === c).length}
            </small>
          </label>
        ),
      )}
      <hr />
      <Field label={"Harga maksimum / hari: " + money(max)}>
        <input
          type="range"
          min="10000"
          max="150000"
          step="5000"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
        />
      </Field>
      <label className="check-row">
        <input
          type="checkbox"
          checked={only}
          onChange={(e) => setOnly(e.target.checked)}
        />
        Hanya yang tersedia
      </label>
      <Button variant="outline full" onClick={reset}>
        Reset filter
      </Button>
    </>
  );
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Beranda</Link> / Katalog
      </div>
      <Title
        title="Temukan perlengkapanmu"
        description="Atur tanggal sewa untuk melihat stok sesuai jadwal."
      />
      <Dates onSearch={() => {}} />
      <div className="catalog-layout">
        <aside className="panel catalog-filter">{filter("side")}</aside>
        <div>
          <SearchBox value={q} onChange={setQ} />
          <div className="toolbar">
            <span>
              {searching ? "Mencari…" : list.length + " perlengkapan"}
            </span>
            <div className="actions">
              <Button
                variant="outline mobile-filter"
                onClick={() => setFilters(true)}
              >
                Filter
              </Button>
              <select
                aria-label="Urutkan produk"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="popular">Rekomendasi</option>
                <option value="low">Harga terendah</option>
                <option value="high">Harga tertinggi</option>
              </select>
            </div>
          </div>
          {q && result ? (
            <p className="muted search-mode">
              <Sparkles size={15} />
              {result.suggestions?.length ? 'Mungkin yang kamu cari:' : 'Hasil pencarian katalog'}
              {result.suggestions?.map(t=><button key={t} className="text-button" onClick={()=>setQ(t)}>{t}</button>)}
            </p>
          ) : null}
          {list.length ? (
            <div className="product-grid catalog-grid">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="Belum ada perlengkapan yang cocok"
              description="Coba kata kunci, filter, atau tanggal lain."
            >
              <Button onClick={reset}>Reset pencarian</Button>
            </Empty>
          )}
        </div>
      </div>
      {filters ? (
        <Modal title="Filter katalog" onClose={() => setFilters(false)}>
          {filter("mobile")}
          <Button className="full" onClick={() => setFilters(false)}>
            Tampilkan hasil
          </Button>
        </Modal>
      ) : null}
    </div>
  );
}
export function ProductDetail({ productId }) {
  const { items, availability, add, settings } = useApp(),
    [vid, setVid] = useState(""),
    [qty, setQty] = useState(1),
    p = items.find((p) => p.id === productId);
  if (!p) return <Empty title="Produk tidak ditemukan" />;
  const selected = vid || p.variants[0].id,
    v = availability.find((x) => x.id === selected);
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/katalog">Katalog</Link> / {p.name}
      </div>
      <div className="product-detail">
        <Photo product={p} />
        <div>
          <Badge status={v?.available === 0 ? "cancelled" : "available"}>
            {v?.available === 0 ? "Tidak tersedia" : "Tersedia untuk jadwalmu"}
          </Badge>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <div className="detail-price">
            {money(p.price)}
            <small> / hari / unit</small>
          </div>
          <h4>Pilih varian</h4>
          <div className="variants">
            {p.variants.map((v) => (
              <button
                type="button"
                key={v.id}
                className={v.id === selected ? "active" : ""}
                onClick={() => setVid(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="muted">
            {v ? v.available + " unit tersedia" : "Memeriksa stok…"}
          </p>
          <Dates compact />
          <Field
            label="Jumlah"
            type="number"
            min="1"
            max="100"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
          <Button
            className="full"
            disabled={
              !Number.isInteger(qty) ||
              qty < 1 ||
              qty > 100 ||
              (v && qty > v.available)
            }
            onClick={() => add(selected, qty)}
          >
            <Plus size={18} />
            Tambahkan ke Keranjang
          </Button>
          <Button variant="outline full" onClick={()=>go('/tanya-admin?variant='+encodeURIComponent(selected)+'&qty='+qty)}>Tanya Admin via WhatsApp</Button>
          <p className="muted">Alat diperiksa sebelum dan sesudah disewa.</p>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Tarif bertingkat">
          {settings.tiers.map((t) => (
            <div className="pair" key={t.min_days}>
              <span>Mulai {t.min_days} hari</span>
              <strong>
                {Math.round(t.factor * 100)}% × harga harian × durasi
              </strong>
            </div>
          ))}
        </Panel>
        <Panel title="Ketentuan pemakaian">
          <p>{settings.terms}</p>
          <p className="muted">
            Tanpa deposit uang. Jaminan KTP/SIM diserahkan saat pengambilan.
          </p>
        </Panel>
      </div>
    </div>
  );
}
export function Packages() {
  const { bundles, items, addBundle } = useApp();
  return (
    <div className="container page">
      <Title
        title="Lebih praktis dengan Paket Hemat"
        description="Perlengkapan saling melengkapi, harga lebih hemat, cerita lebih seru."
      />
      <Dates />
      <div className="package-grid">
        {bundles.map((b) => {
          const price =
            b.recipe.reduce(
              (s, r) =>
                s +
                (items.find((p) =>
                  p.variants.some((v) => v.id === r.variant_id),
                )?.price || 0) *
                  r.quantity,
              0,
            ) - b.discount_per_day;
          return (
            <article className="package-card" key={b.id}>
              <Photo product={b} />
              <div className="product-body">
                <Badge status="available">Paket sewa</Badge>
                <h2>{b.name}</h2>
                <p>{b.description}</p>
                {b.recipe.map((r) => (
                  <p key={r.variant_id} className="row">
                    <CheckCircle2 size={15} />
                    {
                      items.find((p) =>
                        p.variants.some((v) => v.id === r.variant_id),
                      )?.name
                    }{" "}
                    × {r.quantity}
                  </p>
                ))}
                <hr />
                <h3 className="price">
                  {money(price)}
                  <small> / hari</small>
                </h3>
                <Button className="full" onClick={() => addBundle(b)}>
                  Pilih Paket
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function Recommendations({ lines }) {
  const { items } = useApp(),
    ids = [
      ...new Set(
        lines
          .map(
            (l) =>
              items.find((p) => p.variants.some((v) => v.id === l.variant_id))
                ?.id,
          )
          .filter(Boolean),
      ),
    ],
    key = ids.join(","),
    [rec, setRec] = useState([]);
  useEffect(() => {
    let alive = true;
    api("/recommend", { item_ids: ids })
      .then((r) => alive && setRec(r.ids))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);
  return rec.length ? (
    <section className="recommendations">
      <h2>Lengkapi perjalananmu</h2>
      <p className="muted">Perlengkapan yang bisa melengkapi pilihanmu.</p>
      <div className="product-grid">
        {rec.map((id) => {
          const p = items.find((p) => p.id === id);
          return p ? <ProductCard key={id} product={p} /> : null;
        })}
      </div>
    </section>
  ) : null;
}
export function Cart() {
  const { cart, setCart, dates, bundle, setBundle, user } = useApp(),
    { quote, error, loading } = useQuote(cart, bundle, dates);
  if (!cart.length)
    return (
      <div className="container page">
        <Empty
          title="Keranjangmu masih kosong"
          description="Mulai dari perlengkapan yang menemani perjalananmu."
        >
          <Link className="btn" to="/katalog">
            Jelajahi Katalog
          </Link>
        </Empty>
      </div>
    );
  return (
    <div className="container page">
      <div className="steps">
        <strong>1 Keranjang</strong>
        <span>2 Data Reservasi</span>
        <span>3 Konfirmasi</span>
      </div>
      <Title
        title="Siapkan perjalananmu"
        description="Periksa perlengkapan dan jadwal sebelum reservasi."
      />
      <div className="checkout-grid">
        <div>
          <Dates compact />
          <Panel
            title="Perlengkapan dipilih"
            action={
              <Link className="text-button" to="/katalog">
                Tambah alat
              </Link>
            }
          >
            <CartLines lines={cart} setLines={setCart} />
            <Field label="Paket yang diterapkan">
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
          </Panel>
        </div>
        <Summary quote={quote} loading={loading}>
          {error ? <p className="error">{error}</p> : null}
          <Button
            className="full"
            disabled={!quote || loading}
            onClick={() => go(user ? "/reservasi" : "/masuk?next=/reservasi")}
          >
            Reservasi · DP 50%
          </Button>
          <Button variant="outline full" onClick={()=>go('/tanya-admin')}>Tanya Admin via WhatsApp</Button>
          <p className="muted">Bertanya belum menahan stok. Prioritas untuk DP yang lebih dahulu terverifikasi.</p>
        </Summary>
      </div>
      <Recommendations lines={cart} />
    </div>
  );
}
export function Reservation({inquiry=false}) {
 const {cart,setCart,dates,bundle,notify,user,items,settings}=useApp();
 const params=new URLSearchParams(location.search), vid=params.get('variant');
 const lines=inquiry&&vid?[{variant_id:vid,quantity:Math.max(1,Math.min(100,Number(params.get('qty'))||1))}]:cart;
 const [form,setForm]=useState({customer_name:user?.name||'',phone:'',address:'',identity_type:'KTP',note:''});
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const {quote,error,loading}=useQuote(lines,bundle,dates);
 const change=(k,v)=>setForm({...form,[k]:v});
 if(!lines.length)return <div className="container page"><Empty title="Pilih perlengkapan terlebih dahulu"><Link className="btn" to="/katalog">Buka Katalog</Link></Empty></div>;
 if(!inquiry&&!user)return <div className="container page"><Empty title="Masuk untuk reservasi" description="Simpan pesananmu dalam akun dan bayar DP 50% untuk mengamankan alat."><Link className="btn" to="/masuk?next=/reservasi">Masuk / Daftar</Link></Empty></div>;
 const text=`Halo Funniest Outdoor, saya ingin bertanya tentang sewa.\nNama: ${form.customer_name}\nWhatsApp: ${form.phone}\nAlamat: ${form.address}\nBarang:\n${lines.map(l=>{const p=items.find(p=>p.variants.some(v=>v.id===l.variant_id));return `${p?.name} (${p?.variants.find(v=>v.id===l.variant_id)?.label}) × ${l.quantity}`;}).join('\n')}\nTanggal ambil: ${fmt(dates.start)}, 10.00 WIB\nTanggal kembali: ${fmt(dates.end)}, 10.00 WIB\nJaminan saat ambil: ${form.identity_type}\nCatatan: ${form.note||'-'}\nSaya memahami bahwa chat belum menahan stok. Barang di-keep setelah DP 50% terverifikasi.`;
 return <div className="container page"><Title title={inquiry?'Tanya admin sebelum menyewa':'Lengkapi data & lanjutkan DP'} description={inquiry?'Isi data, lalu buka WhatsApp dengan pesan yang sudah disiapkan.':'Reservasi aktif setelah DP 50% terverifikasi. Sisa pembayaran saat pengambilan.'}/><form className="checkout-grid" onSubmit={async e=>{e.preventDefault();if(!consent)return;setErr('');if(!/^(08\d{8,12}|628\d{8,12})$/.test(form.phone.replace(/[\s()+-]/g,''))){setErr('Masukkan nomor WhatsApp Indonesia yang valid.');return;}if(inquiry){window.open(waLink(settings.phone,text),'_blank','noopener');return;}setBusy(true);try{const b=await api('/bookings',{...form,...datePayload(dates),items:lines,bundle_id:bundle});setCart([]);go('/booking/'+b.token);notify('Pesanan dibuat. Bayar DP agar reservasi aktif.');}catch(e){setErr(e.message);}finally{setBusy(false);}}}>
 <div><Panel title="Data penyewa"><div className="two-col"><Field label="Nama lengkap *" required minLength={2} maxLength={100} value={form.customer_name} onChange={e=>change('customer_name',e.target.value)}/><Field label="Nomor WhatsApp *" type="tel" required value={form.phone} onChange={e=>change('phone',e.target.value)}/></div><Field label="Alamat *"><textarea required minLength={5} maxLength={500} value={form.address} onChange={e=>change('address',e.target.value)}/></Field><Field label="Jaminan saat pengambilan"><select value={form.identity_type} onChange={e=>change('identity_type',e.target.value)}><option>KTP</option><option>SIM</option></select></Field><Field label="Catatan kebutuhan"><textarea maxLength={1000} value={form.note} onChange={e=>change('note',e.target.value)}/></Field></Panel><Panel title="Jadwal & perlengkapan"><Dates compact/>{lines.map(l=>{const p=items.find(p=>p.variants.some(v=>v.id===l.variant_id));return <p key={l.variant_id}>{p?.name} · {p?.variants.find(v=>v.id===l.variant_id)?.label} × {l.quantity}</p>;})}</Panel><Notice>Tanpa deposit Rp100.000. Bawa KTP/SIM asli sebagai jaminan saat mengambil barang. Jaminan dikembalikan setelah alat kembali dan biaya diselesaikan. Jangan unggah foto identitas.</Notice><label className="check-row"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>Saya menyetujui ketentuan sewa dan penggunaan data untuk mengurus pesanan ini.</label></div>
 <Summary quote={quote} loading={loading}>{(err||error)&&<p className="error" role="alert">{err||error}</p>}<Button className="full" type="submit" busy={busy} disabled={!consent||(!inquiry&&(!quote||loading))||dates.end<=dates.start}>{inquiry?'Buka WhatsApp Admin':'Buat Pesanan & Lanjut Bayar DP'}</Button><p className="muted">Chat dan pesanan tanpa DP belum menahan stok. Prioritas diberikan kepada pembayaran DP yang lebih dahulu terverifikasi.</p></Summary></form></div>;
}
export function BookingStatus({ token }) {
  const { data, error, refresh } = useResource("/booking/" + token,{pollMs:5000}),
    { notify } = useApp();
  if (error) return <Empty title={error} />;
  if (!data) return <Loading />;
  const b = data.booking,
    s = data.settings;
  return (
    <div className="container page status-page">
      <div className="success-mark">
        <CheckCircle2 size={42} />
      </div>
      <h1>{b.status === "pending" ? "Selesaikan DP untuk mengamankan alat" : "Reservasimu sudah tercatat!"}</h1>
      <p className="muted">
        Simpan kode dan tautan ini untuk melihat perkembangan pesanan.
      </p>
      <h2>{b.code}</h2>
      <Badge status={b.status} />
      <div className="checkout-grid">
        <Panel title="Detail reservasi">
          <div className="pair">
            <span>Penyewa</span>
            <strong>{b.customer_name}</strong>
          </div>
          <div className="pair">
            <span>Ambil</span>
            <strong>{fmt(b.start_at)}</strong>
          </div>
          <div className="pair">
            <span>Kembali</span>
            <strong>{fmt(b.end_at)}</strong>
          </div>
          {b.items.map((l) => (
            <div className="pair" key={l.variant_id}>
              <span>
                {l.name} · {l.label}
              </span>
              <strong>× {l.quantity}</strong>
            </div>
          ))}
          <hr />
          <Notice>{b.status==='pending'?`DP 50%: ${money(Math.ceil(b.rental/2))}. Belum di-keep; stok dicek kembali saat admin memverifikasi DP.`:'DP sudah tercatat, alat di-keep sesuai jadwal.'}</Notice>
          {b.status==='pending'&&<Panel title="Pembayaran DP via transfer">{s.bank_account?<><p>{s.bank_name} · <strong>{s.bank_account}</strong></p><p>Atas nama {s.bank_holder}</p><p>Transfer DP {money(Math.ceil(b.rental/2))}, lalu konfirmasi kepada admin dengan kode {b.code}. Admin memeriksa penerimaan dana sebelum mengaktifkan reservasi.</p></>:<p>Hubungi admin untuk cek ketersediaan terakhir dan memperoleh rekening DP. Pembayaran diverifikasi admin.</p>}</Panel>}
          <p className="muted">{s.address}</p>
          {s.phone ? (
            <a
              className="btn full"
              href={
                "https://wa.me/" +
                s.phone +
                "?text=" +
                encodeURIComponent(
                  `Halo Funniest Outdoor, saya ingin konfirmasi DP pesanan ${b.code}. Nama: ${b.customer_name}. Barang: ${b.items.map(l=>l.name+" × "+l.quantity).join(", ")}. Jadwal ${fmt(b.start_at)} – ${fmt(b.end_at)}. DP 50%: ${money(Math.ceil(b.rental/2))}. Mohon cek ketersediaan dan verifikasi pembayaran saya.`,
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              Konfirmasi melalui WhatsApp
            </a>
          ) : (
            <Notice>
              Staf akan mengonfirmasi reservasi. Nomor WhatsApp usaha belum
              diatur pada versi uji ini.
            </Notice>
          )}
          <div className="actions">
            <Button variant="outline" onClick={refresh}>
              Perbarui Status
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(location.href)
                  .then(() => notify("Tautan reservasi disalin."))
                  .catch(() => notify("Salin alamat halaman dari browser."))
              }
            >
              <Copy size={16} />
              Salin Tautan
            </Button>
          </div>
        </Panel>
        <Summary quote={b}>
          <Link className="btn full" to={"/nota/" + token}>
            Lihat Nota Digital
          </Link>
          <Link className="text-button" to="/">
            Kembali ke beranda
          </Link>
        </Summary>
      </div>
    </div>
  );
}
export function SocialLinks() {
 const {settings:s}=useApp();
 return <div className="social-links">{[['Instagram',s.instagram],['TikTok',s.tiktok],['Google Maps',s.maps],['WhatsApp',waLink(s.phone,'Halo Funniest Outdoor, saya ingin menanyakan sewa alat.')]].map(([label,url])=>url?<a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>:<span className="muted" key={label}>{label} · segera tersedia</span>)}</div>;
}
export function RentalGuide(){return <Panel title="Cara sewa di Funniest Outdoor"><div className="guide-grid">{[['Pilih alat & tanggal','Cek stok untuk jadwal perjalananmu dan masukkan alat ke keranjang.'],['Tanya atau reservasi','Tanya lewat WhatsApp tanpa login, atau masuk/daftar untuk membuat pesanan. Chat belum menahan stok.'],['Bayar DP 50%','Admin memverifikasi penerimaan DP. Barang baru di-keep setelah pembayaran terverifikasi dan stok tersedia.'],['Ambil & lunasi','Datang sesuai jadwal, lunasi sisa sewa, dan serahkan KTP/SIM asli sebagai jaminan.'],['Kembalikan tepat waktu','Admin memeriksa seluruh alat. Selesaikan biaya keterlambatan di tempat bila ada, lalu ambil kembali KTP/SIM.']].map(([t,d])=><div key={t}><h3>{t}</h3><p>{d}</p></div>)}</div></Panel>;}
export function About(){const {settings:s}=useApp();return <div className="container page"><Title title="Petualanganmu, kami siapkan perlengkapannya" description="Sewa perlengkapan outdoor dengan jadwal dan biaya yang jelas."/><RentalGuide/><div className="two-col"><Panel title="Basecamp & kontak"><p>{s.address}</p><p>{s.hours}</p><SocialLinks/></Panel><Panel title="Ketentuan sewa"><p>{s.terms}</p><p>Tanpa deposit uang. Jaminan KTP/SIM diserahkan saat pengambilan. Sisa sewa wajib dilunasi sebelum barang dibawa.</p><p>Belum bayar DP berarti belum di-keep. Prioritas untuk DP yang lebih dahulu terverifikasi sesuai ketersediaan.</p><p>{s.late_daily?`Biaya keterlambatan ${money(s.late_daily)} per hari per pesanan.`:'Biaya keterlambatan mengikuti jumlah tarif harian barang yang disewa per hari keterlambatan.'} Bagian hari dihitung satu hari. Biaya dibayar saat pengembalian sebelum jaminan diserahkan kembali.</p></Panel></div></div>;}
export function Login(){
 const {user,reload}=useApp(),[register,setRegister]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const requested=new URLSearchParams(location.search).get('next'),next=requested==='/reservasi'?requested:'/akun';
 useEffect(()=>{if(user)go(['admin','cashier'].includes(user.role)?'/admin':next);},[user]);
 return <div className="login-page"><Link to="/" className="login-back">Kembali ke beranda</Link><div className="login-story"><Brand/><h1>Perjalanan seru<br/>dimulai di sini.</h1><p>Temukan perlengkapanmu dan simpan rencana sewa dalam satu akun.</p></div><div className="login-form"><Brand/><h1>{register?'Buat akun perjalananmu':'Selamat datang kembali'}</h1><p className="muted">Masuk untuk melanjutkan perjalananmu bersama Funniest Outdoor.</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{if(register)await api('/register',{name,email,password});const r=await api('/login',{email,password});await reload();go(['admin','cashier'].includes(r.role)?'/admin':next);}catch(e){setError(e.message);}finally{setBusy(false);}}}>{register&&<Field label="Nama lengkap" required minLength={2} value={name} onChange={e=>setName(e.target.value)}/>}<Field label="Email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/><Field label="Kata sandi" type="password" autoComplete={register?'new-password':'current-password'} minLength={register?10:undefined} required value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p className="error" role="alert">{error}</p>}<Button className="full" type="submit" busy={busy}>{register?'Daftar & Masuk':'Masuk'}</Button></form><Button variant="outline full" onClick={()=>{setRegister(!register);setError('');}}>{register?'Sudah punya akun? Masuk':'Belum punya akun? Daftar'}</Button></div></div>;
}
export function CustomerAccount(){
 const {user,reload}=useApp();
 const r=useResource(user?'/my-bookings':null,{pollMs:5000});
 if(!user)return <div className="container page"><Empty title="Masuk untuk melihat riwayat reservasi"><Link className="btn" to="/masuk">Masuk / Daftar</Link></Empty></div>;
 return <div className="container page"><Title title={'Halo, '+user.name} description="Dashboard pelanggan · riwayat reservasi, pembayaran DP, dan pembaruan pesananmu."><Link className="btn" to="/katalog">Reservasi Baru</Link><Button variant="outline" onClick={async()=>{await api('/logout',{});await reload();go('/');}}>Keluar</Button></Title><LiveStatus updatedAt={r.updatedAt} error={r.error}/>
 {!r.data?<Loading/>:r.data.bookings.length?<section className="rental-list" aria-label="Riwayat reservasi">{r.data.bookings.map(b=><article className="rental-row" key={b.id}><div className="rental-main"><strong>{b.code}</strong><p className="rental-items">{b.items.map(l=>`${l.name} × ${l.quantity}`).join(' · ')}</p><small>{fmt(b.start_at)} – {fmt(b.end_at)}</small></div><div className="rental-state"><Badge status={b.status}/><strong className={b.payment_status==='unpaid'?'muted':'payment-ok'}>{b.payment_status==='paid'?'Lunas':b.payment_status==='dp_paid'?'DP terverifikasi':'Menunggu DP 50%'}</strong><small>Dibayar {money(b.paid)} · Sisa {money(Math.max(0,b.total-b.paid))}</small>{b.status==='confirmed'&&<small>Barang di-keep di toko, belum kamu ambil.</small>}{b.status==='rented'&&<small>Barang sudah dibawa. Kembalikan sesuai jadwal.</small>}</div><Link className="btn outline rental-detail" to={'/booking/'+b.token}>Detail & Pembayaran</Link></article>)}</section>:<Empty title="Belum ada reservasi" description="Pesanan yang dibuat setelah masuk akan tercatat di sini."/>}</div>;
}
export function Invoice({ token }) {
  const { data, error } = useResource("/invoice/" + token),
    { notify } = useApp();
  if (error) return <Empty title={error} />;
  if (!data) return <Loading />;
  const b = data.booking,
    s = data.settings;
  return (
    <div className="invoice-page">
      <div className="invoice-toolbar">
        <Brand />
        <div className="actions">
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard
                .writeText(location.href)
                .then(() => notify("Tautan nota disalin."))
                .catch(() => notify("Salin alamat nota dari browser."))
            }
          >
            <Copy size={17} />
            Salin Tautan
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={17} />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>
      <article className="receipt">
        <div className="panel-head">
          <Brand />
          <div>
            <h1>NOTA SEWA</h1>
            <small>{b.code}</small>
          </div>
        </div>
        <hr />
        <div className="two-col">
          <div>
            <small>DITUJUKAN KEPADA</small>
            <h3>{b.customer_name}</h3>
            <p>{b.phone}</p>
          </div>
          <div>
            <small>TERBIT {fmt(b.created_at)}</small>
            <p>
              <Badge status={b.status} />{" "}
              <Badge status={b.paid >= b.total ? "available" : "pending"}>
                {b.paid >= b.total
                  ? "Lunas"
                  : b.paid
                    ? "Dibayar sebagian"
                    : "Belum dibayar"}
              </Badge>
            </p>
          </div>
        </div>
        <div className="invoice-dates">
          <div>
            <small>AMBIL</small>
            <strong>{fmt(b.start_at)}, 10.00 WIB</strong>
          </div>
          <div>
            <small>KEMBALI</small>
            <strong>
              {fmt(b.end_at)} · {b.days} hari
            </strong>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Perlengkapan</th>
                <th>Jumlah</th>
                <th>Biaya sewa</th>
              </tr>
            </thead>
            <tbody>
              {b.items.map((l) => (
                <tr key={l.variant_id}>
                  <td>
                    <strong>{l.name}</strong>
                    <small>{l.label}</small>
                  </td>
                  <td>{l.quantity}</td>
                  <td>{money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="receipt-totals">
          {[
            ["Subtotal sewa", b.subtotal],
            ["Hemat paket", -b.discount],
            ["Biaya sewa bersih", b.rental],
            ["DP minimal 50%", Math.ceil(b.rental/2)],
            ["Total tagihan", b.total],
            ["Sudah diterima", b.paid],
            ["Sisa pembayaran", Math.max(0, b.total - b.paid)],
          ].map(([label, value]) => (
            <div
              className={"pair " + (label === "Total tagihan" ? "grand" : "")}
              key={label}
            >
              <span>{label}</span>
              <strong>{money(value)}</strong>
            </div>
          ))}
        </div>
        {b.return_details ? (
          <Notice>
            Biaya tambahan {money(b.return_details.fee)} · Pengembalian dana{" "}
            {money(
              b.return_details.deposit_returned ??
                b.return_details.cancelled_refund ??
                0,
            )}
            <p>{b.return_details.note}</p>
          </Notice>
        ) : null}
        <hr />
        <p className="muted">
          Tanpa deposit uang. Jaminan KTP/SIM diserahkan saat pengambilan dan dikembalikan setelah penyelesaian sewa.
        </p>
        <p className="receipt-thanks">
          Terima kasih sudah mempercayakan perjalananmu kepada {s.name}.
        </p>
        <small>
          {s.address}
          {s.phone ? " · " + s.phone : ""}
        </small>
      </article>
    </div>
  );
}
