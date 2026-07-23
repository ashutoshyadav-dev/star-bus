import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { grievanceApi } from "../../api/grievance";
import { bookingApi }   from "../../api/booking";
import toast from "react-hot-toast";
import {
  ArrowLeft, RefreshCw, Send, AlertTriangle,
  FileQuestion, ChevronRight, X, Clock,
  Loader2, CheckCircle2, Ban, TrendingUp,
} from "lucide-react";

/* ─── Constants — must match GrievanceCategory enum (lowercase) ───────────── */
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

/* ─── Status meta — matches GrievanceStatus enum ─────────────────────────── */
const STATUS_META = {
  open:                   { label: "Open",              icon: Clock,         cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  assigned:               { label: "Assigned",          icon: TrendingUp,    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"          },
  in_progress:            { label: "In Progress",       icon: Loader2,       cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"       },
  pending_passenger_info: { label: "Info Needed",       icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200"    },
  resolved:               { label: "Resolved",          icon: CheckCircle2,  cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200"       },
  closed:                 { label: "Closed",            icon: Ban,           cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200"      },
  escalated:              { label: "Escalated",         icon: AlertTriangle, cls: "bg-red-50 text-red-700 ring-1 ring-red-200"             },
};

const FILTER_TABS = ["all", "open", "in_progress", "resolved", "closed"];

const SUBJECT_MAX = 200;
const DESC_MAX    = 2000;
const DESC_MIN    = 20;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " · " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function getCategoryLabel(val) {
  return CATEGORIES.find((c) => c.value === val)?.label ?? val;
}

/* ─── Spin ────────────────────────────────────────────────────────────────── */
function Spin({ size = 16 }) {
  return (
    <span className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }} />
  );
}

/* ─── StatusBadge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.open;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
function Field({ label, error, required, counter, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {counter != null && (
          <span className={`text-[11px] tabular-nums ${counter.over ? "text-red-500 font-semibold" : "text-slate-400"}`}>
            {counter.cur}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

/* ─── Input class helpers ─────────────────────────────────────────────────── */
const base    = "w-full text-sm text-slate-800 bg-white border rounded-lg outline-none transition-all placeholder:text-slate-300";
const ok      = "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const errCls  = "border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-2 focus:ring-red-100";
const inputCls  = (e) => `${base} h-10 px-3 ${e ? errCls : ok}`;
const areaCls   = (e) => `${base} px-3 py-2.5 resize-none ${e ? errCls : ok}`;
const selCls    = (e) => `${base} h-10 px-3 cursor-pointer ${e ? errCls : ok}`;

/* ─── GrievanceCard (compact — right panel list) ──────────────────────────── */
function GrievanceCard({ g, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer bg-white"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] text-slate-400 font-medium">{g.ticketNumber}</span>
            <StatusBadge status={g.status} />
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate leading-snug">{g.subject}</p>
          <p className="text-xs text-slate-400 mt-1">{getCategoryLabel(g.category)} · {fmtDate(g.createdAt)}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}

/* ─── GrievanceDetailModal ────────────────────────────────────────────────── */
function GrievanceDetailModal({ g, onClose, onReopen, onRate }) {
  const [rating,    setRating]    = useState(g.passengerSatisfactionRating ?? 0);
  const [hovering,  setHovering]  = useState(0);
  const [rateLoad,  setRateLoad]  = useState(false);
  const [reopenLoad,setReopenLoad]= useState(false);

  const canReopen = g.status === "resolved" || g.status === "closed";
  const canRate   = canReopen && !g.passengerSatisfactionRating;

  const handleRate = async (r) => {
    if (!canRate) return;
    setRateLoad(true);
    try {
      await grievanceApi.rate(g.id, { rating: r });
      toast.success("Rating submitted.");
      setRating(r);
      onRate?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to submit rating.");
    } finally {
      setRateLoad(false);
    }
  };

  const handleReopen = async () => {
    setReopenLoad(true);
    try {
      await grievanceApi.reopen(g.id);
      toast.success("Grievance reopened.");
      onReopen?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to reopen.");
    } finally {
      setReopenLoad(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {g.ticketNumber}
            </span>
            <StatusBadge status={g.status} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">

          {/* Subject */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</p>
            <p className="text-base font-semibold text-slate-900">{g.subject}</p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Category",    value: getCategoryLabel(g.category)  },
              { label: "Priority",    value: g.priority ?? "—"             },
              { label: "Filed on",    value: fmtDateTime(g.createdAt)      },
              { label: "SLA deadline",value: fmtDate(g.slaDeadlineAt)      },
              { label: "Resolved on", value: fmtDateTime(g.resolvedAt)     },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{row.label}</p>
                <p className="text-sm text-slate-700">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100" />

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{g.description}</p>
          </div>

          {/* Resolution notes */}
          {g.resolutionNotes && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Resolution</p>
              <p className="text-sm text-emerald-800 leading-relaxed">{g.resolutionNotes}</p>
            </div>
          )}

          {/* Star rating */}
          {canReopen && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {g.passengerSatisfactionRating ? "Your rating" : "Rate this resolution"}
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={!!g.passengerSatisfactionRating || rateLoad}
                    onMouseEnter={() => setHovering(star)}
                    onMouseLeave={() => setHovering(0)}
                    onClick={() => handleRate(star)}
                    className="disabled:cursor-default transition-transform hover:scale-110"
                  >
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill={star <= (hovering || rating || g.passengerSatisfactionRating || 0) ? "#f59e0b" : "none"} stroke={star <= (hovering || rating || g.passengerSatisfactionRating || 0) ? "#f59e0b" : "#cbd5e1"} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                ))}
                {rateLoad && <Spin size={16} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-2">
          {canReopen && (
            <button
              type="button"
              onClick={handleReopen}
              disabled={reopenLoad}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {reopenLoad ? <Spin size={14} /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reopen
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── FileGrievanceForm ───────────────────────────────────────────────────── */
function FileGrievanceForm({ bookings, bookingsLoading, bookingsError, onLoadBookings, onSubmitSuccess }) {
  const EMPTY = { bookingId: "", scheduleId: "", category: "", subject: "", description: "" };
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.category)             e.category    = "Select a category.";
    if (!form.subject.trim())       e.subject     = "Subject is required.";
    else if (form.subject.length > SUBJECT_MAX) e.subject = `Max ${SUBJECT_MAX} characters.`;
    if (!form.description.trim())   e.description = "Description is required.";
    else if (form.description.trim().length < DESC_MIN) e.description = `At least ${DESC_MIN} characters.`;
    else if (form.description.length > DESC_MAX)        e.description = `Max ${DESC_MAX} characters.`;
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      bookingId:   form.bookingId   || undefined,
      scheduleId:  form.scheduleId  || undefined,
      category:    form.category,
      subject:     form.subject.trim(),
      description: form.description.trim(),
    };

    setLoading(true);
    try {
      await grievanceApi.file(payload);
      toast.success("Grievance filed successfully.");
      setForm(EMPTY);
      setErrors({});
      onSubmitSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to file grievance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Booking (optional) */}
      <Field label="Related Booking" error={errors.bookingId}>
        <select value={form.bookingId} onChange={(e) => set("bookingId", e.target.value)} className={selCls(errors.bookingId)} disabled={bookingsLoading}>
          <option value="">{bookingsLoading ? "Loading bookings…" : "None / Not booking-related"}</option>
          {bookings.map((b) => (
            <option key={b.bookingId} value={b.bookingId}>
              {b.pnr} — {b.fromStationName} → {b.toStationName} | {fmtDate(b.journeyDate)}
            </option>
          ))}
        </select>
        {bookingsError && !bookingsLoading && (
          <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
            {bookingsError}
            <button type="button" onClick={onLoadBookings} className="underline text-blue-500 ml-1">Retry</button>
          </p>
        )}
      </Field>

      {/* Category */}
      <Field label="Category" required error={errors.category}>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selCls(errors.category)}>
          <option value="">— Select category —</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>

      {/* Subject */}
      <Field label="Subject" required error={errors.subject}
        counter={{ cur: form.subject.length, max: SUBJECT_MAX, over: form.subject.length > SUBJECT_MAX }}>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
          placeholder="Brief subject of your grievance"
          maxLength={SUBJECT_MAX + 5}
          className={inputCls(errors.subject)}
        />
      </Field>

      {/* Description */}
      <Field label="Description" required error={errors.description}
        counter={{ cur: form.description.length, max: DESC_MAX, over: form.description.length > DESC_MAX }}>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe your issue clearly — what happened, when, and how it affected your journey…"
          maxLength={DESC_MAX + 5}
          className={areaCls(errors.description)}
        />
      </Field>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Spin size={14} /> : <Send className="w-4 h-4" />}
        {loading ? "Submitting…" : "Submit Grievance"}
      </button>
    </div>
  );
}

/* ─── Main Helpdesk Page ──────────────────────────────────────────────────── */
export default function Helpdesk() {
  const navigate = useNavigate();

  const [grievances,       setGrievances]       = useState([]);
  const [grievancesLoad,   setGrievancesLoad]   = useState(true);
  const [bookings,         setBookings]         = useState([]);
  const [bookingsLoading,  setBookingsLoading]  = useState(true);
  const [bookingsError,    setBookingsError]    = useState("");
  const [activeTab,        setActiveTab]        = useState("all");
  const [selected,         setSelected]         = useState(null);

  const loadGrievances = useCallback(() => {
    setGrievancesLoad(true);
    grievanceApi.getMine()
      .then((res) => {
        const list = res.data?.data ?? res.data ?? [];
        setGrievances([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => toast.error("Failed to load grievances."))
      .finally(() => setGrievancesLoad(false));
  }, []);

  const loadBookings = useCallback(() => {
    setBookingsLoading(true);
    setBookingsError("");
    bookingApi.getMyDetails()
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        setBookings(list.filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.bookingStatus)));
      })
      .catch(() => setBookingsError("Could not load bookings."))
      .finally(() => setBookingsLoading(false));
  }, []);

  useEffect(() => { loadGrievances(); loadBookings(); }, [loadGrievances, loadBookings]);

  const filtered = grievances.filter((g) =>
    activeTab === "all" || g.status === activeTab
  );

  const counts = FILTER_TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? grievances.length : grievances.filter((g) => g.status === t).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Support</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Helpdesk & Grievances</h1>
            <p className="text-sm text-slate-400 mt-1">File a new grievance or track your existing ones.</p>
          </div>
          <button
            type="button"
            onClick={loadGrievances}
            disabled={grievancesLoad}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${grievancesLoad ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── LEFT: File form ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-1">File a Grievance</h2>
              <p className="text-xs text-slate-400 mb-5">
                All fields marked * are required. We respond within your SLA window.
              </p>
              <FileGrievanceForm
                bookings={bookings}
                bookingsLoading={bookingsLoading}
                bookingsError={bookingsError}
                onLoadBookings={loadBookings}
                onSubmitSuccess={loadGrievances}
              />
            </div>
          </div>

          {/* ── RIGHT: My grievances ─────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                    activeTab === t
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t === "all" ? "All" : t.replace("_", " ")}
                  {counts[t] > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === t ? "bg-white text-slate-900" : "bg-slate-100 text-slate-500"
                    }`}>
                      {counts[t]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            {grievancesLoad ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-400 bg-white rounded-xl border border-slate-200">
                <Spin size={20} /><span className="text-sm">Loading grievances…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <FileQuestion className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">No grievances found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTab === "all" ? "File your first grievance using the form." : `No ${activeTab.replace("_", " ")} grievances.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((g) => (
                  <GrievanceCard key={g.id} g={g} onClick={() => setSelected(g)} />
                ))}
              </div>
            )}

            {/* View All link */}
            {grievances.length > 0 && (
              <button
                type="button"
                onClick={() => navigate("/user/all-grievances")}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                View all grievances →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <GrievanceDetailModal
          g={selected}
          onClose={() => setSelected(null)}
          onReopen={loadGrievances}
          onRate={loadGrievances}
        />
      )}
    </div>
  );
}
