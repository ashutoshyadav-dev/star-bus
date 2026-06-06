import { useState, useEffect, useCallback } from "react";
import { notificationApi } from "../../api/notificationApi";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "All",     value: undefined },
  { label: "Unread",  value: "sent"    },
  { label: "Read",    value: "read"    },
  { label: "Pending", value: "pending" },
  { label: "Failed",  value: "failed"  },
];

const TYPE_ICONS = {
  booking_confirmed: "🎫",
  booking_cancelled: "❌",
  payment_success:   "✅",
  payment_failed:    "⚠️",
  grievance_update:  "📋",
  otp:               "🔑",
  general:           "📢",
  schedule_change:   "🕐",
  seat_reminder:     "💺",
};

const CHANNEL_LABELS = {
  push:     "Push",
  sms:      "SMS",
  email:    "Email",
  whatsapp: "WhatsApp",
  in_app:   "In-App",
};

const STATUS_META = {
  sent:    { bg: "#dcfce7", color: "#166534", label: "Delivered" },
  read:    { bg: "#f3f4f6", color: "#4b5563", label: "Read"      },
  pending: { bg: "#fef3c7", color: "#92400e", label: "Pending"   },
  failed:  { bg: "#fee2e2", color: "#991b1b", label: "Failed"    },
};

// ── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ── NotificationBell ─────────────────────────────────────────────────────────
// Styled for the dark gradient navbar (from-[#163F2D] via-[#081935])

export function NotificationBell({ onClick, unreadCount = 0 }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open notifications"
      className="relative p-2 rounded-lg text-gray-300 hover:text-orange-400 hover:bg-white/10 transition-all duration-200"
    >
      {/* Bell icon — SVG so it fits the icon size of FiMenu / FiLogOut */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20" height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

// ── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({ notif, onMarkRead }) {
  const isUnread = notif.status === "sent" || notif.status === "pending";
  const meta     = STATUS_META[notif.status] ?? STATUS_META.read;

  return (
    <div
      onClick={() => isUnread && onMarkRead(notif.id)}
      className={`flex gap-3 px-4 py-3.5 border-b border-gray-100 relative transition-colors duration-150
        ${isUnread ? "bg-blue-50/60 cursor-pointer hover:bg-blue-100/60" : "bg-white cursor-default"}`}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
      )}

      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center text-lg">
        {TYPE_ICONS[notif.notificationType] ?? "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm leading-snug text-gray-800 ${isUnread ? "font-semibold" : "font-normal"}`}>
            {notif.title ?? "Notification"}
          </span>
          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
            {timeAgo(notif.createdAt)}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-0.5 mb-1.5 leading-relaxed truncate">
          {notif.body}
        </p>

        <div className="flex gap-1.5 items-center flex-wrap">
          <span
            className="text-[10.5px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
          {notif.channel && (
            <span className="text-[10.5px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
              {CHANNEL_LABELS[notif.channel] ?? notif.channel}
            </span>
          )}
          {notif.referenceId && (
            <span className="text-[10.5px] text-gray-400">#{notif.referenceId}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NotificationPanel ────────────────────────────────────────────────────────
/**
 * Props:
 *   unreadCount  – number,   lifted from TopNavbar (source of truth)
 *   onCountChange – (delta: number) => void  – called after mark-read so navbar
 *                  can decrement its own counter without an extra network request
 */
export default function NotificationPanel({ unreadCount = 0, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [filter,        setFilter]        = useState(undefined);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [markingAll,    setMarkingAll]    = useState(false);

  // ── Fetch list (no unread-count fetch here — that lives in TopNavbar) ──────
  const loadNotifications = useCallback(async (f, p) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await notificationApi.getMyNotifications(f, p, 20);
      const data = res.data?.data ?? res.data;
      setNotifications(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(filter, page); }, [filter, page, loadNotifications]);

  // ── Mark single read ──────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif) return;
    const wasUnread = notif.status === "sent" || notif.status === "pending";

    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, status: "read", readAt: new Date().toISOString() } : n)
    );
    if (wasUnread) onCountChange?.(-1);

    try {
      await notificationApi.markRead(id);
    } catch {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, status: notif.status, readAt: notif.readAt } : n)
      );
      if (wasUnread) onCountChange?.(1);
    }
  };

  // ── Mark all read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const unreadIds = notifications
      .filter((n) => n.status === "sent" || n.status === "pending")
      .map((n) => n.id);

    // Optimistic
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === "sent" || n.status === "pending"
          ? { ...n, status: "read", readAt: new Date().toISOString() }
          : n
      )
    );
    // Tell navbar to zero out its counter
    onCountChange?.(-unreadCount);

    try {
      await notificationApi.markAllRead();
    } catch {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(n.id) ? { ...n, status: "sent", readAt: undefined } : n
        )
      );
      onCountChange?.(unreadCount);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleFilterChange = (value) => { setFilter(value); setPage(0); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden w-[420px] max-h-[580px]">

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10.5px] font-semibold rounded-full px-1.5 py-0.5">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
          >
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.label}
              onClick={() => handleFilterChange(f.value)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all duration-100 border
                ${active
                  ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {loading && (
          <p className="text-center text-xs text-gray-400 py-10">Loading…</p>
        )}
        {!loading && error && (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-red-500 mb-2">{error}</p>
            <button
              onClick={() => loadNotifications(filter, page)}
              className="text-xs text-blue-600 underline"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="text-4xl mb-2">🔔</span>
            <p className="text-sm text-gray-400">
              {filter ? `No ${filter} notifications` : "You're all caught up!"}
            </p>
          </div>
        )}
        {!loading && !error && notifications.map((n) => (
          <NotificationItem key={n.id} notif={n} onMarkRead={handleMarkRead} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="hover:text-gray-800 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            ← Prev
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="hover:text-gray-800 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
