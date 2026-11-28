import React from "react";
import { Copy, Printer } from "lucide-react";
import {
  Badge,
  Brand,
  Button,
  Empty,
  Loading,
  Notice,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useResource } from "../../hooks";
import { fmt, money } from "../../utils";

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
            ["DP minimal 50%", Math.ceil(b.rental / 2)],
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
          Tanpa deposit uang. Jaminan KTP/SIM diserahkan saat pengambilan dan
          dikembalikan setelah penyelesaian sewa.
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