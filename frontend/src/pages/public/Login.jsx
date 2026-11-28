import React, { useEffect, useState } from "react";
import { Brand, Button, Field, Link } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { go } from "../../utils";

export function Login() {
  const { user, reload } = useApp(),
    [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const requested = new URLSearchParams(location.search).get("next"),
    next = requested === "/reservasi" ? requested : "/akun";
  useEffect(() => {
    if (user) go(["admin", "cashier"].includes(user.role) ? "/admin" : next);
  }, [user]);
  return (
    <div className="login-page">
      <Link to="/" className="login-back">
        Kembali ke beranda
      </Link>
      <div className="login-story">
        <Brand />
        <h1>
          Perjalanan seru
          <br />
          dimulai di sini.
        </h1>
        <p>Temukan perlengkapanmu dan simpan rencana sewa dalam satu akun.</p>
      </div>
      <div className="login-form">
        <Brand />
        <h1>
          {register ? "Buat akun perjalananmu" : "Selamat datang kembali"}
        </h1>
        <p className="muted">
          Masuk untuk melanjutkan perjalananmu bersama Funniest Outdoor.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              if (register) await api("/register", { name, email, password });
              const r = await api("/login", { email, password });
              await reload();
              go(["admin", "cashier"].includes(r.role) ? "/admin" : next);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {register && (
            <Field
              label="Nama lengkap"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Field
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Kata sandi"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 10 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button className="full" type="submit" busy={busy}>
            {register ? "Daftar & Masuk" : "Masuk"}
          </Button>
        </form>
        <Button
          variant="outline full"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
        </Button>
      </div>
    </div>
  );
}