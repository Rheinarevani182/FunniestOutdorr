import React, { useState } from "react";
import { CheckCircle2, Copy, Pencil } from "lucide-react";
import { Summary } from "../../components/booking";
import { Photo } from "../../components/product";
import {
  Badge,
  Button,
  Field,
  Link,
  Loading,
  Modal,
  Notice,
  Panel,
  Title,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useResource } from "../../hooks";
import { api } from "../../services/api";
import { fmt, invoiceText, money, reminderText, waLink } from "../../utils";
import { OrderEditor } from "./OrderEditor";

export function BookingDetail({ bookingId }) {
  const { data, error, refresh } = useResource("/bookings/" + bookingId, {
      pollMs: 5000,
    }),
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
          settled: checked,
          identity_returned: checked,
        });
      else
        await api(
          "/bookings/" + b.id,
          {
            status: action,
            refund_confirmed: checked,
            collateral_received: checked,
          },
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
        <Link className="btn outline" to={"/nota/" + b.token}>
          Nota Digital
        </Link>
        <a
          className="btn outline"
          href={waLink(b.phone, invoiceText(b))}
          target="_blank"
          rel="noreferrer"
        >
          Kirim Nota via WhatsApp
        </a>
        {["pending", "confirmed", "rented"].includes(b.status) ? (
          <Button variant="orange" onClick={() => setEditing(true)}>
            <Pencil size={17} />
            Edit Pesanan
          </Button>
        ) : null}
      </Title>
      <div className="checkout-grid">
        <div>
          {b.late_days > 0 && (
            <Panel title="Terlambat mengembalikan">
              <p>
                {b.late_days} hari × {money(b.late_rate)} ={" "}
                <strong>{money(b.late_fee)}</strong>
              </p>
              <p>
                Biaya dihitung sampai pengembalian, dibayar di tempat sebelum
                KTP/SIM diserahkan kembali.
              </p>
              <a
                className="btn orange"
                href={waLink(b.phone, reminderText(b))}
                target="_blank"
                rel="noreferrer"
              >
                Kirim Peringatan WhatsApp
              </a>
            </Panel>
          )}
          <Panel title="Pelanggan & jadwal">
            <p>Alamat: {b.address || "Belum dicatat"}</p>
            <p>
              Jaminan: {b.identity_type} ·{" "}
              {b.status === "returned"
                ? "Sudah dikembalikan"
                : b.collateral_received
                  ? "Dipegang admin"
                  : "Diserahkan saat pengambilan"}
            </p>
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
                  setAmount(
                    b.status === "pending"
                      ? Math.ceil(b.rental / 2)
                      : b.total - b.paid,
                  );
                  setAction("payment");
                }}
              >
                Catat Pembayaran
              </Button>
            ) : null}
            {b.status === "pending" && b.paid >= Math.ceil(b.rental / 2) ? (
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
              <Button
                variant="orange full"
                onClick={() => {
                  setFee(b.late_fee);
                  setNote(
                    b.late_days ? `Keterlambatan ${b.late_days} hari` : "",
                  );
                  setAction("return");
                }}
              >
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
            <a
              className="btn full"
              href={waLink(b.phone, invoiceText(b))}
              target="_blank"
              rel="noreferrer"
            >
              Kirim Nota ke WhatsApp Pelanggan
            </a>
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
                Seluruh barang kembali dan diperiksa, biaya tambahan telah
                dibayar di tempat, serta jaminan KTP/SIM sudah dikembalikan.
              </label>
            </>
          ) : action === "rented" ? (
            <>
              <Notice>
                Lunasi sisa sewa dan terima jaminan {b.identity_type} sebelum
                menyerahkan barang.
              </Notice>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                Kelengkapan diperiksa dan jaminan KTP/SIM telah diterima dari
                pelanggan.
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