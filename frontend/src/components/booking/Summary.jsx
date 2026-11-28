import React from "react";
import { money } from "../../utils";
import { Panel } from "../ui";

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
          <div className="pair grand">
            <span>Total sewa</span>
            <strong>{money(quote.total)}</strong>
          </div>
          <div className="pair">
            <span>DP minimal 50%</span>
            <strong>{money(Math.ceil(quote.rental / 2))}</strong>
          </div>
          <p className="muted">
            Tanpa deposit uang. Serahkan KTP/SIM saat mengambil alat. Barang
            di-keep setelah DP terverifikasi; sisa sewa dilunasi saat
            pengambilan.
          </p>
        </>
      ) : (
        <p className="muted">Tambahkan perlengkapan untuk menghitung total.</p>
      )}
      {children}
    </Panel>
  );
}