import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button, Field, Modal } from "../ui";
import { Photo } from "./Photo";

export function Choose({ product, onClose, onAdd, stock }) {
  const { availability, add } = useApp(),
    [vid, setVid] = useState(product.variants[0].id),
    [qty, setQty] = useState(1),
    v = (stock || availability).find((x) => x.id === vid);
  return (
    <Modal title={product.name} onClose={onClose}>
      <Photo product={product} className="modal-photo" />
      <p>Pilih ukuran / varian</p>
      <div className="variants">
        {product.variants.map((v) => (
          <button
            type="button"
            key={v.id}
            className={vid === v.id ? "active" : ""}
            onClick={() => setVid(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="muted">
        {v
          ? v.available + " unit tersedia untuk jadwalmu."
          : "Stok diperiksa saat transaksi disimpan."}
      </p>
      <Field
        label="Jumlah"
        type="number"
        min="1"
        max="100"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />
      <Button
        className="full"
        disabled={
          !Number.isInteger(qty) ||
          qty < 1 ||
          qty > 100 ||
          !v ||
          qty > v.available
        }
        onClick={() => {
          (onAdd || add)(vid, qty);
          onClose();
        }}
      >
        Tambahkan
      </Button>
    </Modal>
  );
}