import { useState, useCallback, useEffect } from "react";
import { refundApi } from "../../api/booking";
import toast from "react-hot-toast";
import {
  RefreshCw, ArrowLeft, CheckCircle2, Clock, AlertTriangle,
  Banknote, Wallet, CreditCard, Search, ChevronRight,
  CircleDot, Loader2, BadgeCheck, Ban
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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

/* ─── Constants ───────────────────────────────────────────────────────────── */

const TIER_META = {
  TIER_1_FULL_REFUND_APSTS_CANCEL: { pct: "100%", label: "APSTS cancelled — full refund",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  TIER_2_75PCT_GT_24H:             { pct: "75%",  label: ">24 h before departure",          color: "text-blue-700",    bg: "bg-blue-50 border-blue-200"     },
  TIER_3_50PCT_2TO24H:             { pct: "50%",  label: "2–24 h before departure",         color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
  TIER_4_NO_REFUND_LT_2H:          { pct: "0%",   label: "<2 h before departure",           color: "text-red-700",     bg: "bg-red-50 border-red-200"       },
};

const STATUS_META = {
  pending:    { label: "Pending",    icon: Clock,         cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"   },
  processing: { label: "Processing", icon: Loader2,       cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"      },
  completed:  { label: "Completed",  icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  failed:     { label: "Failed",     icon: Ban,           cls: "bg-red-50 text-red-600 ring-1 ring-red-200"         },
};

const METHOD_META = {
  WALLET_CREDIT:   { label: "Wallet credit",   icon: Wallet    },
  ORIGINAL_SOURCE: { label: "Original source", icon: CreditCard },
  BANK_TRANSFER:   { label: "Bank transfer",   icon: Banknote  },
};

const REFUND_METHODS = [
  { value: "ORIGINAL_SOURCE", label: "Original payment source" },
  { value: "BANK_TRANSFER",   label: "Bank transfer"           },
  { value: "WALLET_CREDIT",   label: "Wallet credit"           },
];

/* ─── Shared classes ──────────────────────────────────────────────────────── */
const inputCls = `w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-200
  rounded-lg outline-none transition-all
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100
  placeholder:text-slate-300`;

const selectCls = `${inputCls} cursor-pointer`;

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
function Spin({ size = 16 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

/* ─── StatusBadge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${meta.cls}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

/* ─── MetricCard ──────────────────────────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, accent = "blue" }) {
  const accentMap = {
    amber:   "text-amber-600 bg-amber-50",
    blue:    "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    slate:   "text-slate-600 bg-slate-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentMap[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── FareBreakdown ───────────────────────────────────────────────────────── */
function FareBreakdown({ refund }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Gross fare paid</span>
        <span className="text-slate-800 font-medium">₹{Number(refund.grossFarePaid).toFixed(2)}</span>
      </div>
      {Number(refund.reservationFeeDeducted) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Reservation fee (non-refundable)</span>
          <span className="text-red-600">− ₹{Number(refund.reservationFeeDeducted).toFixed(2)}</span>
        </div>
      )}
      {Number(refund.deductionAmount) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Cancellation penalty</span>
          <span className="text-red-600">− ₹{Number(refund.deductionAmount).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold border-t border-slate-100 pt-2 mt-1">
        <span className="text-slate-800">Refund amount</span>
        <span className={Number(refund.refundAmount) > 0 ? "text-emerald-600" : "text-slate-400"}>
          ₹{Number(refund.refundAmount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ─── RefundTimeline ──────────────────────────────────────────────────────── */
function RefundTimeline({ refund }) {
  const steps = [
    {
      label: "Cancelled",
      sub: "Booking cancelled",
      done: true,
    },
    {
      label: "Initiated",
      sub: fmtDateTime(refund.initiatedAt),
      done: !!refund.initiatedAt,
      active: refund.refundStatus === "pending",
    },
    {
      label: "Processing",
      sub: refund.refundStatus === "processing"
        ? "Awaiting gateway confirmation"
        : refund.refundStatus === "completed" ? "Processed" : "Pending",
      done: refund.refundStatus === "completed",
      active: refund.refundStatus === "processing",
    },
    {
      label: "Completed",
      sub: refund.completedAt
        ? fmtDateTime(refund.completedAt)
        : refund.expectedCreditBy
          ? "By " + fmtDate(refund.expectedCreditBy)
          : "Pending",
      done: refund.refundStatus === "completed",
    },
  ];

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />
      {steps.map((s, i) => (
        <div key={i} className="relative mb-5 last:mb-0">
          <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2
            ${s.done ? "bg-emerald-500 ring-emerald-300" : s.active ? "bg-amber-400 ring-amber-200" : "bg-slate-200 ring-slate-100"}`}
          />
          <p className="text-sm font-medium text-slate-700">{s.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── AutoRefundInfoBanner ────────────────────────────────────────────────── */
/**
 * Shows context about how the refund was/will be processed automatically.
 * Only shows the manual process form for BANK_TRANSFER (cash counter) or failed online refunds.
 */
function AutoRefundInfoBanner({ refund }) {
  const isOnline = refund.refundMethod === "ORIGINAL_SOURCE";
  const isWallet = refund.refundMethod === "WALLET_CREDIT";
  const isCash   = refund.refundMethod === "BANK_TRANSFER";

  if (isWallet) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <Wallet className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-800">Wallet refund — auto-processed</p>
          <p className="text-xs text-emerald-700/70 mt-0.5">
            Credits were applied to the customer's wallet immediately upon cancellation. No manual action required.
          </p>
        </div>
      </div>
    );
  }
  if (isOnline) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Online payment — Razorpay auto-refund</p>
          <p className="text-xs text-blue-700/70 mt-0.5">
            A refund was automatically triggered via Razorpay upon cancellation.
            Status will update to <span className="font-semibold">Completed</span> once the Razorpay webhook fires.
            If stuck in <span className="font-semibold">pending</span> the gateway call may have failed — use the manual override below.
          </p>
        </div>
      </div>
    );
  }
  if (isCash) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <Banknote className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Cash counter booking — manual bank transfer required</p>
          <p className="text-xs text-amber-700/70 mt-0.5">
            This booking was paid at a cash counter. Transfer the refund amount to the customer's bank account,
            then use the form below to confirm and record the transaction.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

/* ─── ProcessRefundForm — only for BANK_TRANSFER or failed online ─────────── */
function ProcessRefundForm({ refund, onSuccess, onCancel }) {
  const [method,    setMethod]    = useState(refund.refundMethod ?? "BANK_TRANSFER");
  const [gatewayId, setGatewayId] = useState(refund.gatewayRefundId ?? "");
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await refundApi.process({
        refundId:        refund.refundId,
        refundMethod:    method,
        gatewayRefundId: gatewayId.trim() || null,
      });
      toast.success("Refund submitted for processing.");
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to process refund.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-slate-100 mt-4 pt-4 space-y-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manual override</h4>

      <div>
        <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Refund method *</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={selectCls}>
          {REFUND_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">
          Gateway refund ID <span className="text-slate-400 normal-case font-normal">(from Razorpay dashboard)</span>
        </label>
        <input
          type="text"
          value={gatewayId}
          onChange={(e) => setGatewayId(e.target.value)}
          placeholder="e.g. rfnd_RZP_abc123"
          className={inputCls}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spin size={14} /> : <BadgeCheck className="w-4 h-4" />}
          {loading ? "Processing…" : "Submit & process"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── MarkCompletedSection ────────────────────────────────────────────────── */
function MarkCompletedSection({ refund, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleMark = async () => {
    if (!refund.gatewayRefundId) {
      toast.error("Gateway refund ID is required to mark as completed.");
      return;
    }
    setLoading(true);
    try {
      await refundApi.markCompleted(refund.gatewayRefundId);
      toast.success("Refund marked as completed.");
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to mark refund as completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 mt-4">
      <div>
        <p className="text-sm font-medium text-blue-800">Awaiting Razorpay webhook confirmation</p>
        <p className="text-xs text-blue-700/70 mt-0.5">
          Gateway refund ID: <span className="font-mono font-semibold">{refund.gatewayRefundId ?? "Not set"}</span>
        </p>
        <p className="text-xs text-blue-700/60 mt-1">
          In test mode, webhooks don't fire automatically — use this button to simulate completion.
        </p>
      </div>
      <button
        type="button"
        onClick={handleMark}
        disabled={loading || !refund.gatewayRefundId}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        {loading ? <Spin size={12} /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        Mark completed
      </button>
    </div>
  );
}

/* ─── Helper — should show manual process form? ───────────────────────────── */
function canManuallyProcess(refund) {
  // Only for: cash counter payments, OR online refunds where gateway call failed (no gatewayRefundId)
  return (
    refund.refundStatus === "pending" &&
    (refund.refundMethod === "BANK_TRANSFER" || !refund.gatewayRefundId)
  );
}

/* ─── RefundDetailPanel ───────────────────────────────────────────────────── */
function RefundDetailPanel({ refund, onBack, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const tier = TIER_META[refund.cancellationTier];
  const methodMeta = METHOD_META[refund.refundMethod];
  const MethodIcon = methodMeta?.icon ?? CreditCard;

  const handleSuccess = () => {
    setShowForm(false);
    onRefresh();
    onBack();
  };

  return (
    <div>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to refunds
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="font-mono text-blue-600 text-lg font-semibold tracking-wider">
          {refund.refundId}
        </span>
        <StatusBadge status={refund.refundStatus} />
        {tier && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
            {tier.pct} refund — {tier.label}
          </span>
        )}
      </div>

      {/* Auto-refund context banner */}
      <div className="mb-4">
        <AutoRefundInfoBanner refund={refund} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fare breakdown</h3>
          <FareBreakdown refund={refund} />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Timeline</h3>
          <RefundTimeline refund={refund} />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-4">
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6">
          {[
            { label: "Booking ID",         value: refund.bookingId,                                   mono: true  },
            { label: "Refund method",       value: methodMeta?.label ?? refund.refundMethod                       },
            { label: "Initiated",           value: fmtDateTime(refund.initiatedAt)                                },
            { label: "Expected by",         value: fmtDate(refund.expectedCreditBy)                               },
            { label: "Completed",           value: fmtDateTime(refund.completedAt)                                },
            { label: "Gateway refund ID",   value: refund.gatewayRefundId ?? "—",                     mono: true  },
          ].map((row) => (
            <div key={row.label} className="py-3 border-b border-slate-100 last:border-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">{row.label}</p>
              <p className={`text-sm text-slate-700 font-medium ${row.mono ? "font-mono text-xs" : ""}`}>
                {row.value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action panels based on status & payment method ── */}

      {/* PENDING — manual process only for cash/failed-online */}
      {refund.refundStatus === "pending" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          {canManuallyProcess(refund) ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Action required</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {refund.refundMethod === "BANK_TRANSFER"
                      ? "Transfer the refund to the customer's bank account, then confirm below."
                      : "The Razorpay refund call may have failed. Process manually or retry via Razorpay dashboard."}
                  </p>
                </div>
                {!showForm && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex-shrink-0"
                  >
                    <MethodIcon className="w-4 h-4" />
                    Process manually
                  </button>
                )}
              </div>
              {showForm && (
                <ProcessRefundForm
                  refund={refund}
                  onSuccess={handleSuccess}
                  onCancel={() => setShowForm(false)}
                />
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">Auto-refund initiated</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Razorpay refund was triggered automatically. Waiting for gateway response.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROCESSING — waiting for webhook, or manual mark in dev/test */}
      {refund.refundStatus === "processing" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800">Processing via Razorpay</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-1">
            The refund is in flight. In production, the Razorpay webhook will mark it completed automatically.
            In test/dev mode, trigger completion manually.
          </p>
          <MarkCompletedSection refund={refund} onSuccess={handleSuccess} />
        </div>
      )}

      {/* COMPLETED */}
      {refund.refundStatus === "completed" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Refund completed</p>
            <p className="text-xs text-emerald-700/70 mt-0.5">
              ₹{Number(refund.refundAmount).toFixed(2)} credited on {fmtDateTime(refund.completedAt)} via{" "}
              {methodMeta?.label ?? refund.refundMethod}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── RefundTableRow ──────────────────────────────────────────────────────── */
function RefundTableRow({ refund, onClick }) {
  const tier = TIER_META[refund.cancellationTier];
  const methodMeta = METHOD_META[refund.refundMethod];
  const MethodIcon = methodMeta?.icon ?? CreditCard;
  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors group"
    >
      <td className="px-5 py-3.5">
        <span className="font-mono text-xs text-blue-600 font-medium">{refund.refundId?.slice(0, 8)}…</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="font-mono text-xs text-slate-500">{refund.bookingId?.slice(0, 8)}…</span>
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={refund.refundStatus} />
      </td>
      <td className="px-5 py-3.5">
        {tier
          ? <span className={`text-[11px] font-semibold ${tier.color}`}>{tier.pct}</span>
          : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className={`text-sm font-semibold ${Number(refund.refundAmount) > 0 ? "text-emerald-700" : "text-slate-400"}`}>
          ₹{Number(refund.refundAmount).toFixed(2)}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <MethodIcon className="w-3.5 h-3.5 text-slate-400" />
          {methodMeta?.label ?? refund.refundMethod}
        </span>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-400">{fmtDateTime(refund.initiatedAt)}</td>
      <td className="px-5 py-3.5 text-slate-300 group-hover:text-slate-500 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────────────── */
export default function RefundsPage() {
  const [refunds,  setRefunds]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    document.title = "Refund | APSTS Admin Portal";
  }, []);

  const loadRefunds = useCallback(() => {
    setLoading(true);
    // Uses refundApi.getAll() — shows ALL refunds (pending, processing, completed)
    // as per the updated RefundService which auto-processes online payments
    refundApi.getAll()
      .then((res) => setRefunds(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load refunds."))
      .finally(() => setLoading(false));
  }, []);

  // Load on mount
  useState(() => { loadRefunds(); }, []);

  const filtered = refunds.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.refundId?.toLowerCase().includes(q) || r.bookingId?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || r.refundStatus === filter;
    return matchSearch && matchFilter;
  });

  /* metrics */
  const pending    = refunds.filter((r) => r.refundStatus === "pending").length;
  const processing = refunds.filter((r) => r.refundStatus === "processing").length;
  const completed  = refunds.filter((r) => r.refundStatus === "completed").length;
  const totalAmt   = refunds.reduce((s, r) => s + Number(r.refundAmount ?? 0), 0);

  // Pending that actually need human action (cash counter or failed online)
  const needsAction = refunds.filter(
    (r) => r.refundStatus === "pending" &&
    (r.refundMethod === "BANK_TRANSFER" || !r.gatewayRefundId)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {selected ? (
          <RefundDetailPanel
            refund={selected}
            onBack={() => setSelected(null)}
            onRefresh={loadRefunds}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Refund management</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Online payments are refunded automatically via Razorpay. Manual action only needed for cash bookings.
                </p>
              </div>
              <button
                type="button"
                onClick={loadRefunds}
                disabled={loading}
                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Pending"        value={pending}                   icon={Clock}        accent="amber"   />
              <MetricCard label="Processing"     value={processing}                icon={Loader2}      accent="blue"    />
              <MetricCard label="Completed"      value={completed}                 icon={CheckCircle2} accent="emerald" />
              <MetricCard label="Total refunded" value={`₹${totalAmt.toFixed(2)}`} icon={Banknote}     accent="slate"   />
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search refund ID or booking ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </div>
              {["all", "pending", "processing", "completed"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`h-9 px-4 rounded-xl text-sm font-medium border transition-colors capitalize ${
                    filter === s
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                  <Spin size={20} /> Loading refunds…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                  <CircleDot className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No refunds found</p>
                  <p className="text-xs text-slate-400">
                    {search || filter !== "all" ? "Try adjusting your filter." : "All refunds will appear here."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Refund ID", "Booking ID", "Status", "Tier", "Amount", "Method", "Initiated", ""].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider last:w-8">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <RefundTableRow
                          key={r.refundId}
                          refund={r}
                          onClick={() => setSelected(r)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action-needed banner — only for cash/failed refunds, not all pending */}
            {needsAction > 0 && (
              <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p>
                  <span className="font-semibold">{needsAction} refund{needsAction > 1 ? "s" : ""}</span> require{needsAction === 1 ? "s" : ""} manual action
                  (cash counter bookings or failed online refunds). Click to process.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}