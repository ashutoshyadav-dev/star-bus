import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { FiSearch, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { counterCancellationApi } from "../../api/counterCancellation";

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

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

const TIER_TEXT = {
  TIER_1_FULL_REFUND_APSTS_CANCEL: "Trip cancelled by APSTS: full refund",
  TIER_2_75PCT_GT_24H: "More than 24 hours before departure: 75% refund",
  TIER_3_50PCT_2TO24H: "2 to 24 hours before departure: 50% refund",
  TIER_4_25PCT_LT_2H: "Less than 2 hours before departure: 25% refund",
  TIER_4_NO_REFUND_LT_2H: "No refund applicable",
};
const DESTINATION_TEXT = {
  ORIGINAL_SOURCE: "Goes back to the passenger's original payment source (usually 5 to 7 working days)",
  WALLET: "Credited to the passenger's wallet straight away",
  COUNTER_PAYOUT: "Paid to the passenger at a counter (cash, UPI or bank transfer)",
  NONE: "",
};

export default function CounterCancelByPnr() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pnrInput, setPnrInput] = useState("");
  const [pnr, setPnr] = useState("");
  const [selected, setSelected] = useState(null);   // null = every active seat
  const [phoneLast4, setPhoneLast4] = useState("");
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState(null);

  const selectedKey = selected ? [...selected].sort().join(",") : "all";
  const { data: booking, isFetching, isError } = useQuery(
    ["counter-pnr", pnr, selectedKey],
    () => counterCancellationApi.lookup(pnr, selected ? [...selected] : undefined).then(unwrap),
    { enabled: !!pnr, retry: false, keepPreviousData: true }
  );

  const search = () => {
    if (!pnrInput.trim()) return;
    setResult(null);
    setSelected(null);
    setPhoneLast4("");
    setReason("");
    setPnr(pnrInput.trim().toUpperCase());
  };

  const toggleSeat = (id) => {
    const current = new Set(selected ?? booking.seats.filter((s) => !s.cancelled).map((s) => s.reservationId));
    if (current.has(id)) current.delete(id); else current.add(id);
    setSelected(current);
  };

  const preview = booking?.refundPreview;
  const nothingSelected = booking && booking.seats.every((s) => !s.selected);
  const canCancel = booking?.cancellable && !nothingSelected && /^\d{4}$/.test(phoneLast4) && !cancelling;

  const cancel = async () => {
    const ok = window.confirm(
      `Cancel ${booking.pnr}?\n\nRefund: ${money(preview?.refundAmount)}\n${DESTINATION_TEXT[preview?.destination] ?? ""}\n\nThis cannot be undone.`);
    if (!ok) return;
    setCancelling(true);
    try {
      const res = await counterCancellationApi.cancel(pnr, {
        phoneLast4,
        reservationIds: selected ? [...selected] : undefined,
        cancellationReason: reason.trim() || undefined,
      });
      setResult(unwrap(res));
      setPnr("");
      setPnrInput("");
      queryClient.invalidateQueries(["counter-refunds"]);
      toast.success("Booking cancelled");
    } catch {
      /* the axios interceptor already toasted the reason (for example the phone digits did not match) */
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Cancel a booking by PNR</h1>
      <p className="text-sm text-gray-500 mb-6">
        For a passenger standing at the counter. The normal refund policy applies. Works for online and counter bookings.
      </p>

      <div className="max-w-2xl space-y-5">
        {/* Search */}
        <div className="flex gap-2">
          <input value={pnrInput} onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Enter PNR" maxLength={12}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider" />
          <button onClick={search}
            className="px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <FiSearch /> Find
          </button>
        </div>

        {/* Result of a cancellation */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <FiCheckCircle /> Booking cancelled
            </div>
            <p className="text-sm text-gray-700">
              Refund: <b>{money(result.refundAmount)}</b>
            </p>
            {Number(result.refundAmount) === 0 ? (
              <p className="text-sm text-gray-500 mt-1">No refund is applicable for this cancellation.</p>
            ) : result.paymentMethod === "WALLET" ? (
              <p className="text-sm text-gray-500 mt-1">Already credited to the passenger's wallet.</p>
            ) : result.paymentMethod === "PHONEPE" ? (
              <p className="text-sm text-gray-500 mt-1">
                Going back to the passenger's original payment source (usually 5 to 7 working days). Nothing to pay at the counter.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-700 mt-1">
                  This booking was paid at a counter. <b>Pay the passenger now</b> and record it.
                </p>
                <button onClick={() => navigate("/counter/refunds")}
                  className="mt-3 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                  Go to refunds to pay out
                </button>
              </>
            )}
          </div>
        )}

        {isError && pnr && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            No booking found for PNR {pnr}.
          </div>
        )}

        {booking && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-mono font-semibold text-gray-800">{booking.pnr}</div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {booking.bookingStatus.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mt-2">
                {booking.origin} <FiArrowRight className="text-orange-500" /> {booking.destination}
              </div>
              <div className="text-sm text-gray-500">
                {fmtDate(booking.journeyDate)} · {fmtTime(booking.departureTime)} · Bus {booking.busRegistrationNumber}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Phone on booking: {booking.passengerPhoneMasked ?? "none"} · Paid {money(booking.amountPaid)} by{" "}
                {String(booking.paymentMethod ?? "").replace("_", " ").toLowerCase()}
              </div>
            </div>

            {!booking.cancellable ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                {booking.notCancellableReason}
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Seats to cancel</p>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {booking.seats.map((s) => (
                      <label key={s.reservationId}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm ${s.cancelled ? "opacity-40" : "cursor-pointer hover:bg-gray-50"}`}>
                        <input type="checkbox" disabled={s.cancelled} checked={s.selected}
                          onChange={() => toggleSeat(s.reservationId)} />
                        <span className="font-medium text-gray-800 w-12">{s.seatLabel}</span>
                        <span className="flex-1 text-gray-600">{s.passengerName}</span>
                        <span className="text-gray-500">{money(s.fare)}</span>
                        {s.cancelled && <span className="text-xs text-gray-400">cancelled</span>}
                      </label>
                    ))}
                  </div>
                </div>

                {preview && !nothingSelected && (
                  <div className={`rounded-xl p-4 border ${isFetching ? "opacity-60" : ""} ${
                    Number(preview.refundAmount) > 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                    <div className="text-xs text-gray-500">{TIER_TEXT[preview.tier]}</div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-sm text-gray-700">Passenger gets back</span>
                      <span className="text-2xl font-bold text-gray-800">{money(preview.refundAmount)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Fare {money(preview.grossFare)} · Cancellation charge {money(preview.deduction)} · Reservation fee {money(preview.reservationFeeDeducted)} (not refunded)
                    </div>
                    {DESTINATION_TEXT[preview.destination] && Number(preview.refundAmount) > 0 && (
                      <div className="text-xs text-gray-600 mt-2">{DESTINATION_TEXT[preview.destination]}</div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-gray-500">
                    Last 4 digits of the phone number *
                    <input value={phoneLast4} inputMode="numeric" maxLength={4}
                      onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ask the passenger"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 tracking-widest" />
                  </label>
                  <label className="text-xs text-gray-500">
                    Reason (optional)
                    <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
                  </label>
                </div>

                <button disabled={!canCancel} onClick={cancel}
                  className="w-full bg-red-600 text-white rounded-lg py-2.5 font-semibold hover:bg-red-700 disabled:opacity-50">
                  {cancelling ? "Cancelling…" : "Cancel booking"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}