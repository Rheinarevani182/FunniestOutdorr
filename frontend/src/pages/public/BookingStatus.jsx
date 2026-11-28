import React from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { Summary } from "../../components/booking";
import {
  Badge,
  Button,
  Empty,
  Link,
  Loading,
  Notice,
  Panel,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useResource } from "../../hooks";
import { fmt, money } from "../../utils";

export function BookingStatus({ token }) {
  const { data, error, refresh } = useResource("/booking/" + token, {
      pollMs: 5000,
    }),
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
      <h1>
        {b.status === "pending"
          ? "Selesaikan DP untuk mengamankan alat"
          : "Reservasimu sudah tercatat!"}
      </h1>
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
          <Notice>
            {b.status === "pending"
              ? `DP 50%: ${money(Math.ceil(b.rental / 2))}. Belum di-keep; stok dicek kembali saat admin memverifikasi DP.`
              : "DP sudah tercatat, alat di-keep sesuai jadwal."}
          </Notice>
          {b.status === "pending" && (
            <Panel title="Pembayaran DP via transfer">
              {s.bank_account ? (
                <>
                  <p>
                    {s.bank_name} · <strong>{s.bank_account}</strong>
                  </p>
                  <p>Atas nama {s.bank_holder}</p>
                  <p>
                    Transfer DP {money(Math.ceil(b.rental / 2))}, lalu
                    konfirmasi kepada admin dengan kode {b.code}. Admin
                    memeriksa penerimaan dana sebelum mengaktifkan reservasi.
                  </p>
                </>
              ) : (
                <p>
                  Hubungi admin untuk cek ketersediaan terakhir dan memperoleh
                  rekening DP. Pembayaran diverifikasi admin.
                </p>
              )}
            </Panel>
          )}
          <p className="muted">{s.address}</p>
          {s.phone ? (
            <a
              className="btn full"
              href={
                "https://wa.me/" +
                s.phone +
                "?text=" +
                encodeURIComponent(
                  `Halo Funniest Outdoor, saya ingin konfirmasi DP pesanan ${b.code}. Nama: ${b.customer_name}. Barang: ${b.items.map((l) => l.name + " × " + l.quantity).join(", ")}. Jadwal ${fmt(b.start_at)} – ${fmt(b.end_at)}. DP 50%: ${money(Math.ceil(b.rental / 2))}. Mohon cek ketersediaan dan verifikasi pembayaran saya.`,
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