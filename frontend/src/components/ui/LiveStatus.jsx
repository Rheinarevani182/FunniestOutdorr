import React from "react";

export function LiveStatus({ updatedAt, error }) {
  return (
    <p className={"live-status " + (error ? "error" : "muted")} role="status">
      {error
        ? "Pembaruan terputus: " + error
        : updatedAt
          ? "Terakhir diperbarui " +
            updatedAt.toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
            }) +
            " WIB · otomatis setiap 5 detik"
          : "Mengambil data terbaru…"}
    </p>
  );
}