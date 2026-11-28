import React from "react";
import { Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { money } from "../../utils";
import { Badge, Link } from "../ui";
import { Photo } from "./Photo";

export function ProductCard({ product, onAdd, stock }) {
  const { availability, add, choose } = useApp();
  const vs = (stock || availability).filter((v) => v.item_id === product.id);
  const ready = vs.some((v) => v.available > 0);
  const action = () =>
    onAdd
      ? onAdd(product)
      : product.variants.length > 1
        ? choose(product)
        : add(product.variants[0].id);
  const content = (
    <>
      <Photo product={product} />
      {!ready && <span className="stock-ribbon">Habis tersewa</span>}
      <div className="product-body">
        <div className="row spread">
          <small>{product.category}</small>
          <Badge status={ready ? "available" : "cancelled"}>
            {ready ? "Tersedia" : "Tidak tersedia"}
          </Badge>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description.split(".")[0]}.</p>
        <div className="row spread">
          <div>
            <strong className="price">{money(product.price)}</strong>
            <small> / hari</small>
          </div>
          <span className="add-btn" aria-hidden="true">
            <Plus size={20} />
          </span>
        </div>
      </div>
    </>
  );
  if (onAdd)
    return (
      <button
        type="button"
        className="product-card pos-card"
        disabled={!ready}
        onClick={action}
        aria-label={"Tambah " + product.name}
      >
        {content}
      </button>
    );
  return (
    <article className="product-card">
      <Link to={"/produk/" + product.id}>
        <Photo product={product} />
      </Link>
      <div className="product-body">
        <div className="row spread">
          <small>{product.category}</small>
          <Badge status={ready ? "available" : "cancelled"}>
            {ready ? "Tersedia" : "Habis"}
          </Badge>
        </div>
        <Link to={"/produk/" + product.id}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.description.split(".")[0]}.</p>
        <div className="row spread">
          <div>
            <strong className="price">{money(product.price)}</strong>
            <small> / hari</small>
          </div>
          <button
            type="button"
            className="add-btn"
            disabled={!ready}
            aria-label={"Tambah " + product.name}
            onClick={action}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}