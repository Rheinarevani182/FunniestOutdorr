import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Mountain,
  Plus,
  Minus,
  X,
  CheckCircle2,
  LoaderCircle,
  Package,
  Tent,
  Backpack,
  Armchair,
  Footprints,
  Wind,
  ShieldCheck,
  Flame,
  Utensils,
  Lightbulb,
  CalendarDays,
  Search,
} from "lucide-react";
export const C = createContext(),
  useApp = () => useContext(C),
  money = (v) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(v || 0),
  fmt = (d) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }),
  day = (n = 0) =>
    new Date(Date.now() + n * 86400000 + 7 * 3600000)
      .toISOString()
      .slice(0, 10),
  defaultDates = { start: day(1), end: day(3) },
  datePayload = (d) => ({
    start_at: d.start + "T10:00:00+07:00",
    end_at: d.end + "T10:00:00+07:00",
  });
export const cats = [
    ["Semua", Package],
    ["Tenda", Tent],
    ["Carrier", Backpack],
    ["Sepatu", Footprints],
    ["Kursi", Armchair],
    ["Perlengkapan", Package],
  ],
  statusLabels = {
    pending: "Menunggu DP",
    confirmed: "Di-keep · belum diambil",
    rented: "Dibawa · belum kembali",
    returned: "Selesai",
    cancelled: "Dibatalkan",
  };
