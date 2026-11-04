import { useCallback, useEffect, useRef, useState } from "react";
import { seatHoldApi } from "../api/seatHold";

/**
 * Server-side seat hold.
 *  - toggle(seat)  → PUT /seat-holds with the full desired set (atomic, 409 if taken)
 *  - polls the seat map every `pollMs` so other people's holds appear within seconds
 *  - exposes expiresAt + clock skew so every timer uses SERVER time
 */
export default function useSeatHold({ scheduleId, fromId, toId, fetchSeats, pollMs = 5000, enabled = true }) {
  const [holdId, setHoldId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [skewMs, setSkewMs] = useState(0);          // serverNow - clientNow
  const [busy, setBusy] = useState(false);
  const queue = useRef(Promise.resolve());          // serialise taps: one request in flight at a time
  const holdRef = useRef(null);
  holdRef.current = holdId;

  const apply = (d) => {
    setHoldId(d.holdId ?? null);
    setExpiresAt(d.expiresAt ?? null);
    if (d.serverTime) setSkewMs(new Date(d.serverTime).getTime() - Date.now());
  };

  /** desiredSeatIds = BusSeat ids (seat.seatId ?? seat.id). Resolves {ok, error}. */
  const sync = useCallback((desiredSeatIds) => {
    const run = async () => {
      setBusy(true);
      try {
        const res = await seatHoldApi.sync({ holdId: holdRef.current, scheduleId,
          fromStationId: Number(fromId), toStationId: Number(toId), seatIds: desiredSeatIds });
        apply(res.data?.data ?? res.data);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err?.response?.data?.message || "Could not hold the seat. Please try again.",
                 conflict: err?.response?.status === 409 };
      } finally { setBusy(false); fetchSeats?.(); }
    };
    queue.current = queue.current.then(run, run);
    return queue.current;
  }, [scheduleId, fromId, toId, fetchSeats]);

  const release = useCallback(async () => {
    const id = holdRef.current;
    if (!id) return;
    setHoldId(null); setExpiresAt(null);
    try { await seatHoldApi.release(id); } catch { /* already expired */ }
  }, []);

  // live seat map
  useEffect(() => {
    if (!enabled || !fetchSeats) return;
    const t = setInterval(() => { if (!document.hidden) fetchSeats(); }, pollMs);
    const onVis = () => { if (!document.hidden) fetchSeats(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [enabled, fetchSeats, pollMs]);

  // free the seats when the tab closes
  useEffect(() => {
    const onHide = () => { if (holdRef.current) seatHoldApi.releaseBeacon(holdRef.current); };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  return { holdId, setHoldId, expiresAt, setExpiresAt, skewMs, setSkewMs, busy, sync, release, apply };
}