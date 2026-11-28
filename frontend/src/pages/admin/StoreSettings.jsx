import React, { useState } from "react";
import { Button, Field, Notice, Panel, Title } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";

export function StoreSettings() {
  const { settings, user, reload, notify } = useApp(),
    [form, setForm] = useState({ ...settings }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [staff, setStaff] = useState({
      name: "",
      email: "",
      password: "",
      role: "cashier",
    }),
    [pwd, setPwd] = useState({ current: "", next: "" });
  if (user.role !== "admin")
    return <Notice>Pengaturan hanya tersedia untuk administrator.</Notice>;
  const change = (k, v) => setForm({ ...form, [k]: v });
  return (
    <>
      <Title
        title="Pengaturan Usaha"
        description="Perbarui identitas usaha dan aturan tarif sebelum operasional."
      />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/settings", form, "PUT");
            await reload();
            notify("Pengaturan usaha disimpan.");
            setError("");
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="two-col">
          <Panel title="Profil usaha">
            <Field
              label="Nama usaha"
              required
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
            />
            <Field
              label="WhatsApp usaha"
              type="tel"
              placeholder="08xx xxxx xxxx"
              value={form.phone}
              onChange={(e) => change("phone", e.target.value)}
            />
            <Field label="Alamat pengambilan">
              <textarea
                rows="3"
                value={form.address}
                onChange={(e) => change("address", e.target.value)}
              />
            </Field>
            <Field
              label="Jam operasional"
              value={form.hours}
              onChange={(e) => change("hours", e.target.value)}
            />
            {[
              ["instagram", "Link Instagram"],
              ["tiktok", "Link TikTok"],
              ["maps", "Link Google Maps"],
            ].map(([k, l]) => (
              <Field
                key={k}
                label={l}
                type="url"
                placeholder="https://..."
                value={form[k] || ""}
                onChange={(e) => change(k, e.target.value)}
              />
            ))}
          </Panel>
          <Panel title="Tarif & ketentuan">
            <Notice>
              DP 50% dari biaya sewa. Tanpa deposit uang. Jaminan KTP/SIM saat
              pengambilan.
            </Notice>
            {[
              ["bank_name", "Nama bank"],
              ["bank_account", "Nomor rekening DP"],
              ["bank_holder", "Atas nama"],
            ].map(([k, l]) => (
              <Field
                key={k}
                label={l}
                value={form[k] || ""}
                onChange={(e) => change(k, e.target.value)}
              />
            ))}
            <Field
              label="Biaya keterlambatan / hari / pesanan (Rp)"
              type="number"
              min="0"
              value={form.late_daily || 0}
              onChange={(e) => change("late_daily", Number(e.target.value))}
            />
            <p className="muted">
              Isi 0 untuk mengikuti jumlah tarif harian seluruh barang dalam
              pesanan. Bagian hari dihitung satu hari.
            </p>
            <h4>Pengali tarif menurut durasi</h4>
            {form.tiers.map((t, i) => (
              <div className="two-col" key={i}>
                <Field
                  label="Mulai hari ke-"
                  required
                  type="number"
                  min="1"
                  value={t.min_days}
                  onChange={(e) =>
                    change(
                      "tiers",
                      form.tiers.map((x, j) =>
                        j === i
                          ? { ...x, min_days: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
                <Field
                  label="Pengali harga"
                  required
                  type="number"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={t.factor}
                  onChange={(e) =>
                    change(
                      "tiers",
                      form.tiers.map((x, j) =>
                        j === i ? { ...x, factor: Number(e.target.value) } : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <small className="muted">
              0,9 berarti 90% × harga harian × durasi. Sesuaikan dengan tarif
              asli UMKM.
            </small>
            <Field label="Ketentuan sewa">
              <textarea
                rows="4"
                value={form.terms}
                onChange={(e) => change("terms", e.target.value)}
              />
            </Field>
          </Panel>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="save-bar">
          <Button type="submit" variant="orange" busy={busy}>
            Simpan Pengaturan
          </Button>
        </div>
      </form>
      <div className="two-col">
        <Panel title="Tambah akun staf">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/users", staff);
                setStaff({
                  name: "",
                  email: "",
                  password: "",
                  role: "cashier",
                });
                notify("Akun staf berhasil dibuat.");
              } catch (e) {
                notify(e.message);
              }
            }}
          >
            {[
              ["name", "Nama staf", "text"],
              ["email", "Email", "email"],
              ["password", "Kata sandi (minimal 10 karakter)", "password"],
            ].map(([k, l, t]) => (
              <Field
                key={k}
                label={l}
                type={t}
                minLength={k === "password" ? 10 : undefined}
                required
                value={staff[k]}
                onChange={(e) => setStaff({ ...staff, [k]: e.target.value })}
              />
            ))}
            <Field label="Peran">
              <select
                value={staff.role}
                onChange={(e) => setStaff({ ...staff, role: e.target.value })}
              >
                <option value="cashier">Kasir</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
            <Button variant="outline" type="submit">
              Buat Akun Staf
            </Button>
          </form>
        </Panel>
        <Panel title="Akses akun">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/password", pwd);
                setPwd({ current: "", next: "" });
                notify("Kata sandi berhasil diganti.");
              } catch (e) {
                notify(e.message);
              }
            }}
          >
            <Field
              label="Kata sandi saat ini"
              type="password"
              required
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            />
            <Field
              label="Kata sandi baru"
              type="password"
              required
              minLength={10}
              value={pwd.next}
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            />
            <Button variant="outline" type="submit">
              Ganti Kata Sandi
            </Button>
          </form>

          <hr />
          <p className="muted">
            Pembayaran dilakukan manual di kasir atau melalui transfer yang
            diverifikasi staf. Dokumen identitas pelanggan tidak disimpan.
          </p>
        </Panel>
      </div>
    </>
  );
}