import React from "react";
import { LoaderCircle } from "lucide-react";

export function Button({
  children,
  variant = "",
  busy = false,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={"btn " + variant + " " + className}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy ? <LoaderCircle size={18} className="spin" /> : null}
      {children}
    </button>
  );
}