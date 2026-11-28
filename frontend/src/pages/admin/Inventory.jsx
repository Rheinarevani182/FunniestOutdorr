import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Metric } from "../../components/admin";
import { Photo } from "../../components/product";
import {
  Badge,
  Button,
  Field,
  Modal,
  Notice,
  Panel,
  Title,
} from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { money, productPhoto } from "../../utils";

export function Inventory() {
  const { items, user, reload, notify } = useApp(),
    [q, setQ] = useState(""),
    [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const total = items
      .flatMap((p) => p.variants)
      .reduce((s, v) => s + v.stock, 0),
    maintenance = items
      .flatMap((p) => p.variants)
      .reduce((s, v) => s + v.maintenance, 0),
    change = (k, v) => setEdit({ ...edit, [k]: v });
  return (
    <>
      <Title
        title="Katalog & Stok"
        description="Kelola perlengkapan, varian, harga, dan kondisi stok."
      >
        {user.role === "admin" ? (
          <Button
            variant="orange"
            onClick={() => {
              setError("");
              setEdit({
                name: "",
                category: "Perlengkapan",
                price: 0,
                image: 4,
                description: "",
                tags: "",
                active: 1,
                variants: [{ label: "Standar", stock: 1, maintenance: 0 }],
              });
            }}
          >
            <Plus size={18} />
            Tambah Produk
          </Button>
        ) : null}
      </Title>
      <div className="metrics">
        <Metric
          label="Produk aktif"
          value={items.filter((p) => p.active).length}
          description="Tampil pada katalog"
        />
        <Metric
          label="Total unit"
          value={total}
          description="Seluruh inventaris"
        />
        <Metric
          label="Siap sewa"
          value={total - maintenance}
          description="Termasuk unit yang dialokasikan"
        />
        <Metric
          label="Barang belum kembali"
          value="Lihat daftar"
          description="Pantau penyewa & batas pengembalian"
        />
      </div>
      <Panel title="Inventaris perlengkapan">
        <div className="input-search">
          <Search size={18} />
          <input
            aria-label="Cari inventaris"
            placeholder="Cari nama atau kategori…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga / hari</th>
                <th>Varian</th>
                <th>Total</th>

                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((p) =>
                  (p.name + " " + p.category)
                    .toLowerCase()
                    .includes(q.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="row">
                        <Photo product={p} className="tiny" />
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.category}</small>
                        </div>
                      </div>
                    </td>
                    <td>{money(p.price)}</td>
                    <td>{p.variants.map((v) => v.label).join(", ")}</td>
                    <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>

                    <td>
                      <Badge status={p.active ? "available" : "cancelled"}>
                        {p.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td>
                      {user.role === "admin" ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setError("");
                            setEdit(JSON.parse(JSON.stringify(p)));
                          }}
                        >
                          Edit
                        </button>
                      ) : (
                        <small>Akses kasir</small>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Notice>
        Stok pada suatu tanggal dihitung dari puncak jumlah alat yang
        dialokasikan pada jadwal bertabrakan. Jadwal yang tidak bertabrakan
        tetap bisa dipesan.
      </Notice>
      {edit ? (
        <Modal
          wide
          title={edit.id ? "Edit Produk" : "Tambah Produk"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api("/items", edit, "PUT");
                await reload();
                setEdit(null);
                notify("Produk berhasil disimpan.");
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="two-col">
              <Field
                label="Nama produk"
                required
                value={edit.name}
                onChange={(e) => change("name", e.target.value)}
              />
              <Field label="Kategori">
                <select
                  value={edit.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  {["Tenda", "Carrier", "Sepatu", "Kursi", "Perlengkapan"].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field
                label="Harga harian (Rp)"
                type="number"
                min="0"
                required
                value={edit.price}
                onChange={(e) => change("price", Number(e.target.value))}
              />
              <Field label="Tampilan produk">
                <select
                  value={edit.image}
                  onChange={(e) => change("image", Number(e.target.value))}
                >
                  {[
                    "Sepatu",
                    "Carrier",
                    "Kursi",
                    "Tenda",
                    "Matras",
                    "Sleeping Bag",
                    "Kompor",
                    "Cookset",
                    "Headlamp",
                    "Trekking Pole",
                    "Flysheet",
                    "Poncho",
                  ].map((n, i) => (
                    <option key={n} value={i}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Panel title="Foto produk">
              <Photo product={edit} className="modal-photo" />
              <div className="two-col">
                {[
                  ["Ambil foto dengan kamera", true],
                  ["Pilih dari galeri / perangkat", false],
                ].map(([label, camera]) => (
                  <Field key={label} label={label}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture={camera ? "environment" : undefined}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        setBusy(true);
                        try {
                          const photo_url = await productPhoto(file);
                          if (photo_url)
                            setEdit((prev) => ({ ...prev, photo_url }));
                          setError("");
                        } catch (e) {
                          setError(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </Field>
                ))}
              </div>
              <p className="muted">
                Foto disesuaikan ukurannya dan disimpan bersama produk. Gunakan
                pilihan perangkat jika kamera tidak tersedia.
              </p>
            </Panel>
            <Field label="Deskripsi">
              <textarea
                rows="3"
                value={edit.description}
                onChange={(e) => change("description", e.target.value)}
              />
            </Field>
            <Field
              label="Kata kunci"
              value={edit.tags}
              onChange={(e) => change("tags", e.target.value)}
            />
            <h3>Varian & stok</h3>
            {edit.variants.map((v, i) => (
              <div className="variant-row" key={i}>
                {[
                  ["label", "Ukuran / varian", "text"],
                  ["stock", "Total unit", "number"],
                ].map(([k, label, type]) => (
                  <Field
                    key={k}
                    label={label}
                    required
                    type={type}
                    min="0"
                    value={v[k]}
                    onChange={(e) =>
                      change(
                        "variants",
                        edit.variants.map((x, j) =>
                          i === j
                            ? {
                                ...x,
                                [k]:
                                  type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                change("variants", [
                  ...edit.variants,
                  { label: "", stock: 1, maintenance: 0 },
                ])
              }
            >
              Tambah Varian
            </Button>
            <label className="check-row">
              <input
                type="checkbox"
                checked={!!edit.active}
                onChange={(e) => change("active", e.target.checked ? 1 : 0)}
              />
              Tampilkan produk di katalog
            </label>
            {error ? <p className="error">{error}</p> : null}
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setEdit(null)}>
                Batal
              </Button>
              <Button type="submit" busy={busy}>
                Simpan Produk
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}