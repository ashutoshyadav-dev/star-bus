import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { specialCancellationApi } from "../../api/specialCancellation";

const unwrap = (res) => res?.data?.data ?? res?.data ?? [];

const isoDate = (d) => {
  if (!d) return "";
  if (Array.isArray(d)) return d.map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-");
  return String(d).slice(0, 10);
};
const fmtDate = (d) => {
  const [y, m, day] = isoDate(d).split("-").map(Number);
  if (!y) return "—";
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = Array.isArray(t) ? t : String(t).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const money = (v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  PENDING:   "bg-amber-100 text-amber-700",
  APPROVED:  "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};
const REASON_LABEL = {
  BREAKDOWN: "Bus breakdown", ACCIDENT: "Accident", ROAD_BLOCKED: "Road blocked",
  WEATHER: "Bad weather", STAFF_UNAVAILABLE: "Crew unavailable", OTHER: "Other",
};

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function DetailModal({ request, canDecide, onClose, onChanged }) {
  const [mode, setMode] = useState("PERCENT");
  const [value, setValue] = useState("100");
  const [note, setNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [preview, setPreview] = useState(null);   // { mode, value, data }
  const [busy, setBusy] = useState(false);

  const r = request;
  const pending = r.status === "PENDING";
  const valid = Number(value) > 0 && (mode !== "PERCENT" || Number(value) <= 100);
  const previewCurrent = preview && preview.mode === mode && preview.value === value;

  const runPreview = async () => {
    setBusy(true);
    try {
      const res = await specialCancellationApi.preview(r.id, mode, value);
      setPreview({ mode, value, data: unwrap(res) });
    } catch {
      /* interceptor toasts */
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    const d = preview.data;
    const ok = window.confirm(
      `Approve and cancel this trip?\n\n${d.totalBookings} booking(s), ${d.totalSeats} seat(s)\n` +
      `Total refund: ${money(d.estimatedRefund)}\n\nThis cannot be undone.`);
    if (!ok) return;
    setBusy(true);
    try {
      await specialCancellationApi.approve(r.id, { refundMode: mode, refundValue: Number(value), reviewNote: note || undefined });
      toast.success("Approved. Refunds are being processed");
      onChanged();
    } catch {
      /* interceptor toasts */
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectNote.trim()) { toast.error("Please give a reason for rejecting"); return; }
    setBusy(true);
    try {
      await specialCancellationApi.reject(r.id, rejectNote.trim());
      toast.success("Request rejected");
      onChanged();
    } catch {
      /* interceptor toasts */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white">
          <div>
            <h3 className="font-semibold text-gray-800">
              {r.routeNumber} · {r.origin} to {r.destination}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {fmtDate(r.journeyDate)} · {fmtTime(r.departureTime)} · Bus {r.busRegistrationNumber}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-800">{REASON_LABEL[r.reasonCategory]}</span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
            </div>
            <p className="text-sm text-gray-600">{r.reasonDetails}</p>
            <p className="text-xs text-gray-400 mt-2">
              Raised by {r.requestedByName ?? "counter staff"} on {new Date(r.requestedAt).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Decision form */}
          {pending && canDecide && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm">Refund for every passenger</h4>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">
                  How to decide the refund
                  <select value={mode} onChange={(e) => { setMode(e.target.value); setValue(e.target.value === "PERCENT" ? "100" : ""); }}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800">
                    <option value="PERCENT">Percentage of what they paid</option>
                    <option value="FIXED_PER_SEAT">Fixed amount per seat</option>
                  </select>
                </label>
                <label className="text-xs text-gray-500">
                  {mode === "PERCENT" ? "Percentage (1 to 100)" : "Amount per seat (₹)"}
                  <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
                </label>
              </div>
              <p className="text-xs text-gray-400">
                No passenger can receive more than they actually paid. Each seat is capped at what it paid.
              </p>

              <button disabled={!valid || busy} onClick={runPreview}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
                Preview the payout
              </button>

              {previewCurrent && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <Row label="Bookings / seats" value={`${preview.data.totalBookings} / ${preview.data.totalSeats}`} />
                  {preview.data.unpaidBookings > 0 && (
                    <Row label="Not paid yet (cancelled, no refund)" value={preview.data.unpaidBookings} />
                  )}
                  <Row label="Actually paid for these seats" value={money(preview.data.totalPaid)} />
                  <Row label="Highest paid for one seat" value={money(preview.data.maxSeatPaid)} />
                  <div className="border-t border-blue-200 my-2" />
                  <Row label="Refunded online (PhonePe)" value={money(preview.data.onlineRefund)} />
                  <Row label="Credited to wallet" value={money(preview.data.walletRefund)} />
                  <Row label="Paid out at counters" value={money(preview.data.counterRefund)} />
                  <div className="flex justify-between text-base pt-2 border-t border-blue-200 mt-2">
                    <span className="font-semibold text-gray-800">Total refund</span>
                    <span className="font-bold text-blue-700">{money(preview.data.estimatedRefund)}</span>
                  </div>
                </div>
              )}

              <label className="text-xs text-gray-500 block">
                Note to the counter (optional)
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
              </label>

              <button disabled={!previewCurrent || busy} onClick={approve}
                className="w-full bg-green-600 text-white rounded-lg py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">
                {previewCurrent ? "Approve and cancel the trip" : "Preview first, then approve"}
              </button>

              <div className="border-t border-gray-100 pt-4">
                <label className="text-xs text-gray-500 block">
                  Or reject, with a reason
                  <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} maxLength={1000}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
                </label>
                <button disabled={busy} onClick={reject}
                  className="mt-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50">
                  Reject request
                </button>
              </div>
            </div>
          )}

          {/* Decision made */}
          {!pending && r.status !== "WITHDRAWN" && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Decision</h4>
              <Row label="Decided by" value={r.reviewedByName ?? "Admin"} />
              {r.refundMode && (
                <Row label="Refund terms"
                  value={r.refundMode === "PERCENT" ? `${r.refundValue}% of paid` : `${money(r.refundValue)} per seat`} />
              )}
              {r.reviewNote && <Row label="Note" value={r.reviewNote} />}
              {(r.status === "APPROVED" || r.status === "COMPLETED") && (
                <>
                  <Row label="Bookings processed" value={`${r.refundsCreated} of ${r.totalBookings}`} />
                  <Row label="Refunds completed" value={`${r.refundsCompleted} of ${r.refundsCreated}`} />
                  <Row label="Total refund" value={money(r.totalRefundAmount)} />
                  <p className="text-xs text-gray-400 mt-2">
                    Online and wallet refunds finish by themselves. Counter-paid ones stay open until a counter pays them out.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSpecialCancellations() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canDecide = hasPermission("specialCancellation:approve");
  const [status, setStatus] = useState("PENDING");
  const [openId, setOpenId] = useState(null);

  const { data: rows = [], isLoading } = useQuery(
    ["special-cancellations", status],
    () => specialCancellationApi.list(status || undefined).then(unwrap),
    { refetchInterval: 15000 }
  );
  const open = rows.find((r) => r.id === openId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Special Cancellations</h1>
          <p className="text-sm text-gray-500">
            Requests from counters to cancel a trip. You decide the refund; it never exceeds what was paid.
          </p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800">
          <option value="PENDING">Waiting for decision</option>
          <option value="APPROVED">Approved: refunds in progress</option>
          <option value="COMPLETED">Approved: all processed</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-400 py-10">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-gray-400 py-16">Nothing here</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Trip</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Raised by</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpenId(r.id)}>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-gray-800">{r.routeNumber} · {r.origin} to {r.destination}</div>
                    <div className="text-xs text-gray-500">{fmtDate(r.journeyDate)} · {fmtTime(r.departureTime)}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{REASON_LABEL[r.reasonCategory]}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {r.requestedByName ?? "Counter staff"}
                    <div className="text-xs text-gray-400">{new Date(r.requestedAt).toLocaleString("en-IN")}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                    {(r.status === "APPROVED" || r.status === "COMPLETED") && (
                      <div className="text-[11px] text-gray-400 mt-1">{r.refundsCreated}/{r.totalBookings} processed</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-blue-700">Open</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <DetailModal request={open} canDecide={canDecide} onClose={() => setOpenId(null)}
          onChanged={() => { setOpenId(null); queryClient.invalidateQueries(["special-cancellations"]); }} />
      )}
    </div>
  );
}