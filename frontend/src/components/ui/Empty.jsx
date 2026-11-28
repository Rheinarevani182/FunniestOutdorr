import React from "react";
import { Package } from "lucide-react";

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