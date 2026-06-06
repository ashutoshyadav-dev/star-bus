import { useState, useEffect, useCallback } from "react";
import { notificationApi } from "../../api/notificationApi";

// ── Constants ────────────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  "booking_confirmed", "booking_cancelled", "payment_success",
  "payment_failed", "grievance_update", "otp", "general",
  "schedule_change", "seat_reminder",
];

const CHANNELS = ["push", "sms", "email", "whatsapp", "in_app"];

const CHANNEL_LABELS = {
  push: "Push", sms: "SMS", email: "Email", whatsapp: "WhatsApp", in_app: "In-App",
};

const STATUS_META = {
  sent:    { bg: "bg-green-100",  text: "text-green-800",  label: "Delivered" },
  read:    { bg: "bg-gray-100",   text: "text-gray-600",   label: "Read"      },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending"   },
  failed:  { bg: "bg-red-100",    text: "text-red-800",    label: "Failed"    },
};

const TABS = ["list", "send", "broadcast", "retry"];
const TAB_LABELS = {
  list:      "All notifications",
  send:      "Manual send",
  broadcast: "Broadcast",
  retry:     "Retry failed",
};

// ── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Shared sub-components ────────────────────────────────────────────────────

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/60 focus:bg-white/10 transition-colors";

function ActionButton({ onClick, disabled, loading, children, variant = "primary" }) {
  const base = "text-sm px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-default";
  const styles = variant === "primary"
    ? `${base} bg-blue-600 hover:bg-blue-500 text-white`
    : `${base} border border-white/10 text-gray-300 hover:bg-white/10`;
  return (
    <button onClick={onClick} disabled={disabled || loading} className={styles}>
      {loading ? "Working…" : children}
    </button>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  const styles = type === "success"
    ? "bg-green-900/40 border border-green-700/40 text-green-300"
    : "bg-red-900/40 border border-red-700/40 text-red-300";
  return (
    <div className={`text-sm px-4 py-2.5 rounded-lg font-medium mt-3 ${styles}`}>
      {message}
    </div>
  );
}

// ── Tab: All notifications list ──────────────────────────────────────────────

function AdminListTab() {
  const [rows,       setRows]       = useState([]);
  const [filters,    setFilters]    = useState({ userId: "", status: "", channel: "", type: "" });
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(async (f, p) => {
    setLoading(true); setError(null);
    try {
      const res  = await notificationApi.adminList(
        {
          userId:  f.userId  || undefined,
          status:  f.status  || undefined,
          channel: f.channel || undefined,
          type:    f.type    || undefined,
        },
        p, 25
      );
      const data = res.data?.data ?? res.data;
      setRows(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page, load]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-3">

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <input
          className={inputCls}
          placeholder="Filter by user ID…"
          value={filters.userId}
          onChange={(e) => handleFilterChange("userId", e.target.value)}
        />
        <select
          className={inputCls}
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {["pending", "sent", "read", "failed"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          className={inputCls}
          value={filters.channel}
          onChange={(e) => handleFilterChange("channel", e.target.value)}
        >
          <option value="">All channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
        </select>
        <select
          className={inputCls}
          value={filters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
        >
          <option value="">All types</option>
          {NOTIFICATION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-center text-xs text-gray-500 py-8">Loading…</p>
      )}
      {!loading && error && (
        <p className="text-sm text-red-400 text-center py-4">{error}</p>
      )}
      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">No notifications found.</p>
      )}

      {/* Table */}
      {!loading && rows.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {["ID", "User", "Type", "Title / Body", "Channel", "Status", "Sent"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10.5px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((n, i) => {
                  const meta = STATUS_META[n.status] ?? STATUS_META.read;
                  return (
                    <tr
                      key={n.id}
                      className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                    >
                      <td className="px-3 py-2.5 text-gray-500">{n.id}</td>
                      <td className="px-3 py-2.5 text-gray-400 truncate max-w-[100px]">
                        {n.userId ? String(n.userId).slice(0, 8) + "…" : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-300">
                        {n.notificationType?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 max-w-[200px]">
                        <div className="font-medium text-gray-200 truncate">{n.title}</div>
                        <div className="text-gray-500 truncate text-[11px]">{n.body}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-400">
                        {CHANNEL_LABELS[n.channel] ?? n.channel}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        {timeAgo(n.sentAt ?? n.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="hover:text-gray-200 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            ← Prev
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="hover:text-gray-200 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Manual send ─────────────────────────────────────────────────────────

function AdminSendTab() {
  const EMPTY = { userId: "", notificationType: "", channel: "", title: "", body: "", referenceType: "", referenceId: "" };
  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.userId || !form.notificationType || !form.channel || !form.body) {
      setToast({ message: "User ID, type, channel and body are required.", type: "error" });
      return;
    }
    setLoading(true); setToast(null);
    try {
      await notificationApi.adminSend({
        userId:           form.userId,
        notificationType: form.notificationType,
        channel:          form.channel,
        title:            form.title        || undefined,
        body:             form.body,
        referenceType:    form.referenceType || undefined,
        referenceId:      form.referenceId   || undefined,
      });
      setToast({ message: "Notification sent successfully.", type: "success" });
      setForm(EMPTY);
    } catch (e) {
      setToast({ message: e.response?.data?.message ?? e.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <FieldRow label="User ID (UUID)">
        <input
          className={inputCls}
          placeholder="550e8400-e29b-41d4-a716-446655440000"
          value={form.userId}
          onChange={(e) => set("userId", e.target.value)}
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Notification type">
          <select className={inputCls} value={form.notificationType} onChange={(e) => set("notificationType", e.target.value)}>
            <option value="">Select type…</option>
            {NOTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Channel">
          <select className={inputCls} value={form.channel} onChange={(e) => set("channel", e.target.value)}>
            <option value="">Select channel…</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
          </select>
        </FieldRow>
      </div>

      <FieldRow label="Title (optional)">
        <input
          className={inputCls}
          placeholder="Short title, max 160 chars"
          maxLength={160}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </FieldRow>

      <FieldRow label="Body">
        <textarea
          className={`${inputCls} resize-y min-h-[72px] leading-relaxed`}
          placeholder="Notification body text…"
          rows={3}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
        />
      </FieldRow>

      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Reference type (optional)">
          <input
            className={inputCls}
            placeholder="e.g. booking, grievance"
            value={form.referenceType}
            onChange={(e) => set("referenceType", e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Reference ID (optional)">
          <input
            className={inputCls}
            placeholder="e.g. BK-2847"
            value={form.referenceId}
            onChange={(e) => set("referenceId", e.target.value)}
          />
        </FieldRow>
      </div>

      <div className="flex gap-2 mt-1">
        <ActionButton onClick={handleSubmit} loading={loading}>Send notification</ActionButton>
        <ActionButton onClick={() => { setForm(EMPTY); setToast(null); }} variant="secondary">Clear</ActionButton>
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

// ── Tab: Broadcast ───────────────────────────────────────────────────────────

function AdminBroadcastTab() {
  const EMPTY = { targetUserIds: "", channels: [], notificationType: "", title: "", body: "" };
  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleChannel = (ch) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter((c) => c !== ch)
        : [...f.channels, ch],
    }));
  };

  const handleSubmit = async () => {
    const userIds = form.targetUserIds
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (userIds.length === 0)      { setToast({ message: "Enter at least one target user ID.", type: "error" }); return; }
    if (form.channels.length === 0){ setToast({ message: "Select at least one channel.", type: "error" }); return; }
    if (!form.notificationType || !form.body) { setToast({ message: "Type and body are required.", type: "error" }); return; }

    setLoading(true); setToast(null);
    try {
      await notificationApi.broadcast({
        targetUserIds:    userIds,
        channels:         form.channels,
        notificationType: form.notificationType,
        title:            form.title || undefined,
        body:             form.body,
      });
      setToast({ message: `Broadcast sent to ${userIds.length} user(s) via ${form.channels.length} channel(s).`, type: "success" });
      setForm(EMPTY);
    } catch (e) {
      setToast({ message: e.response?.data?.message ?? e.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <FieldRow label="Target user IDs (one per line or comma-separated)">
        <textarea
          className={`${inputCls} resize-y min-h-[80px] font-mono text-xs leading-relaxed`}
          placeholder={"550e8400-e29b-41d4-a716-446655440000\nef1234ab-..."}
          rows={4}
          value={form.targetUserIds}
          onChange={(e) => set("targetUserIds", e.target.value)}
        />
      </FieldRow>

      <FieldRow label="Channels">
        <div className="flex gap-2 flex-wrap">
          {CHANNELS.map((ch) => {
            const active = form.channels.includes(ch);
            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all
                  ${active
                    ? "border-blue-500 bg-blue-600/20 text-blue-300 font-medium"
                    : "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
                  }`}
              >
                {CHANNEL_LABELS[ch]}
              </button>
            );
          })}
        </div>
      </FieldRow>

      <FieldRow label="Notification type">
        <select className={inputCls} value={form.notificationType} onChange={(e) => set("notificationType", e.target.value)}>
          <option value="">Select type…</option>
          {NOTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </FieldRow>

      <FieldRow label="Title (optional)">
        <input
          className={inputCls}
          placeholder="Short title, max 160 chars"
          maxLength={160}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </FieldRow>

      <FieldRow label="Body">
        <textarea
          className={`${inputCls} resize-y min-h-[72px] leading-relaxed`}
          placeholder="Broadcast message body…"
          rows={3}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
        />
      </FieldRow>

      <div className="mt-1">
        <ActionButton onClick={handleSubmit} loading={loading}>Send broadcast</ActionButton>
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

// ── Tab: Retry failed ────────────────────────────────────────────────────────

function AdminRetryTab() {
  const [limit,   setLimit]   = useState(50);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [result,  setResult]  = useState(null);

  const handleRetry = async () => {
    setLoading(true); setToast(null); setResult(null);
    try {
      const res   = await notificationApi.retryFailed(limit);
      const data  = res.data?.data ?? res.data;
      const count = typeof data === "number" ? data : (data?.retriedCount ?? "?");
      setResult(count);
      setToast({ message: `${count} notification(s) retried successfully.`, type: "success" });
    } catch (e) {
      setToast({ message: e.response?.data?.message ?? e.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <p className="text-sm text-gray-400 leading-relaxed">
        Retries all notifications with status <strong className="text-gray-200">pending</strong> or{" "}
        <strong className="text-gray-200">failed</strong>, ordered oldest-first, up to the batch limit.
      </p>

      <FieldRow label="Batch limit">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(500, Number(e.target.value))))}
            className={`${inputCls} w-24`}
          />
          <span className="text-xs text-gray-500">max 500 per run</span>
        </div>
      </FieldRow>

      {result !== null && (
        <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400">
          Last run retried{" "}
          <strong className="text-gray-200">{result}</strong> notification(s).
        </div>
      )}

      <div className="mt-1">
        <ActionButton onClick={handleRetry} loading={loading}>Retry failed notifications</ActionButton>
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

// ── AdminNotificationPanel ────────────────────────────────────────────────────

export default function AdminNotificationPanel() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="bg-[#0c1f2c] border border-white/10 rounded-2xl overflow-hidden w-full">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2.5">
        <span className="text-sm font-semibold text-gray-100">Notification management</span>
        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-700/30 font-semibold">
          Admin
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm px-5 py-3 whitespace-nowrap border-b-2 transition-all font-medium
                ${active
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="p-5">
        {activeTab === "list"      && <AdminListTab />}
        {activeTab === "send"      && <AdminSendTab />}
        {activeTab === "broadcast" && <AdminBroadcastTab />}
        {activeTab === "retry"     && <AdminRetryTab />}
      </div>
    </div>
  );
}