export async function api(path, body, method) {
  const r = await fetch("/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const p = await r.json();
  if (!r.ok) throw new Error(p.error || "Permintaan gagal.");
  return p;
}
export function go(to) {
  history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function usePath() {
  const [p, set] = useState(location.pathname);
  useEffect(() => {
    const f = () => {
      set(location.pathname);
      window.scrollTo(0, 0);
    };
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  return p;
}
export function Link({ to, children, className = "", ...rest }) {
  return (
    <a
      href={to}
      className={className}
      {...rest}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          go(to);
        }
      }}
    >
      {children}
    </a>
  );
}
export function Button({
  children,
  variant = "",
  busy = false,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={"btn " + variant + " " + className}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy ? <LoaderCircle size={18} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand">
      <Mountain size={33} />
      <strong>Funniest Outdoor</strong>
    </Link>
  );
}
export function Badge({ status, children }) {
  return (
    <span className={"badge " + status}>
      {children || statusLabels[status]}
    </span>
  );
}
export function Loading() {
  return (
    <div className="empty">
      <LoaderCircle className="spin" />
      Memuat perlengkapanmu…
    </div>
  );
}
export function Empty({
  title = "Belum ada data",
  description = "",
  children,
}) {
  return (
    <div className="empty">
      <Package size={36} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Notice({ children }) {
  return (
    <div className="notice">
      <ShieldCheck size={20} />
      <div>{children}</div>
    </div>
  );
}
export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={"panel " + className}>
      {title ? (
        <div className="panel-head">
          <h3>{title}</h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
export function Title({ title, description, children }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.querySelector("button,input")?.focus();
    const f = (e) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const a = [
            ...ref.current.querySelectorAll(
              "button:not(:disabled),a,input,select,textarea",
            ),
          ],
          first = a[0],
          last = a.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    addEventListener("keydown", f);
    return () => {
      document.body.style.overflow = overflow;
      removeEventListener("keydown", f);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <div className="panel-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
const icons = [
  Footprints,
  Backpack,
  Armchair,
  Tent,
  Wind,
  ShieldCheck,
  Flame,
  Utensils,
  Lightbulb,
  Footprints,
  Wind,
  ShieldCheck,
];
export function Photo({ product, className = "" }) {
  const i = Number(product?.image) || 0,
    I = icons[i] || Tent;
  return (
    <div className={"photo " + className}>
      {product?.photo_url ? <img className="uploaded-photo" src={product.photo_url} alt={product.name} loading="lazy" /> : i < 4 ? (
        <img
          src="/assets/gear.jpg"
          alt={product?.name || "Perlengkapan outdoor"}
          loading="lazy"
          style={{
            left: -(i % 2) * 100 + "%",
            top: -Math.floor(i / 2) * 100 + "%",
          }}
        />
      ) : (
        <div className="gear-icon">
          <I size={80} strokeWidth={1.1} />
          <span>{product?.category}</span>
        </div>
      )}
    </div>
  );
}
export function Categories({ value, onChange }) {
  return (
    <div className="categories">
      {cats.map(([c, I]) => (
        <button
          type="button"
          key={c}
          className={value === c ? "active" : ""}
          onClick={() => onChange(c)}
        >
          <I size={18} />
          {c}
        </button>
      ))}
    </div>
  );
}
export function Dates({ dates, onChange, onSearch, compact = false }) {
  const ctx = useApp();
  dates = dates || ctx.dates;
  onChange = onChange || ctx.setDates;
  return (
    <div className={"date-bar " + (compact ? "compact" : "")}>
      <label>
        <CalendarDays />
        <span>
          <small>Tanggal Ambil</small>
          <input
            aria-label="Tanggal ambil"
            type="date"
            min={day()}
            value={dates.start}
            onChange={(e) => onChange({ ...dates, start: e.target.value })}
          />
        </span>
      </label>
      <label>
        <CalendarDays />
        <span>
          <small>Tanggal Kembali</small>
          <input
            aria-label="Tanggal kembali"
            type="date"
            min={dates.start}
            value={dates.end}
            onChange={(e) => onChange({ ...dates, end: e.target.value })}
          />
        </span>
      </label>
      {dates.end > dates.start ? (
        <small>
          {Math.ceil(
            (Date.parse(dates.end) - Date.parse(dates.start)) / 86400000,
          )}{" "}
          hari sewa
        </small>
      ) : (
        <small className="error">Periksa tanggal</small>
      )}
      {!compact ? (
        <Button
          disabled={dates.end <= dates.start}
          onClick={onSearch || (() => go("/katalog"))}
        >
          <Search size={18} />
          Cek Ketersediaan
        </Button>
      ) : null}
    </div>
  );
}
export function useResource(path, {pollMs=0}={}) {
 const [state,setState]=useState({path:null,data:null,error:'',updatedAt:null});
 const [tick,setTick]=useState(0);
 useEffect(()=>{
  if(!path)return;
  let alive=true, pending=false;
  const refresh=async()=>{
   if(pending)return;pending=true;
   try{const data=await api(path);if(alive)setState({path,data,error:'',updatedAt:new Date()});}
   catch(e){if(alive)setState(prev=>prev.path===path?{...prev,error:e.message}:{path,data:null,error:e.message,updatedAt:null});}
   finally{pending=false;}
  };
  const wake=()=>{if(document.visibilityState==='visible')refresh();};
  refresh();
  const timer=pollMs?setInterval(wake,pollMs):null;
  addEventListener('focus',wake);addEventListener('online',wake);document.addEventListener('visibilitychange',wake);
  return()=>{alive=false;clearInterval(timer);removeEventListener('focus',wake);removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake);};
 },[path,pollMs,tick]);
 return {data:state.path===path?state.data:null,error:state.path===path?state.error:'',updatedAt:state.path===path?state.updatedAt:null,refresh:()=>setTick(n=>n+1)};
}
export function LiveStatus({updatedAt,error}){return <p className={'live-status '+(error?'error':'muted')} role="status">{error?'Pembaruan terputus: '+error:updatedAt?'Terakhir diperbarui '+updatedAt.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB · otomatis setiap 5 detik':'Mengambil data terbaru…'}</p>;}
export function useQuote(lines, bundle, dates, exclude) {
  const [data, set] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const key = JSON.stringify({
    items: lines,
    bundle_id: bundle,
    ...datePayload(dates),
    exclude_id: exclude,
  });
  useEffect(() => {
    let alive = true;
    set(null);
    setError("");
    if (!lines.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(
      () =>
        api("/quote", JSON.parse(key))
          .then((q) => alive && set(q))
          .catch((e) => alive && setError(e.message))
          .finally(() => alive && setLoading(false)),
      150,
    );
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [key]);
  return { quote: data, error, loading };
}
export function Summary({ quote, loading, children }) {
  return (
    <Panel title="Ringkasan sewa" className="summary">
      {loading ? (
        <p className="muted">Menghitung total…</p>
      ) : quote ? (
        <>
          <div className="pair">
            <span>Durasi sewa</span>
            <strong>{quote.days} hari</strong>
          </div>
          <div className="pair">
            <span>Subtotal sewa</span>
            <strong>{money(quote.subtotal)}</strong>
          </div>
          {quote.discount > 0 ? (
            <div className="pair">
              <span>Hemat paket</span>
              <strong>− {money(quote.discount)}</strong>
            </div>
          ) : null}
          <div className="pair grand"><span>Total sewa</span><strong>{money(quote.total)}</strong></div>
          <div className="pair"><span>DP minimal 50%</span><strong>{money(Math.ceil(quote.rental/2))}</strong></div>
          <p className="muted">Tanpa deposit uang. Serahkan KTP/SIM saat mengambil alat. Barang di-keep setelah DP terverifikasi; sisa sewa dilunasi saat pengambilan.</p>
        </>
      ) : (
        <p className="muted">Tambahkan perlengkapan untuk menghitung total.</p>
      )}
      {children}
    </Panel>
  );
}
export function CartLines({ lines, setLines }) {
  const { items } = useApp();
  const change = (id, n) =>
    setLines(
      lines
        .map((x) => (x.variant_id === id ? { ...x, quantity: n } : x))
        .filter((x) => x.quantity > 0),
    );
  return (
    <div className="cart-lines">
      {lines.map((l) => {
        const p = items.find((p) =>
            p.variants.some((v) => v.id === l.variant_id),
          ),
          v = p?.variants.find((v) => v.id === l.variant_id);
        return (
          <div className="cart-line" key={l.variant_id}>
            <Photo product={p} />
            <div className="cart-info">
              <strong>{p?.name || "Produk tidak tersedia"}</strong>
              <small>
                {v?.label} · {money(p?.price)} / hari
              </small>
              <button
                type="button"
                className="text-button danger"
                onClick={() => change(l.variant_id, 0)}
              >
                Hapus
              </button>
            </div>
            <div className="quantity">
              <button
                type="button"
                aria-label={"Kurangi " + p?.name}
                onClick={() => change(l.variant_id, l.quantity - 1)}
              >
                <Minus size={15} />
              </button>
              <input
                aria-label={"Jumlah " + p?.name}
                type="number"
                min="1"
                max="100"
                value={l.quantity}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 1 && n <= 100) change(l.variant_id, n);
                }}
              />
              <button
                type="button"
                aria-label={"Tambah " + p?.name}
                onClick={() =>
                  change(l.variant_id, Math.min(100, l.quantity + 1))
                }
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function ProductCard({product,onAdd,stock}) {
 const {availability,add,choose}=useApp();
 const vs=(stock||availability).filter(v=>v.item_id===product.id);
 const ready=vs.some(v=>v.available>0);
 const action=()=>onAdd?onAdd(product):product.variants.length>1?choose(product):add(product.variants[0].id);
 const content=<><Photo product={product}/>{!ready&&<span className="stock-ribbon">Habis tersewa</span>}<div className="product-body"><div className="row spread"><small>{product.category}</small><Badge status={ready?'available':'cancelled'}>{ready?'Tersedia':'Tidak tersedia'}</Badge></div><h3>{product.name}</h3><p>{product.description.split('.')[0]}.</p><div className="row spread"><div><strong className="price">{money(product.price)}</strong><small> / hari</small></div><span className="add-btn" aria-hidden="true"><Plus size={20}/></span></div></div></>;
 if(onAdd)return <button type="button" className="product-card pos-card" disabled={!ready} onClick={action} aria-label={'Tambah '+product.name}>{content}</button>;
 return <article className="product-card"><Link to={'/produk/'+product.id}><Photo product={product}/></Link><div className="product-body"><div className="row spread"><small>{product.category}</small><Badge status={ready?'available':'cancelled'}>{ready?'Tersedia':'Habis'}</Badge></div><Link to={'/produk/'+product.id}><h3>{product.name}</h3></Link><p>{product.description.split('.')[0]}.</p><div className="row spread"><div><strong className="price">{money(product.price)}</strong><small> / hari</small></div><button type="button" className="add-btn" disabled={!ready} aria-label={'Tambah '+product.name} onClick={action}><Plus size={20}/></button></div></div></article>;
}
export function Choose({ product, onClose, onAdd, stock }) {
  const { availability, add } = useApp(),
    [vid, setVid] = useState(product.variants[0].id),
    [qty, setQty] = useState(1),
    v = (stock || availability).find((x) => x.id === vid);
  return (
    <Modal title={product.name} onClose={onClose}>
      <Photo product={product} className="modal-photo" />
      <p>Pilih ukuran / varian</p>
      <div className="variants">
        {product.variants.map((v) => (
          <button
            type="button"
            key={v.id}
            className={vid === v.id ? "active" : ""}
            onClick={() => setVid(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="muted">
        {v
          ? v.available + " unit tersedia untuk jadwalmu."
          : "Stok diperiksa saat transaksi disimpan."}
      </p>
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
          (!v || qty > v.available)
        }
        onClick={() => {
          (onAdd || add)(vid, qty);
          onClose();
        }}
      >
        Tambahkan
      </Button>
    </Modal>
  );
}
export function csv(name, rows) {
  const blob = new Blob(
      [
        "\ufeff" +
          rows
            .map((r) =>
              r
                .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
                .join(","),
            )
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    ),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const waLink=(phone,text)=>'https://wa.me/'+String(phone||'').replace(/^0/,'62').replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(text);
export const invoiceText=b=>`Halo ${b.customer_name}, berikut nota digital ${b.code} dari Funniest Outdoor.\n${b.items.map(l=>`${l.name} (${l.label}) × ${l.quantity}`).join('\n')}\nSewa: ${fmt(b.start_at)} – ${fmt(b.end_at)}\nTotal: ${money(b.total)}\nDibayar: ${money(b.paid)}\nSisa: ${money(Math.max(0,b.total-b.paid))}\n${location.origin}/nota/${b.token}\nJaminan KTP/SIM diserahkan saat pengambilan dan dikembalikan setelah penyelesaian sewa.`;
export const reminderText=b=>`Halo ${b.customer_name}, pengingat pengembalian ${b.code} dari Funniest Outdoor.\nBarang: ${b.items.map(l=>`${l.name} (${l.label}) × ${l.quantity}`).join(', ')}.\nBatas kembali: ${fmt(b.end_at)}, 10.00 WIB.\nTerlambat ${b.late_days} hari. Tarif keterlambatan: ${money(b.late_rate)}/hari. Total biaya keterlambatan saat ini: ${money(b.late_fee)}.\nMohon segera kembalikan perlengkapan. Biaya keterlambatan dibayar di tempat saat pengembalian, kemudian jaminan KTP/SIM diserahkan kembali. Biaya diperbarui mengikuti waktu pengembalian.`;
export async function productPhoto(file) {
 if(!file)return '';
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Pilih foto JPG, PNG, atau WebP.');
 if(file.size>20000000)throw Error('Ukuran foto maksimal 20 MB.');
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'}), scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height));
 const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();
 let uri=c.toDataURL('image/jpeg',.72); if(uri.length>400000)uri=c.toDataURL('image/jpeg',.4);
 if(uri.length>400000)throw Error('Foto masih terlalu besar, pilih gambar yang lebih sederhana.');return uri;
}
