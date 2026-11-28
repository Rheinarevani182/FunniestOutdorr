import React from "react";
import { cats } from "../../constants";

export function Categories({ value, onChange }) {
  return (
    <div className="categories">
      {cats.map(([c, I]) => (
        <button
          type="button"
          key={c}
          className={value === c ? "active" : ""}
          onClick={() => onChange(c)}
        >
          <I size={18} />
          {c}
        </button>
      ))}
    </div>
  );
}