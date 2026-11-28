import React from "react";
import { statusLabels } from "../../constants";

export function Badge({ status, children }) {
  return (
    <span className={"badge " + status}>
      {children || statusLabels[status]}
    </span>
  );
}