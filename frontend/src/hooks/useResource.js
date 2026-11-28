import { useEffect, useState } from "react";
import { api } from "../services/api";

export function useResource(path, { pollMs = 0 } = {}) {
  const [state, setState] = useState({
    path: null,
    data: null,
    error: "",
    updatedAt: null,
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let alive = true,
      pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await api(path);
        if (alive) setState({ path, data, error: "", updatedAt: new Date() });
      } catch (e) {
        if (alive)
          setState((prev) =>
            prev.path === path
              ? { ...prev, error: e.message }
              : { path, data: null, error: e.message, updatedAt: null },
          );
      } finally {
        pending = false;
      }
    };
    const wake = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const timer = pollMs ? setInterval(wake, pollMs) : null;
    addEventListener("focus", wake);
    addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      alive = false;
      clearInterval(timer);
      removeEventListener("focus", wake);
      removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [path, pollMs, tick]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path ? state.error : "",
    updatedAt: state.path === path ? state.updatedAt : null,
    refresh: () => setTick((n) => n + 1),
  };
}