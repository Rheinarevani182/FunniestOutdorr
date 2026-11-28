import React from "react";
import { Package } from "lucide-react";
import { Link } from "../ui";

export function Metric({ label, value, description, icon: I = Package }) {
  return (
    <Link
      to={
        label.includes("Pendapatan")
          ? "/admin/analisis"
          : label.includes("Reservasi")
            ? "/admin/reservasi"
            : label.includes("disewa") || label.includes("kembali")
              ? "/admin/disewa?status=rented"
              : label.includes("Pesanan")
                ? "/admin/pesanan"
                : "/admin/inventaris"
      }
      className="metric metric-link"
    >
      <div>
        <span>{label}</span>
        <I size={20} />
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </Link>
  );
}