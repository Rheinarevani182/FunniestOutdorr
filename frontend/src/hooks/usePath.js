import { useEffect, useState } from "react";

export function usePath() {
  const [p, set] = useState(location.pathname);
  useEffect(() => {
    const f = () => {
      set(location.pathname);
      window.scrollTo(0, 0);
    };
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  return p;
}