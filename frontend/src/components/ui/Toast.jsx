import React from "react";
import { CheckCircle2, X } from "lucide-react";

export function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={20} />
      {message}
      <button type="button" aria-label="Tutup notifikasi" onClick={onClose}>
        <X size={17} />
      </button>
    </div>
  );
}