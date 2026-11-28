import React from "react";
import { LoaderCircle } from "lucide-react";

export function Loading() {
  return (
    <div className="empty">
      <LoaderCircle className="spin" />
      Memuat perlengkapanmu…
    </div>
  );
}