import React from "react";
import { Mountain } from "lucide-react";
import { Link } from "./Link";

export function Brand() {
  return (
    <Link to="/" className="brand">
      <Mountain size={33} />
      <strong>Funniest Outdoor</strong>
    </Link>
  );
}