import React from "react";
import { fmt, money } from "../../utils";

export function Chart({ data }) {
  const max = Math.max(1, ...data.map((x) => x.amount));
  return (
    <div className="chart">
      {data.map((d) => (
        <div className="chart-bar" key={d.date}>
          <small>{d.amount ? money(d.amount) : ""}</small>
          <div className="bar-track">
            <span
              title={fmt(d.date) + ": " + money(d.amount)}
              style={{ height: Math.max(2, (d.amount / max) * 100) + "%" }}
            />
          </div>
          <small>
            {new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })}
          </small>
        </div>
      ))}
    </div>
  );
}