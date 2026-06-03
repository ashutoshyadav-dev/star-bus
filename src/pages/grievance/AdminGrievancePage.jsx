import { useState, useCallback, useEffect } from "react";
import { grievanceApi } from "../../api/grievance";
import toast from "react-hot-toast";
import {
  RefreshCw, ArrowLeft, Search, ChevronRight, X,
  FileQuestion, Clock, Loader2, CheckCircle2, Ban,
  TrendingUp, AlertTriangle, UserCheck, Flame,
  LayoutList, Filter, Save, Hash,
} from "lucide-react";

/* ─── Constants ───────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: "payment_issue",       label: "Payment Issue"        },
  { value: "refund_delay",        label: "Refund Delay"         },
  { value: "ticket_problem",      label: "Ticket Problem"       },
  { value: "conductor_behaviour", label: "Conductor Behaviour"  },
  { value: "bus_late",            label: "Bus Late"             },
  { value: "bus_cancelled",       label: "Bus Cancelled"        },
  { value: "seat_problem",        label: "Seat Problem"         },
  { value: "safety_concern",      label: "Safety Concern"       },
  { value: "booking_error",       label: "Booking Error"        },
  { value: "other",               label: "Other"                },
];

const STATUS_META = {
  open:                   { label: "Open",         icon: Clock,         cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"  },
  assigned:               { label: "Assigned",     icon: UserCheck,     cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"           },
  in_progress:            { label: "In Progress",  icon: Loader2,       cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"        },
  pending_passenger_info: { label: "Info Needed",  icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200"     },
  resolved:               { label: "Resolved",     icon: CheckCircle2,  cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200"        },
  closed:                 { label: "Closed",       icon: Ban,           cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200"       },
  escalated:              { label: "Escalated",    icon: Flame,         cls: "bg-red-50 text-red-700 ring-1 ring-red-200"              },
};

const PRIORITY_META = {
  low:    { label: "Low",    cls: "bg-slate-100 text-slate-500 border-slate-200"    },
  normal: { label: "Normal", cls: "bg-blue-50 text-blue-700 border-blue-200"        },
  high:   { label: "High",   cls: "bg-amber-50 text-amber-700 border-amber-200"     },
  urgent: { label: "Urgent", cls: "bg-red-50 text-red-700 border-red-200"           },
};

const STATUS_TABS    = ["all", "open", "assigned", "in_progress", "escalated", "resolved", "closed"];
const PRIORITY_TABS  = ["all", "urgent", "high", "normal", "low"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(d)     { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtDateTime(d) { if (!d) return "—"; const dt = new Date(d); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " · " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
function getCategoryLabel(val) { return CATEGORIES.find((c) => c.value === val)?.label ?? val; }

/* ─── Shared UI ───────────────────────────────────────────────────────────── */
function Spin({ size = 16 }) {
  return <span className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin" style={{ width: size, height: size }} />;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.open;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function StatCard({ label, value, accent = "blue" }) {
  const map = {
    blue:    { bar: "bg-blue-500",    num: "text-blue-600"    },
    emerald: { bar: "bg-emerald-500", num: "text-emerald-600" },
    amber:   { bar: "bg-amber-500",   num: "text-amber-600"   },
    red:     { bar: "bg-red-500",     num: "text-red-600"     },
  };
  const c = map[accent] ?? map.blue;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden shadow-sm">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
      <p className={`text-3xl font-bold tabular-nums ${c.num}`}>{value}</p>
      <p className="text-sm font-semibold text-slate-700 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Action button — reusable for all admin actions ──────────────────────── */
function ActionBtn({ label, icon: Icon, onClick, loading, variant = "default" }) {
  const variants = {
    default:   "border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger:    "border border-red-200 text-red-700 hover:bg-red-50",
    primary:   "bg-slate-900 text-white hover:bg-slate-800 border border-slate-900",
    warn:      "border border-amber-200 text-amber-700 hover:bg-amber-50",
    success:   "border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  };
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}>
      {loading ? <Spin size={12} /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

/* ─── AssignForm ──────────────────────────────────────────────────────────── */
function AssignForm({ grievanceId, onSuccess, onCancel }) {
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!staffId.trim()) { toast.error("Staff UUID is required."); return; }
    setLoading(true);
    try {
      await grievanceApi.assign(grievanceId, { assignedTo: staffId.trim() });
      toast.success("Grievance assigned.");
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to assign.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assign to staff</p>
      <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)}
        placeholder="Staff user UUID"
        className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
          {loading ? <Spin size={12} /> : <Save className="w-3.5 h-3.5" />}
          {loading ? "Assigning…" : "Assign"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── ResolveForm ─────────────────────────────────────────────────────────── */
function ResolveForm({ grievanceId, onSuccess, onCancel }) {
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) { toast.error("Resolution notes are required."); return; }
    setLoading(true);
    try {
      await grievanceApi.resolve(grievanceId, { resolutionNotes: notes.trim() });
      toast.success("Grievance resolved.");
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to resolve.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resolution notes</p>
      <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Explain how the issue was resolved…"
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
          {loading ? <Spin size={12} /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {loading ? "Resolving…" : "Mark resolved"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── PriorityForm ────────────────────────────────────────────────────────── */
function PriorityForm({ grievanceId, current, onSuccess, onCancel }) {
  const [priority, setPriority] = useState(current ?? "normal");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await grievanceApi.updatePriority(grievanceId, { priority });
      toast.success("Priority updated.");
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update priority.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Change priority</p>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
        {["low", "normal", "high", "urgent"].map((p) => (
          <option key={p} value={p}>{PRIORITY_META[p]?.label ?? p}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors">
          {loading ? <Spin size={12} /> : <Save className="w-3.5 h-3.5" />}
          {loading ? "Saving…" : "Update"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── AdminGrievanceDetailPanel ───────────────────────────────────────────── */
function AdminGrievanceDetailPanel({ g, onBack, onRefresh }) {
  const [activeForm, setActiveForm] = useState(null); // "assign"|"resolve"|"priority"|null
  const [loading,    setLoading]    = useState({});

  const setLoad = (key, val) => setLoading((l) => ({ ...l, [key]: val }));

  const doAction = async (key, apiFn, successMsg) => {
    setLoad(key, true);
    try {
      await apiFn();
      toast.success(successMsg);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Action failed.");
    } finally { setLoad(key, false); }
  };

  const handleSuccess = () => { setActiveForm(null); onRefresh(); };

  const isTerminal = g.status === "resolved" || g.status === "closed";

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <button type="button" onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to grievances
      </button>

      {/* Header strip */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{g.ticketNumber}</span>
        <StatusBadge status={g.status} />
        <PriorityBadge priority={g.priority} />
        {g.slaDeadlineAt && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Hash className="w-3 h-3" /> SLA {fmtDate(g.slaDeadlineAt)}
          </span>
        )}
      </div>

      {/* Content card */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-4 shadow-sm">
        <div className="p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</p>
          <p className="text-base font-semibold text-slate-900 leading-snug">{g.subject}</p>
        </div>
        <div className="p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{g.description}</p>
        </div>
        {g.resolutionNotes && (
          <div className="p-6 bg-emerald-50/60">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Resolution notes</p>
            <p className="text-sm text-emerald-800 leading-relaxed">{g.resolutionNotes}</p>
          </div>
        )}
      </div>

      {/* Meta grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Details</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6">
          {[
            { label: "User ID",      value: g.userId,                          mono: true  },
            { label: "Category",     value: getCategoryLabel(g.category)                   },
            { label: "Priority",     value: g.priority ?? "—"                              },
            { label: "Assigned to",  value: g.assignedTo ?? "Unassigned",      mono: !!g.assignedTo },
            { label: "Filed on",     value: fmtDateTime(g.createdAt)                       },
            { label: "Resolved on",  value: fmtDateTime(g.resolvedAt)                      },
            { label: "SLA deadline", value: fmtDateTime(g.slaDeadlineAt)                   },
            { label: "Rating",       value: g.passengerSatisfactionRating ? `${g.passengerSatisfactionRating}/5 ★` : "Not rated" },
          ].map((row) => (
            <div key={row.label} className="py-3 border-b border-slate-100 last:border-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{row.label}</p>
              <p className={`text-sm text-slate-700 font-medium truncate ${row.mono ? "font-mono text-xs" : ""}`}>
                {row.value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action panel */}
      {!isTerminal && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Actions</p>

          {/* Action buttons row */}
          {activeForm === null && (
            <div className="flex flex-wrap gap-2">
              <ActionBtn label="Assign"       icon={UserCheck}     onClick={() => setActiveForm("assign")}   variant="default" />
              <ActionBtn label="In Progress"  icon={Loader2}       loading={loading.inprogress}
                onClick={() => doAction("inprogress", () => grievanceApi.markInProgress(g.id), "Marked in-progress.")} variant="default" />
              <ActionBtn label="Pending Info" icon={AlertTriangle}  loading={loading.pending}
                onClick={() => doAction("pending", () => grievanceApi.markPendingPassengerInfo(g.id), "Marked pending passenger info.")} variant="warn" />
              <ActionBtn label="Escalate"     icon={Flame}          loading={loading.escalate}
                onClick={() => doAction("escalate", () => grievanceApi.escalate(g.id), "Grievance escalated.")} variant="danger" />
              <ActionBtn label="Priority"     icon={TrendingUp}     onClick={() => setActiveForm("priority")} variant="default" />
              <ActionBtn label="Resolve"      icon={CheckCircle2}   onClick={() => setActiveForm("resolve")}  variant="success" />
              <ActionBtn label="Close"        icon={Ban}            loading={loading.close}
                onClick={() => doAction("close", () => grievanceApi.close(g.id), "Grievance closed.")} variant="danger" />
            </div>
          )}

          {/* Inline forms */}
          {activeForm === "assign"   && <AssignForm   grievanceId={g.id} onSuccess={handleSuccess} onCancel={() => setActiveForm(null)} />}
          {activeForm === "resolve"  && <ResolveForm  grievanceId={g.id} onSuccess={handleSuccess} onCancel={() => setActiveForm(null)} />}
          {activeForm === "priority" && <PriorityForm grievanceId={g.id} current={g.priority} onSuccess={handleSuccess} onCancel={() => setActiveForm(null)} />}
        </div>
      )}

      {/* Terminal state notice */}
      {isTerminal && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${g.status === "resolved" ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 border-slate-200"}`}>
          {g.status === "resolved"
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            : <Ban className="w-5 h-5 text-slate-500 flex-shrink-0" />}
          <p className={`text-sm font-semibold ${g.status === "resolved" ? "text-emerald-800" : "text-slate-600"}`}>
            This grievance is {g.status}. No further actions available.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── GrievanceTableRow ───────────────────────────────────────────────────── */
function GrievanceTableRow({ g, onClick }) {
  return (
    <tr onClick={onClick} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group">
      <td className="px-5 py-4">
        <span className="font-mono text-xs text-slate-400 font-medium">{g.ticketNumber}</span>
      </td>
      <td className="px-5 py-4 max-w-xs">
        <p className="text-sm font-semibold text-slate-800 truncate">{g.subject}</p>
        <p className="text-xs text-slate-400 mt-0.5">{getCategoryLabel(g.category)}</p>
      </td>
      <td className="px-5 py-4"><StatusBadge status={g.status} /></td>
      <td className="px-5 py-4 hidden md:table-cell"><PriorityBadge priority={g.priority} /></td>
      <td className="px-5 py-4 text-xs text-slate-400 hidden lg:table-cell">{fmtDate(g.createdAt)}</td>
      <td className="px-5 py-4 text-xs text-slate-400 hidden lg:table-cell">{fmtDate(g.slaDeadlineAt)}</td>
      <td className="px-5 py-4 text-slate-300 group-hover:text-slate-500 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────────────── */
export default function AdminGrievancePage() {
  const [grievances, setGrievances] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [statusTab,  setStatusTab]  = useState("all");
  const [priorTab,   setPriorTab]   = useState("all");
  const [search,     setSearch]     = useState("");

  const loadGrievances = useCallback(() => {
    setLoading(true);
    grievanceApi.adminList({ page: 0, size: 200 })
      .then((res) => {
        const list = res.data?.data?.content ?? res.data?.data ?? res.data ?? [];
        setGrievances([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => toast.error("Failed to load grievances."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadGrievances(); }, [loadGrievances]);

  const handleRefresh = () => { setSelected(null); loadGrievances(); };

  const filtered = grievances.filter((g) => {
    const q     = search.toLowerCase();
    const bySt  = statusTab === "all" || g.status === statusTab;
    const byPr  = priorTab  === "all" || g.priority === priorTab;
    const bySrc = !q || g.subject?.toLowerCase().includes(q) || g.ticketNumber?.toLowerCase().includes(q);
    return bySt && byPr && bySrc;
  });

  /* stats */
  const stats = {
    total:      grievances.length,
    open:       grievances.filter((g) => g.status === "open").length,
    escalated:  grievances.filter((g) => g.status === "escalated").length,
    urgent:     grievances.filter((g) => g.priority === "urgent").length,
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Detail view */}
        {selected ? (
          <AdminGrievanceDetailPanel g={selected} onBack={() => setSelected(null)} onRefresh={handleRefresh} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LayoutList className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grievance Management</h1>
                <p className="text-sm text-slate-400 mt-1">Review, assign, and resolve passenger grievances.</p>
              </div>
              <button type="button" onClick={loadGrievances} disabled={loading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total"     value={stats.total}     accent="blue"    />
              <StatCard label="Open"      value={stats.open}      accent="emerald" />
              <StatCard label="Escalated" value={stats.escalated} accent="red"     />
              <StatCard label="Urgent"    value={stats.urgent}    accent="amber"   />
            </div>

            {/* Filter bar */}
            <div className="flex gap-2 mb-5 flex-wrap items-start">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input type="text" placeholder="Search ticket or subject…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm" />
              </div>

              {/* Status pills */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {STATUS_TABS.map((t) => (
                    <button key={t} type="button" onClick={() => setStatusTab(t)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                        statusTab === t ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}>
                      {t === "all" ? "All status" : t.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pl-5">
                  {PRIORITY_TABS.map((t) => (
                    <button key={t} type="button" onClick={() => setPriorTab(t)}
                      className={`h-7 px-3 rounded-lg text-[11px] font-semibold border transition-all capitalize ${
                        priorTab === t ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}>
                      {t === "all" ? "All priority" : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
                  <Spin size={20} /><span className="text-sm">Loading grievances…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <FileQuestion className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">No grievances found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusTab !== "all" || priorTab !== "all" ? "Try adjusting your filters." : "No grievances have been filed yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Ticket", "Subject", "Status", "Priority", "Filed", "SLA By", ""].map((h) => (
                          <th key={h} className={`px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest last:w-8 ${h === "Priority" ? "hidden md:table-cell" : ""} ${h === "Filed" || h === "SLA By" ? "hidden lg:table-cell" : ""}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((g) => (
                        <GrievanceTableRow key={g.id} g={g} onClick={() => setSelected(g)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && filtered.length > 0 && (
              <p className="text-xs text-slate-400 text-right mt-3 tabular-nums">
                {filtered.length} of {grievances.length} grievance{grievances.length !== 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
