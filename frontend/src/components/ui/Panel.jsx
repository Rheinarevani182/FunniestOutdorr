import React from "react";

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={"panel " + className}>
      {title ? (
        <div className="panel-head">
          <h3>{title}</h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}