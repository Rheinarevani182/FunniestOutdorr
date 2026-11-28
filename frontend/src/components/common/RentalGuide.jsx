import React from "react";
import { Panel } from "../ui";

export function RentalGuide() {
  return (
    <Panel title="Cara sewa di Funniest Outdoor">
      <div className="guide-grid">
        {[
          [
            "Pilih alat & tanggal",
            "Cek stok untuk jadwal perjalananmu dan masukkan alat ke keranjang.",
          ],
          [
            "Tanya atau reservasi",
            "Tanya lewat WhatsApp tanpa login, atau masuk/daftar untuk membuat pesanan. Chat belum menahan stok.",
          ],
          [
            "Bayar DP 50%",
            "Admin memverifikasi penerimaan DP. Barang baru di-keep setelah pembayaran terverifikasi dan stok tersedia.",
          ],
          [
            "Ambil & lunasi",
            "Datang sesuai jadwal, lunasi sisa sewa, dan serahkan KTP/SIM asli sebagai jaminan.",
          ],
          [
            "Kembalikan tepat waktu",
            "Admin memeriksa seluruh alat. Selesaikan biaya keterlambatan di tempat bila ada, lalu ambil kembali KTP/SIM.",
          ],
        ].map(([t, d]) => (
          <div key={t}>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}