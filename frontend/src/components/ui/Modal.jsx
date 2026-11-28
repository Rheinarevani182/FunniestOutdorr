import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.querySelector("button,input")?.focus();
    const f = (e) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const a = [
            ...ref.current.querySelectorAll(
              "button:not(:disabled),a,input,select,textarea",
            ),
          ],
          first = a[0],
          last = a.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    addEventListener("keydown", f);
    return () => {
      document.body.style.overflow = overflow;
      removeEventListener("keydown", f);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <div className="panel-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}