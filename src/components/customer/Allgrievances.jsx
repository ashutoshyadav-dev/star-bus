import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { grievanceApi } from "../../api/grievance";
import toast from "react-hot-toast";
import {
  ArrowLeft, RefreshCw, Search, ChevronRight, X,
  FileQuestion, Clock, Loader2, CheckCircle2,
  Ban, TrendingUp, AlertTriangle,
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
  assigned:               { label: "Assigned",     icon: TrendingUp,    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"           },
  in_progress:            { label: "In Progress",  icon: Loader2,       cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"        },
  pending_passenger_info: { label: "Info Needed",  icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200"     },
  resolved:               { label: "Resolved",     icon: CheckCircle2,  cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200"        },
  closed:                 { label: "Closed",       icon: Ban,           cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200"       },
  escalated:              { label: "Escalated",    icon: AlertTriangle, cls: "bg-red-50 text-red-700 ring-1 ring-red-200"              },
};

const FILTER_TABS = ["all", "open", "in_progress", "resolved", "closed"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(d)     { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtDateTime(d) { if (!d) return "—"; const dt = new Date(d); return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " · " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
function getCategoryLabel(val) { return CATEGORIES.find((c) => c.value === val)?.label ?? val; }

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

/* ─── GrievanceDetailModal ────────────────────────────────────────────────── */
function GrievanceDetailModal({ g, onClose, onRefresh }) {
  const [rating,     setRating]     = useState(g.passengerSatisfactionRating ?? 0);
  const [hovering,   setHovering]   = useState(0);
  const [rateLoad,   setRateLoad]   = useState(false);
  const [reopenLoad, setReopenLoad] = useState(false);

  const canReopen = g.status === "resolved" || g.status === "closed";
  const canRate   = canReopen && !g.passengerSatisfactionRating;

  const handleRate = async (r) => {
    if (!canRate) return;
    setRateLoad(true);
    try {
      await grievanceApi.rate(g.id, { rating: r });
      toast.success("Thank you for your feedback.");
      setRating(r);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to submit rating.");
    } finally { setRateLoad(false); }
  };

  const handleReopen = async () => {
    setReopenLoad(true);
    try {
      await grievanceApi.reopen(g.id);
      toast.success("Grievance reopened.");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to reopen.");
    } finally { setReopenLoad(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{g.ticketNumber}</span>
            <StatusBadge status={g.status} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</p>
            <p className="text-base font-semibold text-slate-900">{g.subject}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Category",    value: getCategoryLabel(g.category) },
              { label: "Priority",    value: g.priority ?? "—"            },
              { label: "Filed on",    value: fmtDateTime(g.createdAt)     },
              { label: "SLA by",      value: fmtDate(g.slaDeadlineAt)     },
              { label: "Resolved on", value: fmtDateTime(g.resolvedAt)    },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{row.label}</p>
                <p className="text-sm text-slate-700">{row.value}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{g.description}</p>
          </div>
          {g.resolutionNotes && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Resolution</p>
              <p className="text-sm text-emerald-800 leading-relaxed">{g.resolutionNotes}</p>
            </div>
          )}

          {/* Rating */}
          {canReopen && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {g.passengerSatisfactionRating ? "Your rating" : "Rate this resolution"}
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button"
                    disabled={!!g.passengerSatisfactionRating || rateLoad}
                    onMouseEnter={() => setHovering(star)} onMouseLeave={() => setHovering(0)}
                    onClick={() => handleRate(star)}
                    className="disabled:cursor-default transition-transform hover:scale-110"
                  >
                    <svg className="w-7 h-7" viewBox="0 0 24 24"
                      fill={star <= (hovering || rating || g.passengerSatisfactionRating || 0) ? "#f59e0b" : "none"}
                      stroke={star <= (hovering || rating || g.passengerSatisfactionRating || 0) ? "#f59e0b" : "#cbd5e1"} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                ))}
                {rateLoad && <Spin size={16} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          {canReopen && (
            <button type="button" onClick={handleReopen} disabled={reopenLoad}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors">
              {reopenLoad ? <Spin size={14} /> : <RefreshCw className="w-3.5 h-3.5" />} Reopen
            </button>
          )}
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── GrievanceRow ────────────────────────────────────────────────────────── */
function GrievanceRow({ g, onClick }) {
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
      <td className="px-5 py-4 text-xs text-slate-400 hidden md:table-cell">{fmtDate(g.createdAt)}</td>
      <td className="px-5 py-4 text-xs text-slate-400 hidden lg:table-cell">{fmtDate(g.slaDeadlineAt)}</td>
      <td className="px-5 py-4 text-slate-300 group-hover:text-slate-500 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}

/* ─── Main AllGrievances Page ─────────────────────────────────────────────── */
export default function AllGrievances() {
  const navigate = useNavigate();

  const [grievances, setGrievances] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [activeTab,  setActiveTab]  = useState("all");
  const [search,     setSearch]     = useState("");

  useEffect(() => {
    document.title = "Grievance | APSTS Passenger Portal";
  }, []);

  const loadGrievances = useCallback(() => {
    setLoading(true);
    grievanceApi.getMine()
      .then((res) => {
        const list = res.data?.data ?? res.data ?? [];
        setGrievances([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => toast.error("Failed to load grievances."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadGrievances(); }, [loadGrievances]);

  const filtered = grievances.filter((g) => {
    const q   = search.toLowerCase();
    const tab = activeTab === "all" || g.status === activeTab;
    const src = !q || g.subject?.toLowerCase().includes(q) || g.ticketNumber?.toLowerCase().includes(q);
    return tab && src;
  });

  const counts = FILTER_TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? grievances.length : grievances.filter((g) => g.status === t).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Back */}
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Grievances</h1>
            <p className="text-sm text-slate-400 mt-1">{grievances.length} grievance{grievances.length !== 1 ? "s" : ""} raised</p>
          </div>
          <button type="button" onClick={loadGrievances} disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search ticket or subject…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((t) => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  activeTab === t ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}>
                {t === "all" ? "All" : t.replace("_", " ")}
                {counts[t] > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === t ? "bg-white text-slate-900" : "bg-slate-100 text-slate-500"}`}>
                    {counts[t]}
                  </span>
                )}
              </button>
            ))}
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
                  {search || activeTab !== "all" ? "Try adjusting your filter." : "You haven't raised any grievances yet."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Ticket", "Subject", "Status", "Filed", "SLA By", ""].map((h) => (
                      <th key={h} className={`px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest last:w-8 ${h === "Filed" ? "hidden md:table-cell" : ""} ${h === "SLA By" ? "hidden lg:table-cell" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <GrievanceRow key={g.id} g={g} onClick={() => setSelected(g)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 text-right mt-3 tabular-nums">
            {filtered.length} of {grievances.length} grievance{grievances.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {selected && (
        <GrievanceDetailModal g={selected} onClose={() => setSelected(null)} onRefresh={loadGrievances} />
      )}
    </div>
  );
}
