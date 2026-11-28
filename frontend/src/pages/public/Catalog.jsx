import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Dates } from "../../components/booking";
import { ProductCard, SearchBox } from "../../components/product";
import { Button, Empty, Field, Link, Modal, Title } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { money } from "../../utils";

export function Catalog() {
  const { items, availability } = useApp(),
    params = new URLSearchParams(location.search),
    [q, setQ] = useState(params.get("q") || ""),
    [cat, setCat] = useState(params.get("category") || "Semua"),
    [max, setMax] = useState(150000),
    [only, setOnly] = useState(false),
    [sort, setSort] = useState("popular"),
    [result, setResult] = useState(null),
    [searching, setSearching] = useState(false),
    [filters, setFilters] = useState(false);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!q.trim()) {
        setResult(null);
        return;
      }
      setSearching(true);
      api("/search", { query: q })
        .then((x) => alive && setResult(x))
        .catch(
          () =>
            alive &&
            setResult({
              ids: items
                .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
                .map((p) => p.id),
              mode: "keyword-fallback",
            }),
        )
        .finally(() => alive && setSearching(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);
  let list = items.filter(
    (p) =>
      p.active &&
      (cat === "Semua" || p.category === cat) &&
      p.price <= max &&
      (!only ||
        availability.some((v) => v.item_id === p.id && v.available > 0)) &&
      (!result || result.ids.includes(p.id)),
  );
  if (result)
    list.sort((a, b) => result.ids.indexOf(a.id) - result.ids.indexOf(b.id));
  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);
  const reset = () => {
    setQ("");
    setCat("Semua");
    setOnly(false);
    setMax(150000);
  };
  const filter = (group) => (
    <>
      <h3>Filter perlengkapan</h3>
      <h4>Kategori</h4>
      {["Semua", "Tenda", "Carrier", "Sepatu", "Kursi", "Perlengkapan"].map(
        (c) => (
          <label className="check-row" key={c}>
            <input
              type="radio"
              name={"category-" + group}
              checked={cat === c}
              onChange={() => setCat(c)}
            />
            {c}
            <small>
              {c === "Semua"
                ? items.length
                : items.filter((p) => p.category === c).length}
            </small>
          </label>
        ),
      )}
      <hr />
      <Field label={"Harga maksimum / hari: " + money(max)}>
        <input
          type="range"
          min="10000"
          max="150000"
          step="5000"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
        />
      </Field>
      <label className="check-row">
        <input
          type="checkbox"
          checked={only}
          onChange={(e) => setOnly(e.target.checked)}
        />
        Hanya yang tersedia
      </label>
      <Button variant="outline full" onClick={reset}>
        Reset filter
      </Button>
    </>
  );
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Beranda</Link> / Katalog
      </div>
      <Title
        title="Temukan perlengkapanmu"
        description="Atur tanggal sewa untuk melihat stok sesuai jadwal."
      />
      <Dates onSearch={() => {}} />
      <div className="catalog-layout">
        <aside className="panel catalog-filter">{filter("side")}</aside>
        <div>
          <SearchBox value={q} onChange={setQ} />
          <div className="toolbar">
            <span>
              {searching ? "Mencari…" : list.length + " perlengkapan"}
            </span>
            <div className="actions">
              <Button
                variant="outline mobile-filter"
                onClick={() => setFilters(true)}
              >
                Filter
              </Button>
              <select
                aria-label="Urutkan produk"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="popular">Rekomendasi</option>
                <option value="low">Harga terendah</option>
                <option value="high">Harga tertinggi</option>
              </select>
            </div>
          </div>
          {q && result ? (
            <p className="muted search-mode">
              <Sparkles size={15} />
              {result.suggestions?.length
                ? "Mungkin yang kamu cari:"
                : "Hasil pencarian katalog"}
              {result.suggestions?.map((t) => (
                <button key={t} className="text-button" onClick={() => setQ(t)}>
                  {t}
                </button>
              ))}
            </p>
          ) : null}
          {list.length ? (
            <div className="product-grid catalog-grid">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="Belum ada perlengkapan yang cocok"
              description="Coba kata kunci, filter, atau tanggal lain."
            >
              <Button onClick={reset}>Reset pencarian</Button>
            </Empty>
          )}
        </div>
      </div>
      {filters ? (
        <Modal title="Filter katalog" onClose={() => setFilters(false)}>
          {filter("mobile")}
          <Button className="full" onClick={() => setFilters(false)}>
            Tampilkan hasil
          </Button>
        </Modal>
      ) : null}
    </div>
  );
}