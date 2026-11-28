import { useCallback, useEffect, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState("");
  const notify = useCallback(setToast, []);
  useEffect(() => {
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, setToast, notify };
}