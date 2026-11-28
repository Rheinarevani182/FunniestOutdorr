import React from "react";
import { fmt, money } from "../../utils";
import { Badge, Empty, Link } from "../ui";

export function BookTable({ rows, invoice = false }) {
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