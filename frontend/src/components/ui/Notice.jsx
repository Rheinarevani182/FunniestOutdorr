import React from "react";
import { ShieldCheck } from "lucide-react";

export function Notice({ children }) {
  return (
    <div className="notice">
      <ShieldCheck size={20} />
      <div>{children}</div>
    </div>
  );
}