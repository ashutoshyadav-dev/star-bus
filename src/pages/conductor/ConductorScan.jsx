import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode"; // npm install html5-qrcode
import { manifestApi, ticketApi } from "../../api/ticket";
import {
  saveManifest, findInManifest, markLocallyBoarded,
  getPendingQueue, clearSyncedFromQueue,
} from "../../utils/offlineQueue";
import toast from "react-hot-toast";

export default function ConductorScan() {
  const { scheduleId } = useParams();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [result, setResult] = useState(null);
  const [manifestReady, setManifestReady] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const syncPendingQueue = useCallback(async () => {
    const pending = await getPendingQueue();
    if (pending.length === 0) return;
    try {
      const res = await manifestApi.syncBoarding(scheduleId, pending);
      const failed = res.data.data;
      const synced = pending.map((p) => p.qrCodeHash).filter((h) => !failed.includes(h));
      await clearSyncedFromQueue(synced);
      if (failed.length > 0) toast.error(`${failed.length} scan(s) failed to sync`);
      else toast.success(`Synced ${synced.length} offline scan(s)`);
    } catch { /* still offline — retry on next reconnect */ }
  }, [scheduleId]);

  useEffect(() => { if (isOnline) syncPendingQueue(); }, [isOnline, syncPendingQueue]);

  useEffect(() => {
    (async () => {
      try {
        const res = await manifestApi.get(scheduleId);
        await saveManifest(res.data.data);
        setManifestReady(true);
        toast.success(`Loaded ${res.data.data.length} tickets for offline scanning`);
      } catch {
        toast.error("Could not download manifest — check connectivity before departure");
      }
    })();
  }, [scheduleId]);

  const handleScan = useCallback(async (qrCodeHash) => {
    const local = await findInManifest(qrCodeHash);
    if (!local) { setResult({ ok: false, message: "Not valid for this bus" }); return; }
    if (local.reservationStatus === "BOARDED") {
      setResult({ ok: false, message: `Already boarded — ${local.passengerName}, Seat ${local.seatLabel}` });
      return;
    }
    await markLocallyBoarded(qrCodeHash);
    setResult({ ok: true, message: `Valid — ${local.passengerName}, Seat ${local.seatLabel}` });
    if (navigator.onLine) {
      try { await ticketApi.validate(qrCodeHash); } catch { /* queued, will sync */ }
    }
  }, []);

  useEffect(() => {
    if (!manifestReady) return;
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
    scanner.render((decodedText) => handleScan(decodedText));
    scannerRef.current = scanner;
    return () => scanner.clear();
  }, [manifestReady, handleScan]);

  return (
    <div className="p-4">
      <div className={`mb-3 px-3 py-1 rounded-full text-xs inline-block ${
        isOnline ? "bg-green-500/20 text-green-700" : "bg-orange-500/20 text-orange-700"
      }`}>
        {isOnline ? "● Online" : "○ Offline — scans will sync automatically"}
      </div>
      <div id="qr-reader" />
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          result.ok ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"
        }`}>
          {result.ok ? "✅ " : "❌ "} {result.message}
        </div>
      )}
    </div>
  );
}