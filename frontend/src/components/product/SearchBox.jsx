import React from "react";
import { Search, Sparkles } from "lucide-react";

export function SearchBox({ value, onChange, onSearch }) {
  return (
    <form
      className="smart-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.();
      }}
    >
      <span>
        <Sparkles size={16} />
        Pencarian pintar
      </span>
      <input
        aria-label="Cari perlengkapan"
        placeholder="Cari perlengkapan atau ceritakan rencana pendakianmu…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" className="icon-btn" aria-label="Cari">
        <Search size={22} />
      </button>
    </form>
  );
}