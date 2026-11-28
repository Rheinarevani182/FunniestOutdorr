import React, { useState } from "react";
import { Dates, Summary } from "../../components/booking";
import {
  Button,
  Empty,
  Field,
  Link,
  Notice,
  Panel,
  Title,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useQuote } from "../../hooks";
import { api } from "../../services/api";
import { datePayload, fmt, go, waLink } from "../../utils";

export function Reservation({ inquiry = false }) {
  const { cart, setCart, dates, bundle, notify, user, items, settings } =
    useApp();
  const params = new URLSearchParams(location.search),
    vid = params.get("variant");
  const lines =
    inquiry && vid
      ? [
          {
            variant_id: vid,
            quantity: Math.max(
              1,
              Math.min(100, Number(params.get("qty")) || 1),
            ),
          },
        ]
      : cart;
  const [form, setForm] = useState({
    customer_name: user?.name || "",
    phone: "",
    address: "",
    identity_type: "KTP",
    note: "",
  });
  const [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  const { quote, error, loading } = useQuote(lines, bundle, dates);
  const change = (k, v) => setForm({ ...form, [k]: v });
  if (!lines.length)
    return (
      <div className="container page">
        <Empty title="Pilih perlengkapan terlebih dahulu">
          <Link className="btn" to="/katalog">
            Buka Katalog
          </Link>
        </Empty>
      </div>
    );
  if (!inquiry && !user)
    return (
      <div className="container page">
        <Empty
          title="Masuk untuk reservasi"
          description="Simpan pesananmu dalam akun dan bayar DP 50% untuk mengamankan alat."
        >
          <Link className="btn" to="/masuk?next=/reservasi">
            Masuk / Daftar
          </Link>
        </Empty>
      </div>
    );
  const text = `Halo Funniest Outdoor, saya ingin bertanya tentang sewa.\nNama: ${form.customer_name}\nWhatsApp: ${form.phone}\nAlamat: ${form.address}\nBarang:\n${lines
    .map((l) => {
      const p = items.find((p) =>
        p.variants.some((v) => v.id === l.variant_id),
      );
      return `${p?.name} (${p?.variants.find((v) => v.id === l.variant_id)?.label}) × ${l.quantity}`;
    })
    .join(
      "\n",
    )}\nTanggal ambil: ${fmt(dates.start)}, 10.00 WIB\nTanggal kembali: ${fmt(dates.end)}, 10.00 WIB\nJaminan saat ambil: ${form.identity_type}\nCatatan: ${form.note || "-"}\nSaya memahami bahwa chat belum menahan stok. Barang di-keep setelah DP 50% terverifikasi.`;
  return (
    <div className="container page">
      <Title
        title={
          inquiry
            ? "Tanya admin sebelum menyewa"
            : "Lengkapi data & lanjutkan DP"
        }
        description={
          inquiry
            ? "Isi data, lalu buka WhatsApp dengan pesan yang sudah disiapkan."
            : "Reservasi aktif setelah DP 50% terverifikasi. Sisa pembayaran saat pengambilan."
        }
      />
      <form
        className="checkout-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!consent) return;
          setErr("");
          if (
            !/^(08\d{8,12}|628\d{8,12})$/.test(
              form.phone.replace(/[\s()+-]/g, ""),
            )
          ) {
            setErr("Masukkan nomor WhatsApp Indonesia yang valid.");
            return;
          }
          if (inquiry) {
            window.open(waLink(settings.phone, text), "_blank", "noopener");
            return;
          }
          setBusy(true);
          try {
            const b = await api("/bookings", {
              ...form,
              ...datePayload(dates),
              items: lines,
              bundle_id: bundle,
            });
            setCart([]);
            go("/booking/" + b.token);
            notify("Pesanan dibuat. Bayar DP agar reservasi aktif.");
          } catch (e) {
            setErr(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <Panel title="Data penyewa">
            <div className="two-col">
              <Field
                label="Nama lengkap *"
                required
                minLength={2}
                maxLength={100}
                value={form.customer_name}
                onChange={(e) => change("customer_name", e.target.value)}
              />
              <Field
                label="Nomor WhatsApp *"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => change("phone", e.target.value)}
              />
            </div>
            <Field label="Alamat *">
              <textarea
                required
                minLength={5}
                maxLength={500}
                value={form.address}
                onChange={(e) => change("address", e.target.value)}
              />
            </Field>
            <Field label="Jaminan saat pengambilan">
              <select
                value={form.identity_type}
                onChange={(e) => change("identity_type", e.target.value)}
              >
                <option>KTP</option>
                <option>SIM</option>
              </select>
            </Field>
            <Field label="Catatan kebutuhan">
              <textarea
                maxLength={1000}
                value={form.note}
                onChange={(e) => change("note", e.target.value)}
              />
            </Field>
          </Panel>
          <Panel title="Jadwal & perlengkapan">
            <Dates compact />
            {lines.map((l) => {
              const p = items.find((p) =>
                p.variants.some((v) => v.id === l.variant_id),
              );
              return (
                <p key={l.variant_id}>
                  {p?.name} ·{" "}
                  {p?.variants.find((v) => v.id === l.variant_id)?.label} ×{" "}
                  {l.quantity}
                </p>
              );
            })}
          </Panel>
          <Notice>
            Tanpa deposit Rp100.000. Bawa KTP/SIM asli sebagai jaminan saat
            mengambil barang. Jaminan dikembalikan setelah alat kembali dan
            biaya diselesaikan. Jangan unggah foto identitas.
          </Notice>
          <label className="check-row">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Saya menyetujui ketentuan sewa dan penggunaan data untuk mengurus
            pesanan ini.
          </label>
        </div>
        <Summary quote={quote} loading={loading}>
          {(err || error) && (
            <p className="error" role="alert">
              {err || error}
            </p>
          )}
          <Button
            className="full"
            type="submit"
            busy={busy}
            disabled={
              !consent ||
              (!inquiry && (!quote || loading)) ||
              dates.end <= dates.start
            }
          >
            {inquiry ? "Buka WhatsApp Admin" : "Buat Pesanan & Lanjut Bayar DP"}
          </Button>
          <p className="muted">
            Chat dan pesanan tanpa DP belum menahan stok. Prioritas diberikan
            kepada pembayaran DP yang lebih dahulu terverifikasi.
          </p>
        </Summary>
      </form>
    </div>
  );
}