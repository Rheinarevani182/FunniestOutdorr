import React from "react";
import { RentalGuide } from "../../components/common";
import { SocialLinks } from "../../components/layout";
import { Panel, Title } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { money } from "../../utils";

export function About() {
  const { settings: s } = useApp();
  return (
    <div className="container page">
      <Title
        title="Petualanganmu, kami siapkan perlengkapannya"
        description="Sewa perlengkapan outdoor dengan jadwal dan biaya yang jelas."
      />
      <RentalGuide />
      <div className="two-col">
        <Panel title="Basecamp & kontak">
          <p>{s.address}</p>
          <p>{s.hours}</p>
          <SocialLinks />
        </Panel>
        <Panel title="Ketentuan sewa">
          <p>{s.terms}</p>
          <p>
            Tanpa deposit uang. Jaminan KTP/SIM diserahkan saat pengambilan.
            Sisa sewa wajib dilunasi sebelum barang dibawa.
          </p>
          <p>
            Belum bayar DP berarti belum di-keep. Prioritas untuk DP yang lebih
            dahulu terverifikasi sesuai ketersediaan.
          </p>
          <p>
            {s.late_daily
              ? `Biaya keterlambatan ${money(s.late_daily)} per hari per pesanan.`
              : "Biaya keterlambatan mengikuti jumlah tarif harian barang yang disewa per hari keterlambatan."}{" "}
            Bagian hari dihitung satu hari. Biaya dibayar saat pengembalian
            sebelum jaminan diserahkan kembali.
          </p>
        </Panel>
      </div>
    </div>
  );
}