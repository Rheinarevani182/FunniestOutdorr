import { useEffect, useState } from "react";
import { api } from "../services/api";
import { datePayload } from "../utils";

export function useAvailability(dates, data) {
  const [availability, setAvailability] = useState([]);
  useEffect(() => {
    let alive = true;
    api(
      "/availability?start=" +
        encodeURIComponent(datePayload(dates).start_at) +
        "&end=" +
        encodeURIComponent(datePayload(dates).end_at),
    )
      .then((r) => alive && setAvailability(r.variants))
      .catch(() => alive && setAvailability([]));
    return () => {
      alive = false;
    };
  }, [dates, data]);
  return availability;
}