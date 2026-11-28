import { useEffect, useState } from "react";
import { api } from "../services/api";
import { datePayload } from "../utils";

export function useQuote(lines, bundle, dates, exclude) {
  const [data, set] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const key = JSON.stringify({
    items: lines,
    bundle_id: bundle,
    ...datePayload(dates),
    exclude_id: exclude,
  });
  useEffect(() => {
    let alive = true;
    set(null);
    setError("");
    if (!lines.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(
      () =>
        api("/quote", JSON.parse(key))
          .then((q) => alive && set(q))
          .catch((e) => alive && setError(e.message))
          .finally(() => alive && setLoading(false)),
      150,
    );
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [key]);
  return { quote: data, error, loading };
}