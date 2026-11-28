import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export function useBootstrap() {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setData(await api("/bootstrap"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    reload();
  }, []);
  return { data, error, reload };
}