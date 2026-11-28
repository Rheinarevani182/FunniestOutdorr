export async function api(path, body, method) {
  const r = await fetch("/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const p = await r.json();
  if (!r.ok) throw new Error(p.error || "Permintaan gagal.");
  return p;
}