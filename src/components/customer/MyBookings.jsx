import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiX, FiAlertTriangle, FiClock, FiCheckCircle } from "react-icons/fi";
import { bookingApi } from "../../api/booking";
import toast from "react-hot-toast";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function isUpcoming(journeyDate) {
  if (!journeyDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(journeyDate) > today;
}

function formatTime(time) {
  if (!time) return "—";
  if (typeof time === "string") {
    const [h, m] = time.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  const { hour = 0, minute = 0 } = time;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/**
 * Computes hours between now and the journey departure.
 * Uses journeyDate + departureTime if available, else just journeyDate at 00:00.
 */
function hoursUntilDeparture(journeyDate, departureTime) {
  if (!journeyDate) return Infinity;
  const base = new Date(journeyDate);
  if (departureTime && typeof departureTime === "string") {
    const [h, m] = departureTime.split(":").map(Number);
    base.setHours(h, m, 0, 0);
  }
  return (base - Date.now()) / 3_600_000;
}

/**
 * Returns the cancellation tier + refund % based on hours to departure.
 * Mirrors RefundService.resolveTier() on the backend.
 */
function resolveTier(hours) {
  if (hours > 24) return { tier: "TIER_2_75PCT_GT_24H",  pct: 75, label: ">24h before departure — 25% penalty" };
  if (hours >= 2) return { tier: "TIER_3_50PCT_2TO24H",  pct: 50, label: "2–24h before departure — 50% penalty" };
  return              { tier: "TIER_4_NO_REFUND_LT_2H", pct: 0,  label: "<2h before departure — no refund" };
}

function Spinner({ size = "w-5 h-5" }) {
  return (
    <svg className={`${size} animate-spin shrink-0`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STATUS_META = {
  CONFIRMED:       { label: "Confirmed",  style: "bg-blue-100 text-blue-700"   },
  COMPLETED:       { label: "Completed",  style: "bg-green-100 text-green-700" },
  FULLY_CANCELLED: { label: "Cancelled",  style: "bg-red-100 text-red-600"     },
  PENDING_PAYMENT: { label: "Pending",    style: "bg-yellow-100 text-yellow-700"},
};

const FILTER_TABS = ["All", "Upcoming", "Confirmed", "Completed", "Cancelled", "Pending"];

/* ─── Cancel Modal ────────────────────────────────────────────────────────── */

/**
 * Two-step cancel modal:
 *   Step 1 — shows refund estimate + reason input
 *   Step 2 — confirms cancellation result
 */
function CancelModal({ booking, onClose, onCancelled }) {
  const [reason, setReason]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);       // step 2
  const [refundAmt, setRefundAmt] = useState(null);

  const hours = hoursUntilDeparture(booking.journeyDate, booking.departureTime);
  const tier  = resolveTier(hours);

  // Estimated refund — backend will compute precisely; this is for display only
  const estimatedRefund = booking.totalAmountPaid
    ? ((booking.totalAmountPaid * tier.pct) / 100).toFixed(2)
    : null;

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason for cancellation.");
      return;
    }
    setLoading(true);
    try {
      await bookingApi.cancel(booking.bookingId, { cancellationReason: reason.trim() });
      setRefundAmt(estimatedRefund);
      setDone(true);
      onCancelled(booking.bookingId);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Cancellation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${done ? "bg-green-50 border-b border-green-100" : "bg-red-50 border-b border-red-100"}`}>
          <div className="flex items-center gap-2">
            {done
              ? <FiCheckCircle className="text-green-500 w-5 h-5" />
              : <FiAlertTriangle className="text-red-500 w-5 h-5" />}
            <h3 className={`font-semibold text-base ${done ? "text-green-700" : "text-red-700"}`}>
              {done ? "Booking Cancelled" : "Cancel Booking"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {done ? (
            /* ── Step 2: Success ── */
            <>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <FiCheckCircle className="text-green-500 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 text-sm">Booking successfully cancelled</p>
                  <p className="text-green-600 text-xs mt-1">
                    PNR <span className="font-mono font-semibold">{booking.pnr}</span> has been cancelled.
                  </p>
                </div>
              </div>

              {/* Refund info */}
              {tier.pct > 0 ? (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                  <p className="text-sm font-semibold text-blue-800">Refund initiated</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Estimated refund</span>
                    <span className="font-semibold text-blue-800">₹{refundAmt}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-500">
                    <span>Cancellation policy</span>
                    <span>{tier.label}</span>
                  </div>
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    Credits to original source within 5–7 business days. Wallet credits are instant.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">
                  <p className="font-semibold">No refund applicable</p>
                  <p className="text-xs mt-1 text-red-500">{tier.label}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); window.location.href = "/user/my-refunds"; }}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Track Refund →
                </button>
              </div>
            </>
          ) : (
            /* ── Step 1: Confirm ── */
            <>
              {/* Booking summary */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  {booking.fromStationName} <FiArrowRight className="text-orange-500 shrink-0" /> {booking.toStationName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-1">
                  <div><span className="text-gray-400">PNR: </span><span className="font-mono font-semibold text-gray-700">{booking.pnr}</span></div>
                  <div><span className="text-gray-400">Date: </span>{formatDate(booking.journeyDate)}</div>
                  <div><span className="text-gray-400">Depart: </span>{formatTime(booking.departureTime)}</div>
                  <div><span className="text-gray-400">Amount: </span>₹{booking.totalAmountPaid?.toLocaleString("en-IN")}</div>
                </div>
              </div>

              {/* Refund policy preview */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                tier.pct === 0
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}>
                <p className={`text-sm font-semibold ${tier.pct === 0 ? "text-red-700" : "text-amber-700"}`}>
                  Refund estimate
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount paid</span>
                  <span className="font-medium">₹{booking.totalAmountPaid?.toLocaleString("en-IN") ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Refund ({tier.pct}%)</span>
                  <span className={`font-semibold ${tier.pct > 0 ? "text-green-600" : "text-red-500"}`}>
                    {tier.pct > 0 ? `₹${estimatedRefund}` : "₹0 (no refund)"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{tier.label}</p>
                <p className="text-xs text-gray-400">* Exact amount calculated at time of cancellation by APSTS.</p>
              </div>

              {/* Reason input */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">
                  Reason for cancellation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Change in travel plans, medical emergency…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none outline-none focus:border-orange-400 transition-colors"
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">{reason.length}/500</p>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <FiAlertTriangle className="text-amber-500 w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>This action cannot be undone. All passengers on this booking will be cancelled.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Spinner size="w-4 h-4" />}
                  {loading ? "Cancelling…" : "Confirm Cancel"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function MyBookings() {
  const navigate = useNavigate();
  const [filter, setFilter]         = useState("All");
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null); // booking to cancel

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingApi.getMyDetails();
      const raw  = response?.data;
      const list =
        Array.isArray(raw?.data)     ? raw.data     :
        Array.isArray(raw?.content)  ? raw.content  :
        Array.isArray(raw?.bookings) ? raw.bookings :
        Array.isArray(raw)           ? raw           : [];
      setBookings(list);
    } catch (err) {
      setError("Unable to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  /* Called after successful cancel — optimistically update local state */
  const handleCancelled = useCallback((bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? { ...b, bookingStatus: "FULLY_CANCELLED" }
          : b
      )
    );
  }, []);

  /* ── Filter logic ── */
  const filtered = bookings.filter((b) => {
    switch (filter) {
      case "Upcoming":  return isUpcoming(b.journeyDate);
      case "Confirmed": return b.bookingStatus === "CONFIRMED";
      case "Completed": return b.bookingStatus === "COMPLETED";
      case "Cancelled": return b.bookingStatus === "FULLY_CANCELLED";
      case "Pending":   return b.bookingStatus === "PENDING_PAYMENT";
      default:          return true;
    }
  });

  const counts = {
    All:       bookings.length,
    Upcoming:  bookings.filter((b) => isUpcoming(b.journeyDate)).length,
    Confirmed: bookings.filter((b) => b.bookingStatus === "CONFIRMED").length,
    Completed: bookings.filter((b) => b.bookingStatus === "COMPLETED").length,
    Cancelled: bookings.filter((b) => b.bookingStatus === "FULLY_CANCELLED").length,
    Pending:   bookings.filter((b) => b.bookingStatus === "PENDING_PAYMENT").length,
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage all your trips</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => <div key={j} className="h-4 bg-gray-100 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-100">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchBookings}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Cancel modal — rendered at root level to avoid z-index issues */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={handleCancelled}
        />
      )}

      <div className="space-y-5">
        {/* Header + filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage all your trips</p>
          </div>

          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === tab
                    ? "bg-white shadow text-gray-800"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                {counts[tab] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    filter === tab
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border">
            <p className="text-lg mb-1">No bookings found</p>
            <p className="text-sm">
              {filter === "All"
                ? "You haven't made any bookings yet."
                : `No ${filter.toLowerCase()} bookings found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => {
              const statusInfo = STATUS_META[b.bookingStatus] ?? {
                label: b.bookingStatus,
                style: "bg-gray-100 text-gray-600",
              };
              const seats    = Array.isArray(b.seatNumbers) ? b.seatNumbers.join(", ") : (b.seatNumbers ?? "—");
              const upcoming = isUpcoming(b.journeyDate);
              const canCancel = b.bookingStatus === "CONFIRMED" || b.bookingStatus === "PENDING_PAYMENT";

              return (
                <div
                  key={b.bookingId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  {/* Route + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                      {b.fromStationName ?? "—"}
                      <FiArrowRight className="text-orange-500 shrink-0" />
                      {b.toStationName ?? "—"}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {upcoming && b.bookingStatus !== "FULLY_CANCELLED" && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                          Upcoming Trip
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.style}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-500">
                    <div>
                      <p className="text-xs text-gray-400">PNR</p>
                      <p className="font-medium text-gray-700 truncate font-mono text-xs" title={b.pnr}>
                        {b.pnr ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Journey Date</p>
                      <p className="font-medium text-gray-700">{formatDate(b.journeyDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Departure</p>
                      <p className="font-medium text-gray-700">{formatTime(b.departureTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="font-medium text-gray-700">
                        ₹{b.totalAmountPaid?.toLocaleString("en-IN") ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Seats</p>
                      <p className="font-medium text-gray-700">{seats}</p>
                    </div>
                    {b.busTypeName && (
                      <div>
                        <p className="text-xs text-gray-400">Bus Type</p>
                        <p className="font-medium text-gray-700">{b.busTypeName}</p>
                      </div>
                    )}
                    {b.bookingStatus === "FULLY_CANCELLED" && b.cancellationReason && (
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-xs text-gray-400">Cancellation reason</p>
                        <p className="text-xs text-gray-500 italic">{b.cancellationReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigate(`/user/booking/${b.bookingId}`, { state: { booking: b } })}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                    >
                      <FiEye /> View Details
                    </button>

                    {/* Refund tracking — show for cancelled bookings */}
                    {b.bookingStatus === "FULLY_CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => navigate("/user/my-refunds")}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                      >
                        Track Refund →
                      </button>
                    )}

                    {/* Cancel — only for CONFIRMED or PENDING_PAYMENT */}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(b)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors"
                      >
                        <FiX /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}