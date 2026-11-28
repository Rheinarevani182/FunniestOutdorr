import React, { useState } from "react";
import { Search } from "lucide-react";
import { CartLines, Dates, Summary } from "../../components/booking";
import { Categories, Choose, ProductCard } from "../../components/product";
import { Button, Empty, Field, Panel, Title } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useQuote, useResource } from "../../hooks";
import { api } from "../../services/api";
import { datePayload, defaultDates, go } from "../../utils";

export function OrderEditor({ existing, onSaved }) {
  const { items, reload, notify } = useApp(),
    [lines, setLines] = useState(
      existing
        ? existing.items.map((l) => ({
            variant_id: l.variant_id,
            quantity: l.quantity,
          }))
        : [],
    ),
    [dates, setDates] = useState(
      existing
        ? {
            start: existing.start_at.slice(0, 10),
            end: existing.end_at.slice(0, 10),
          }
        : defaultDates,
    ),
    [form, setForm] = useState({
      customer_name: existing?.customer_name || "",
      phone: existing?.phone || "",
      note: existing?.note || "",
      address: existing?.address || "",
      identity_type: existing?.identity_type || "KTP",
    }),
    [bundle, setBundle] = useState(existing?.bundle_id || ""),
    [cat, setCat] = useState("Semua"),
    [q, setQ] = useState(""),
    [choose, setChoose] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    {
      quote,
      error: quoteError,
      loading,
    } = useQuote(lines, bundle, dates, existing?.id);
  const stockResource = useResource(
    "/availability?start=" +
      encodeURIComponent(datePayload(dates).start_at) +
      "&end=" +
      encodeURIComponent(datePayload(dates).end_at) +
      (existing ? "&exclude=" + existing.id : ""),
    { pollMs: 5000 },
  );
  const baseStock = stockResource.data?.variants || [];
  const remaining = baseStock.map((v) => ({
    ...v,
    available: Math.max(
      0,
      v.available - (lines.find((l) => l.variant_id === v.id)?.quantity || 0),
    ),
  }));
  const add = (vid, quantity = 1) => {
    const stock = remaining.find((v) => v.id === vid);
    if (!stock || stock.available < quantity) {
      notify("Stok tidak cukup untuk tanggal yang dipilih.");
      return;
    }
    setLines((prev) =>
      prev.some((l) => l.variant_id === vid)
        ? prev.map((l) =>
            l.variant_id === vid
              ? { ...l, quantity: Math.min(100, l.quantity + quantity) }
              : l,
          )
        : [...prev, { variant_id: vid, quantity }],
    );
  };
  return (
    <>
      <Title
        title={
          existing ? "Editor Pesanan · " + existing.code : "Kasir Cepat (POS)"
        }
        description="Tambah alat, ubah jumlah dan durasi, tanpa mengulang transaksi."
      >
        {existing ? (
          <Button variant="outline" onClick={onSaved}>
            Kembali ke detail
          </Button>
        ) : null}
      </Title>
      <form
        className="pos-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const p = {
              ...form,
              ...datePayload(dates),
              items: lines,
              bundle_id: bundle,
            };
            if (existing) {
              await api(
                "/bookings/" + existing.id,
                { ...p, version: existing.version },
                "PATCH",
              );
              onSaved();
            } else {
              const b = await api("/bookings", { ...p, source: "pos" });
              go("/admin/pesanan/" + b.id);
            }
            await reload();
            notify("Pesanan berhasil disimpan.");
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <div className="input-search">
            <Search size={18} />
            <input
              aria-label="Cari perlengkapan kasir"
              placeholder="Cari perlengkapan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Categories value={cat} onChange={setCat} />
          <div className="product-grid pos-products">
            {items
              .filter(
                (p) =>
                  p.active &&
                  (cat === "Semua" || cat === p.category) &&
                  p.name.toLowerCase().includes(q.toLowerCase()),
              )
              .map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  stock={remaining}
                  onAdd={() =>
                    p.variants.length > 1 ? setChoose(p) : add(p.variants[0].id)
                  }
                />
              ))}
          </div>
        </div>
        <div>
          <Panel title="Rincian transaksi">
            <div className="two-col">
              <Field
                label="Nama pelanggan *"
                required
                minLength={2}
                value={form.customer_name}
                onChange={(e) =>
                  setForm({ ...form, customer_name: e.target.value })
                }
              />
              <Field
                label="WhatsApp *"
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Field label="Alamat penyewa">
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Jaminan pengambilan">
              <select
                value={form.identity_type}
                onChange={(e) =>
                  setForm({ ...form, identity_type: e.target.value })
                }
              >
                <option>KTP</option>
                <option>SIM</option>
              </select>
            </Field>
            <Dates dates={dates} onChange={setDates} compact />
            <CartLines lines={lines} setLines={setLines} />
            {!lines.length ? <Empty title="Pilih alat dari katalog" /> : null}
            <Field label="Paket yang berlaku">
              <select
                value={bundle}
                onChange={(e) => setBundle(e.target.value)}
              >
                <option value="">Tanpa paket</option>
                <option value="camping4">Camping Bareng 4 Orang</option>
                <option value="hiker">Pendaki Ringkas</option>
                <option value="rest">Istirahat di Alam</option>
              </select>
            </Field>
            <small className="muted">
              Diskon diterapkan hanya jika isi paket lengkap.
            </small>
            <Field label="Catatan">
              <textarea
                rows="2"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>
          </Panel>
          <Summary quote={quote} loading={loading}>
            {error || quoteError ? (
              <p className="error" role="alert">
                {error || quoteError}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="orange full"
              busy={busy}
              disabled={!quote || loading}
            >
              {existing ? "Simpan Perubahan" : "Simpan Transaksi"}
            </Button>
          </Summary>
        </div>
      </form>
      {choose ? (
        <Choose
          product={choose}
          onClose={() => setChoose(null)}
          onAdd={add}
          stock={remaining}
        />
      ) : null}
    </>
  );
}