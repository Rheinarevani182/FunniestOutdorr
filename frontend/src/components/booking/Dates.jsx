import React from "react";
import { CalendarDays, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { day, go } from "../../utils";
import { Button } from "../ui";

export function Dates({ dates, onChange, onSearch, compact = false }) {
  const ctx = useApp();
  dates = dates || ctx.dates;
  onChange = onChange || ctx.setDates;
  return (
    <div className={"date-bar " + (compact ? "compact" : "")}>
      <label>
        <CalendarDays />
        <span>
          <small>Tanggal Ambil</small>
          <input
            aria-label="Tanggal ambil"
            type="date"
            min={day()}
            value={dates.start}
            onChange={(e) => onChange({ ...dates, start: e.target.value })}
          />
        </span>
      </label>
      <label>
        <CalendarDays />
        <span>
          <small>Tanggal Kembali</small>
          <input
            aria-label="Tanggal kembali"
            type="date"
            min={dates.start}
            value={dates.end}
            onChange={(e) => onChange({ ...dates, end: e.target.value })}
          />
        </span>
      </label>
      {dates.end > dates.start ? (
        <small>
          {Math.ceil(
            (Date.parse(dates.end) - Date.parse(dates.start)) / 86400000,
          )}{" "}
          hari sewa
        </small>
      ) : (
        <small className="error">Periksa tanggal</small>
      )}
      {!compact ? (
        <Button
          disabled={dates.end <= dates.start}
          onClick={onSearch || (() => go("/katalog"))}
        >
          <Search size={18} />
          Cek Ketersediaan
        </Button>
      ) : null}
    </div>
  );
}