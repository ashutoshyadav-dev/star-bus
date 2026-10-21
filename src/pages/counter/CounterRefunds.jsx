import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { FiSearch, FiX } from "react-icons/fi";
import { counterRefundApi } from "../../api/specialCancellation";

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
const money = (v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;

const CHANNELS = [
  ["CASH", "Cash"],
  ["UPI", "UPI"],
  ["BANK_TRANSFER", "Online bank transfer"],
];

function PayModal({ refund, onClose, onDone }) {
  const [channel, setChannel] = useState(refund.paymentMethod === "UPI_COUNTER" ? "UPI" : "CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const needsRef = channel !== "CASH";
  const canPay = !saving && (!needsRef || reference.trim().length > 0);

  const pay = async () => {
    setSaving(true);
    try {
      await counterRefundApi.pay(refund.refundId, {
        channel,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      toast.success(`Refund of ${money(refund.refundAmount)} recorded as paid`);
      onDone();
    } catch {
      /* the axios interceptor already toasted the reason (for example already paid by another counter) */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Pay out refund</h3>
            <p className="text-xs text-gray-500 mt-0.5">PNR {refund.pnr} · {refund.passengerName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center bg-green-50 border border-green-200 rounded-xl py-4">
            <div className="text-xs text-green-700">Amount to pay the passenger</div>
            <div className="text-3xl font-bold text-green-700">{money(refund.refundAmount)}</div>
            {refund.passengerPhone && <div className="text-xs text-gray-500 mt-1">Phone {refund.passengerPhone}</div>}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">How are you paying it?</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(([v, l]) => (
                <button key={v} onClick={() => setChannel(v)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border ${
                    channel === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {needsRef && (
            <label className="text-xs text-gray-500 block">
              Transaction reference (UTR / UPI ref) *
              <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
            </label>
          )}

          <label className="text-xs text-gray-500 block">
            Note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={255}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
          </label>

          <p className="text-xs text-amber-600">
            Only confirm after the money has actually been handed over or transferred. This cannot be undone.
          </p>

          <button disabled={!canPay} onClick={pay}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving…" : `Confirm ${money(refund.refundAmount)} paid`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CounterRefunds() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [paying, setPaying] = useState(null);

  const { data: refunds = [], isLoading } = useQuery(
    ["counter-refunds"],
    () => counterRefundApi.pending().then(unwrap),
    { refetchInterval: 30000 }
  );

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return refunds;
    return refunds.filter((r) =>
      `${r.pnr} ${r.passengerName} ${r.passengerPhone ?? ""}`.toLowerCase().includes(s));
  }, [refunds, q]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Refunds to pay out</h1>
      <p className="text-sm text-gray-500 mb-5">
        Passengers who booked at a counter are refunded here, by cash, UPI or bank transfer. Any counter can pay them.
      </p>

      <div className="relative max-w-sm mb-5">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PNR, name or phone"
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
      </div>

      {isLoading ? (
        <div className="text-gray-400 py-10">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="text-center text-gray-400 py-16">No refunds waiting</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto max-w-5xl">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Passenger</th>
                <th className="px-5 py-3">Trip</th>
                <th className="px-5 py-3">Paid by</th>
                <th className="px-5 py-3 text-right">Refund</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((r) => (
                <tr key={r.refundId}>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-gray-800">{r.passengerName}</div>
                    <div className="text-xs text-gray-500">PNR {r.pnr}{r.passengerPhone ? ` · ${r.passengerPhone}` : ""}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {r.origin} to {r.destination}
                    <div className="text-xs text-gray-400">{fmtDate(r.journeyDate)}</div>
                    {r.specialCancellationId && (
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Trip cancelled by APSTS
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {r.paymentMethod === "UPI_COUNTER" ? "UPI at counter" : "Cash at counter"}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-gray-800">{money(r.refundAmount)}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setPaying(r)}
                      className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100">
                      Pay out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paying && (
        <PayModal refund={paying} onClose={() => setPaying(null)}
          onDone={() => { setPaying(null); queryClient.invalidateQueries(["counter-refunds"]); }} />
      )}
    </div>
  );
}