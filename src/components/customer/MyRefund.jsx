import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiClock, FiAlertCircle, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { refundApi, bookingApi } from "../../api/booking";
import toast from "react-hot-toast";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return (
    dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " · " +
    dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
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

const TIER_META = {
  TIER_1_FULL_REFUND_APSTS_CANCEL: {
    pct: "100%", shortLabel: "Full refund",
    label: "APSTS cancelled the service — full refund including reservation fee.",
    badgeStyle: "bg-green-100 text-green-700",
    bannerStyle: "bg-green-50 border-green-200 text-green-800",
    icon: <FiCheckCircle className="text-green-500 w-4 h-4 shrink-0 mt-0.5" />,
  },
  TIER_2_75PCT_GT_24H: {
    pct: "75%", shortLabel: "75% refund",
    label: "Cancelled more than 24h before departure. 25% cancellation penalty applied.",
    badgeStyle: "bg-blue-100 text-blue-700",
    bannerStyle: "bg-blue-50 border-blue-200 text-blue-800",
    icon: <FiCheckCircle className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" />,
  },
  TIER_3_50PCT_2TO24H: {
    pct: "50%", shortLabel: "50% refund",
    label: "Cancelled 2–24h before departure. 50% cancellation penalty applied.",
    badgeStyle: "bg-amber-100 text-amber-700",
    bannerStyle: "bg-amber-50 border-amber-200 text-amber-800",
    icon: <FiAlertCircle className="text-amber-500 w-4 h-4 shrink-0 mt-0.5" />,
  },
  TIER_4_NO_REFUND_LT_2H: {
    pct: "0%", shortLabel: "No refund",
    label: "Cancelled less than 2h before departure. No refund applicable per APSTS policy.",
    badgeStyle: "bg-red-100 text-red-700",
    bannerStyle: "bg-red-50 border-red-200 text-red-800",
    icon: <FiAlertCircle className="text-red-500 w-4 h-4 shrink-0 mt-0.5" />,
  },
};

const STATUS_META = {
  pending:    { label: "Pending",    style: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  processing: { label: "Processing", style: "bg-blue-100 text-blue-700",    dot: "bg-blue-400"   },
  completed:  { label: "Completed",  style: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  failed:     { label: "Failed",     style: "bg-red-100 text-red-600",      dot: "bg-red-500"    },
};

const METHOD_LABEL = {
  WALLET_CREDIT:   "Wallet credit",
  ORIGINAL_SOURCE: "Original payment source",
  BANK_TRANSFER:   "Bank transfer",
  CHEQUE:          "Cheque",
};

/* ─── Status Badge ────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const meta = STATUS_META[status?.toLowerCase()] ?? { label: status, style: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ─── Tier Badge ──────────────────────────────────────────────────────────── */

function TierBadge({ tier }) {
  const meta = TIER_META[tier];
  if (!meta) return null;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.badgeStyle}`}>
      {meta.shortLabel}
    </span>
  );
}

/* ─── Fare Breakdown ──────────────────────────────────────────────────────── */

function FareBreakdown({ refund }) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Gross fare paid</span>
        <span className="font-medium text-gray-700">₹{Number(refund.grossFarePaid).toFixed(2)}</span>
      </div>
      {Number(refund.reservationFeeDeducted) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Reservation fee (non-refundable)</span>
          <span className="text-red-500">− ₹{Number(refund.reservationFeeDeducted).toFixed(2)}</span>
        </div>
      )}
      {Number(refund.deductionAmount) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Cancellation penalty</span>
          <span className="text-red-500">− ₹{Number(refund.deductionAmount).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2.5 mt-1">
        <span className="text-gray-700">Refund amount</span>
        <span className={Number(refund.refundAmount) > 0 ? "text-green-600" : "text-gray-400"}>
          ₹{Number(refund.refundAmount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ─── Refund Timeline ─────────────────────────────────────────────────────── */

function RefundTimeline({ refund }) {
  const status = refund.refundStatus?.toLowerCase();
  const steps = [
    { label: "Booking cancelled",  sub: "Cancellation confirmed",          done: true },
    { label: "Refund initiated",   sub: fmtDateTime(refund.initiatedAt),   done: !!refund.initiatedAt, active: status === "pending" },
    { label: "Processing",         sub: status === "processing" ? "Under review by accounts team" : "Pending", done: status === "completed", active: status === "processing" },
    { label: "Credited",           sub: refund.completedAt ? fmtDateTime(refund.completedAt) : (refund.expectedCreditBy ? "By " + fmtDate(refund.expectedCreditBy) : "Pending"), done: status === "completed" },
  ];

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />
      {steps.map((s, i) => (
        <div key={i} className="relative mb-5 last:mb-0">
          <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ${
            s.done   ? "bg-green-500 ring-green-300" :
            s.active ? "bg-amber-400 ring-amber-300 animate-pulse" :
                       "bg-gray-200 ring-gray-200"
          }`} />
          <p className={`text-sm font-medium ${s.done || s.active ? "text-gray-800" : "text-gray-400"}`}>{s.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Refund Detail View ──────────────────────────────────────────────────── */

function RefundDetail({ refund, onBack }) {
  const tier   = TIER_META[refund.cancellationTier];
  const status = STATUS_META[refund.refundStatus?.toLowerCase()];

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <FiArrowLeft /> Back to my refunds
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Refund ID</p>
            <p className="font-mono text-sm font-semibold text-gray-700">
              {refund.refundId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tier && <TierBadge tier={refund.cancellationTier} />}
            <StatusBadge status={refund.refundStatus} />
          </div>
        </div>

        {/* Tier explanation */}
        {tier && (
          <div className={`flex items-start gap-2 mt-4 p-3 rounded-xl border text-sm ${tier.bannerStyle}`}>
            {tier.icon}
            <p>{tier.label}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Fare breakdown</h3>
          <FareBreakdown refund={refund} />
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Refund method</p>
            <p className="text-sm font-medium text-gray-700">
              {METHOD_LABEL[refund.refundMethod] ?? refund.refundMethod}
            </p>
          </div>
          {refund.gatewayRefundId && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Gateway refund ID</p>
              <p className="text-xs font-mono text-gray-600">{refund.gatewayRefundId}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Refund timeline</h3>
          <RefundTimeline refund={refund} />

          {(refund.refundStatus === "pending" || refund.refundStatus === "processing") && refund.expectedCreditBy && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700">
              <FiClock className="w-4 h-4 shrink-0" />
              Expected credit by <span className="font-semibold ml-1">{fmtDate(refund.expectedCreditBy)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Completion banner */}
      {refund.refundStatus === "completed" && Number(refund.refundAmount) > 0 && (
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700">
          <FiCheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
          <div>
            <p className="font-semibold">Refund credited successfully</p>
            <p className="text-green-600 text-xs mt-0.5">
              ₹{Number(refund.refundAmount).toFixed(2)} was credited on {fmtDateTime(refund.completedAt)} via{" "}
              {METHOD_LABEL[refund.refundMethod] ?? refund.refundMethod}.
            </p>
          </div>
        </div>
      )}

      {Number(refund.refundAmount) === 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">
          <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">No refund applicable</p>
            <p className="text-red-500 text-xs mt-0.5">
              Cancelled within 2 hours of departure — Tier 4 policy applies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Refund List Card ────────────────────────────────────────────────────── */

function RefundCard({ refund, onClick }) {
  const tier   = TIER_META[refund.cancellationTier];
  const status = STATUS_META[refund.refundStatus?.toLowerCase()];
  const amt    = Number(refund.refundAmount ?? 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Refund ID + badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-gray-500">
              {refund.refundId?.slice(0, 8)}…
            </span>
            <StatusBadge status={refund.refundStatus} />
            {tier && <TierBadge tier={refund.cancellationTier} />}
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-500">
            <div>
              <span className="text-gray-400">Booking: </span>
              <span className="font-mono text-gray-600">{refund.bookingId?.slice(0, 8)}…</span>
            </div>
            <div>
              <span className="text-gray-400">Method: </span>
              <span>{METHOD_LABEL[refund.refundMethod] ?? refund.refundMethod}</span>
            </div>
            <div>
              <span className="text-gray-400">Initiated: </span>
              <span>{fmtDate(refund.initiatedAt)}</span>
            </div>
            {refund.expectedCreditBy && refund.refundStatus !== "completed" && (
              <div className="flex items-center gap-1 text-amber-600">
                <FiClock className="w-3 h-3" />
                <span>By {fmtDate(refund.expectedCreditBy)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount + arrow */}
        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          <span className={`text-xl font-bold ${amt > 0 ? "text-green-600" : "text-gray-400"}`}>
            ₹{amt.toFixed(2)}
          </span>
          <FiChevronRight className="text-gray-300 w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function MyRefunds() {
  const navigate = useNavigate();
  const [refunds, setRefunds]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected]       = useState(null);
  const [error, setError]             = useState(null);

  useEffect(() => {
    document.title = "Refund | APSTS Passenger Portal";
  }, []);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Preferred: dedicated /refunds/my endpoint (see INTEGRATION.md)
      // Falls back to /bookings/my/details → filter bookings that carry a refund object
      let list = [];
      try {
        const res = await refundApi.getMine();
        list = res.data?.data ?? res.data ?? [];
      } catch {
        // Fallback: get all bookings and pluck refund objects
        const res     = await bookingApi.getMyDetails();
        const bookings = res.data?.data ?? res.data ?? [];
        list = bookings
          .filter((b) => b.refund)
          .map((b) => b.refund);
      }
      setRefunds(list);
    } catch {
      setError("Unable to load your refunds. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  const openDetail = async (bookingId) => {
    setDetailLoading(true);
    try {
      const res = await refundApi.getByBookingId(bookingId);
      setSelected(res.data?.data ?? res.data);
    } catch {
      toast.error("Failed to load refund details.");
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Refunds</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track the status of all your cancellation refunds</p>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => <div key={j} className="h-3 bg-gray-100 rounded" />)}
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
        <h2 className="text-2xl font-bold text-gray-800">My Refunds</h2>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-100">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            type="button"
            onClick={loadRefunds}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {selected ? (
        <RefundDetail refund={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">My Refunds</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Track the status of all your cancellation refunds
              </p>
            </div>
            <button
              type="button"
              onClick={loadRefunds}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors self-start sm:self-auto"
            >
              <FiRefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Policy info */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">APSTS Cancellation Refund Policy</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-blue-600">
                <p>✅ APSTS cancelled service → 100% refund</p>
                <p>🔵 Cancelled &gt;24h before → 75% refund</p>
                <p>🟡 Cancelled 2–24h before → 50% refund</p>
                <p>🔴 Cancelled &lt;2h before → no refund</p>
              </div>
              <p className="text-xs text-blue-500 mt-1.5">
                Refunds to original source take 5–7 business days. Wallet credits are instant.
              </p>
            </div>
          </div>

          {/* Empty state */}
          {refunds.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border">
              <p className="text-5xl mb-3">🎟️</p>
              <p className="text-lg font-medium mb-1">No refunds found</p>
              <p className="text-sm">Refunds appear here after a booking is cancelled.</p>
              <button
                type="button"
                onClick={() => navigate("/user/my-bookings")}
                className="mt-5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
              >
                View My Bookings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map((r) => (
                <RefundCard
                  key={r.refundId}
                  refund={r}
                  onClick={() => openDetail(r.bookingId)}
                />
              ))}
            </div>
          )}

          {detailLoading && (
            <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
              <Spinner size="w-4 h-4" /> Loading refund details…
            </div>
          )}
        </>
      )}
    </div>
  );
}
