import { useState, useEffect, useCallback } from "react";
import { refundApi } from "../../api/booking";
import toast from "react-hot-toast";

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
    " " +
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
  TIER_1_FULL_REFUND_APSTS_CANCEL: { pct: "100%", label: "APSTS cancelled — full refund", color: "text-green-300", bg: "bg-green-500/20 border-green-500/40" },
  TIER_2_75PCT_GT_24H:             { pct: "75%",  label: ">24h before departure",         color: "text-blue-300",  bg: "bg-blue-500/20 border-blue-500/40"  },
  TIER_3_50PCT_2TO24H:             { pct: "50%",  label: "2–24h before departure",        color: "text-yellow-300",bg: "bg-yellow-500/20 border-yellow-500/40"},
  TIER_4_NO_REFUND_LT_2H:          { pct: "0%",   label: "<2h before departure",          color: "text-red-300",   bg: "bg-red-500/20 border-red-500/40"    },
};

const STATUS_STYLES = {
  pending:    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  processing: "bg-blue-500/20   text-blue-300   border border-blue-500/40",
  completed:  "bg-green-500/20  text-green-300  border border-green-500/40",
  failed:     "bg-red-500/20    text-red-300    border border-red-500/40",
};

const METHOD_LABEL = {
  WALLET_CREDIT:   "Wallet credit",
  ORIGINAL_SOURCE: "Original source",
  BANK_TRANSFER:   "Bank transfer",
};

const REFUND_METHODS = [
  { value: "ORIGINAL_SOURCE", label: "Original payment source" },
  { value: "BANK_TRANSFER",   label: "Bank transfer" },
  { value: "WALLET_CREDIT",   label: "Wallet credit" },
];

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {status}
    </span>
  );
}

function MetricCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function FareBreakdown({ refund }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Gross fare paid</span>
        <span className="text-white">₹{Number(refund.grossFarePaid).toFixed(2)}</span>
      </div>
      {Number(refund.reservationFeeDeducted) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Reservation fee (non-refundable)</span>
          <span className="text-red-300">− ₹{Number(refund.reservationFeeDeducted).toFixed(2)}</span>
        </div>
      )}
      {Number(refund.deductionAmount) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cancellation penalty</span>
          <span className="text-red-300">− ₹{Number(refund.deductionAmount).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold border-t border-white/10 pt-2 mt-1">
        <span className="text-white">Refund amount</span>
        <span className={Number(refund.refundAmount) > 0 ? "text-green-400" : "text-gray-400"}>
          ₹{Number(refund.refundAmount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function RefundTimeline({ refund }) {
  const steps = [
    { label: "Cancelled",   sub: "Booking cancelled",           done: true },
    { label: "Initiated",   sub: fmtDateTime(refund.initiatedAt), done: !!refund.initiatedAt, active: refund.refundStatus === "pending" },
    { label: "Processing",  sub: refund.refundStatus === "processing" ? "Under review" : "Pending", done: refund.refundStatus === "completed", active: refund.refundStatus === "processing" },
    { label: "Completed",   sub: refund.completedAt ? fmtDateTime(refund.completedAt) : (refund.expectedCreditBy ? "By " + fmtDate(refund.expectedCreditBy) : "Pending"), done: refund.refundStatus === "completed" },
  ];
  return (
    <div className="relative pl-5">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
      {steps.map((s, i) => (
        <div key={i} className="relative mb-4 last:mb-0">
          <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-[#1a3a4a] ${s.done ? "bg-green-400" : s.active ? "bg-yellow-400" : "bg-white/20"}`} />
          <p className="text-sm font-medium text-white">{s.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Process Refund Form ─────────────────────────────────────────────────── */

function ProcessRefundForm({ refund, onSuccess, onCancel }) {
  const [method, setMethod]     = useState(refund.refundMethod ?? "ORIGINAL_SOURCE");
  const [gatewayId, setGatewayId] = useState(refund.gatewayRefundId ?? "");
  const [loading, setLoading]   = useState(false);

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
      toast.error(err?.response?.data?.message ?? "Failed to process refund. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-white/10 mt-4 pt-4 space-y-4">
      <h4 className="text-sm font-semibold text-green-300">Process this refund</h4>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Refund method *</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none"
        >
          {REFUND_METHODS.map((m) => (
            <option key={m.value} value={m.value} className="bg-[#1a3a4a] text-white">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Gateway refund ID{" "}
          <span className="text-gray-500">(optional — from Razorpay dashboard)</span>
        </label>
        <input
          type="text"
          value={gatewayId}
          onChange={(e) => setGatewayId(e.target.value)}
          placeholder="e.g. RZP_RF_abc123"
          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none placeholder-gray-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Spinner size="w-4 h-4" />}
          {loading ? "Processing…" : "Submit & process"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-sm border border-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Mark Completed Form ─────────────────────────────────────────────────── */

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
    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mt-4">
      <div className="flex-1">
        <p className="text-sm text-blue-300 font-medium">Awaiting gateway confirmation</p>
        <p className="text-xs text-blue-300/60 mt-1">
          Gateway refund ID: <span className="font-mono">{refund.gatewayRefundId ?? "Not set"}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleMark}
        disabled={loading || !refund.gatewayRefundId}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        {loading && <Spinner size="w-3 h-3" />}
        Mark completed
      </button>
    </div>
  );
}

/* ─── Refund Detail Panel ─────────────────────────────────────────────────── */

function RefundDetailPanel({ refund, onBack, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const tier = TIER_META[refund.cancellationTier];

  const handleSuccess = () => {
    setShowForm(false);
    onRefresh();
    onBack();
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-5 transition-colors"
      >
        ← Back to refund list
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-orange-300 text-lg font-semibold tracking-wider">
            {refund.refundId}
          </span>
          <StatusBadge status={refund.refundStatus} />
          {tier && (
            <span className={`text-sm font-medium ${tier.color}`}>{tier.pct} refund</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Breakdown */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-green-300 uppercase tracking-wider">Fare breakdown</h3>
          {tier && (
            <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${tier.bg}`}>
              <span className={`font-semibold ${tier.color}`}>{tier.pct}</span>
              <span className="text-gray-300">{tier.label}</span>
            </div>
          )}
          <FareBreakdown refund={refund} />
        </div>

        {/* Timeline */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-4">Timeline</h3>
          <RefundTimeline refund={refund} />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 mb-4">
        <h3 className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-4">Details</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
          {[
            { label: "Booking ID",       value: refund.bookingId,   mono: true },
            { label: "Refund method",    value: METHOD_LABEL[refund.refundMethod] ?? refund.refundMethod },
            { label: "Initiated",        value: fmtDateTime(refund.initiatedAt) },
            { label: "Expected by",      value: fmtDate(refund.expectedCreditBy) },
            { label: "Completed",        value: fmtDateTime(refund.completedAt) },
            { label: "Gateway refund ID", value: refund.gatewayRefundId ?? "—", mono: true },
          ].map((row) => (
            <div key={row.label} className="py-3 border-b border-white/10 last:border-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{row.label}</p>
              <p className={`text-sm text-white font-medium ${row.mono ? "font-mono text-xs" : ""}`}>
                {row.value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {refund.refundStatus === "pending" && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
          {showForm ? (
            <ProcessRefundForm
              refund={refund}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Action required</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  This refund is pending. Process it to initiate the credit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
              >
                Process refund
              </button>
            </div>
          )}
        </div>
      )}

      {refund.refundStatus === "processing" && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-1">Processing</p>
          <p className="text-xs text-gray-400 mb-3">
            Refund is being processed via gateway. Once confirmed, mark it as completed.
          </p>
          <MarkCompletedSection refund={refund} onSuccess={handleSuccess} />
        </div>
      )}

      {refund.refundStatus === "completed" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold">Refund completed</p>
            <p className="text-green-400/70 text-xs mt-0.5">
              ₹{Number(refund.refundAmount).toFixed(2)} credited on {fmtDateTime(refund.completedAt)} via{" "}
              {METHOD_LABEL[refund.refundMethod] ?? refund.refundMethod}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Refund Table Row ────────────────────────────────────────────────────── */

function RefundTableRow({ refund, onClick }) {
  const tier = TIER_META[refund.cancellationTier];
  return (
    <tr
      onClick={onClick}
      className="border-t border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-orange-300">{refund.refundId?.slice(0, 8)}…</span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-gray-300">{refund.bookingId?.slice(0, 8)}…</span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={refund.refundStatus} />
      </td>
      <td className="px-4 py-3">
        {tier ? (
          <span className={`text-xs font-medium ${tier.color}`}>{tier.pct}</span>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold ${Number(refund.refundAmount) > 0 ? "text-green-400" : "text-gray-500"}`}>
          ₹{Number(refund.refundAmount).toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">{METHOD_LABEL[refund.refundMethod] ?? refund.refundMethod}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">{fmtDateTime(refund.initiatedAt)}</span>
      </td>
      <td className="px-4 py-3 text-gray-600">›</td>
    </tr>
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────────────── */

export default function RefundsPage() {
  const [refunds, setRefunds]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  const loadRefunds = useCallback(() => {
    setLoading(true);
    refundApi.getAll()
      .then((res) => setRefunds(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load refunds."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

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

  return (
    <div className="w-full min-h-screen text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-8 pb-12">
      <div className="max-w-6xl mx-auto">

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
                <h1 className="text-2xl font-semibold">Refund management</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Review, process, and track all customer refunds
                </p>
              </div>
              <button
                type="button"
                onClick={loadRefunds}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm border border-white/10 transition-colors disabled:opacity-50"
              >
                {loading ? <Spinner size="w-4 h-4" /> : "↻"} Refresh
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Pending"         value={pending}                             color="text-yellow-300" />
              <MetricCard label="Processing"      value={processing}                          color="text-blue-300"   />
              <MetricCard label="Completed"       value={completed}                           color="text-green-300"  />
              <MetricCard label="Total refunded"  value={`₹${totalAmt.toFixed(2)}`}                                  />
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap items-center">
              <input
                type="text"
                placeholder="Search refund ID or booking ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none placeholder-gray-500"
              />
              {["all", "pending", "processing", "completed"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                    filter === s
                      ? "bg-white text-[#0f2027] border-white"
                      : "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                  <Spinner /> Loading refunds…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <span className="text-5xl">📋</span>
                  <p className="text-lg">No refunds found</p>
                  <p className="text-sm text-gray-500">
                    {search || filter !== "all" ? "Try adjusting your filter." : "All refunds will appear here."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">Refund ID</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">Booking ID</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">Tier</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">Method</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">Initiated</th>
                        <th className="px-4 py-3" />
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

            {/* Pending action banner */}
            {pending > 0 && (
              <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
                <span className="text-xl">⚠️</span>
                <p>
                  <span className="font-semibold">{pending} refund{pending > 1 ? "s" : ""}</span>{" "}
                  require{pending === 1 ? "s" : ""} processing. Click on a pending refund to take action.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
