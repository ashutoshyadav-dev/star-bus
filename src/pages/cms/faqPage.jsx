import { useState, useCallback, useEffect } from "react";
import { cmsApi } from "../../api/cms";
import toast from "react-hot-toast";
import {
  RefreshCw, ArrowLeft, Plus, Pencil, Trash2, Search,
  ChevronRight, BookOpen, Tag, Hash, CheckCircle2,
  AlertTriangle, GripVertical, X, Save, FileQuestion,
  LayoutList, Filter,
} from "lucide-react";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const CATEGORY_META = {
  booking:      { label: "Booking",      color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    dot: "bg-blue-500"    },
  payment:      { label: "Payment",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  cancellation: { label: "Cancellation", color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    dot: "bg-rose-500"    },
  refund:       { label: "Refund",       color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500"   },
  account:      { label: "Account",      color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  dot: "bg-violet-500"  },
  general:      { label: "General",      color: "text-slate-600",   bg: "bg-slate-100",  border: "border-slate-200",   dot: "bg-slate-400"   },
};

const CATEGORIES = Object.keys(CATEGORY_META);
const EMPTY_FORM  = { category: "", question: "", answer: "", position: "" };
const Q_MAX = 300;
const A_MAX = 2000;
const Q_MIN = 10;
const A_MIN = 10;

/* ─── Validation ──────────────────────────────────────────────────────────── */
function validate(form) {
  const e = {};
  if (!form.category)
    e.category = "Please select a category.";
  if (!form.question.trim())
    e.question = "Question is required.";
  else if (form.question.trim().length < Q_MIN)
    e.question = `At least ${Q_MIN} characters required.`;
  else if (form.question.trim().length > Q_MAX)
    e.question = `Must not exceed ${Q_MAX} characters.`;
  if (!form.answer.trim())
    e.answer = "Answer is required.";
  else if (form.answer.trim().length < A_MIN)
    e.answer = `At least ${A_MIN} characters required.`;
  else if (form.answer.trim().length > A_MAX)
    e.answer = `Must not exceed ${A_MAX} characters.`;
  if (!String(form.position).trim())
    e.position = "Position is required.";
  else if (Number(form.position) < 1)
    e.position = "Must be at least 1.";
  return e;
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
function Spin({ size = 16 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

/* ─── CategoryBadge ───────────────────────────────────────────────────────── */
function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category?.toLowerCase()] ?? CATEGORY_META.general;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border ${meta.bg} ${meta.border} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ─── StatCard ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent = "blue" }) {
  const map = {
    blue:    { bar: "bg-blue-500",    num: "text-blue-600"    },
    violet:  { bar: "bg-violet-500",  num: "text-violet-600"  },
    emerald: { bar: "bg-emerald-500", num: "text-emerald-600" },
    amber:   { bar: "bg-amber-500",   num: "text-amber-600"   },
  };
  const c = map[accent] ?? map.blue;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden shadow-sm">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
      <p className={`text-3xl font-bold tabular-nums ${c.num}`}>{value}</p>
      <p className="text-sm font-semibold text-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
function Field({ label, error, required, hint, counter, children }) {
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
      {error
        ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" />{error}</p>
        : hint ? <p className="text-xs text-slate-400">{hint}</p>
        : null}
    </div>
  );
}

/* ─── Input class helpers ─────────────────────────────────────────────────── */
const base    = "w-full text-sm text-slate-800 bg-white border rounded-lg outline-none transition-all placeholder:text-slate-300";
const ok      = "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const err     = "border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-2 focus:ring-red-100";
const inputCls = (e) => `${base} h-10 px-3 ${e ? err : ok}`;
const areaCls  = (e) => `${base} px-3 py-2.5 resize-none ${e ? err : ok}`;
const selCls   = (e) => `${base} h-10 px-3 cursor-pointer ${e ? err : ok}`;

/* ─── FaqForm ─────────────────────────────────────────────────────────────── */
function FaqForm({ initial = EMPTY_FORM, onSuccess, onCancel, mode = "create" }) {
  const [form,    setForm]    = useState({ ...initial });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      category: form.category,
      question: form.question.trim(),
      answer:   form.answer.trim(),
      position: Number(form.position),
    };

    setLoading(true);
    try {
      if (mode === "create") {
        await cmsApi.createFaq(payload);
        toast.success("FAQ created successfully.");
      } else {
        await cmsApi.updateFaq(initial.faqId, payload);
        toast.success("FAQ updated successfully.");
      }
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? `Failed to ${mode} FAQ.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Category + Position */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field label="Category" required error={errors.category}>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selCls(errors.category)}>
              <option value="">— Select category —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_META[c].label}</option>
              ))}
            </select>
          </Field>
        </div>
        <div>
          <Field label="Position" required error={errors.position} hint="Display order">
            <input
              type="number" min={1}
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="1"
              className={inputCls(errors.position)}
            />
          </Field>
        </div>
      </div>

      {/* Question */}
      <Field
        label="Question" required error={errors.question}
        counter={{ cur: form.question.length, max: Q_MAX, over: form.question.length > Q_MAX }}
      >
        <input
          type="text"
          value={form.question}
          onChange={(e) => set("question", e.target.value)}
          placeholder="e.g. How do I cancel my booking?"
          maxLength={Q_MAX + 10}
          className={inputCls(errors.question)}
        />
      </Field>

      {/* Answer */}
      <Field
        label="Answer" required error={errors.answer}
        counter={{ cur: form.answer.length, max: A_MAX, over: form.answer.length > A_MAX }}
      >
        <textarea
          rows={5}
          value={form.answer}
          onChange={(e) => set("answer", e.target.value)}
          placeholder="Type a clear, helpful answer…"
          maxLength={A_MAX + 10}
          className={areaCls(errors.answer)}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Spin size={14} /> : <Save className="w-4 h-4" />}
          {loading ? "Saving…" : mode === "create" ? "Create FAQ" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── DeleteConfirm ───────────────────────────────────────────────────────── */
function DeleteConfirm({ faq, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await cmsApi.deleteFaq(faq.faqId);
      toast.success("FAQ deleted.");
      onConfirm();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? "Failed to delete FAQ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-900">Delete this FAQ?</p>
          <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
            <span className="font-medium">"{faq.question}"</span> will be permanently removed and cannot be recovered.
          </p>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? <Spin size={12} /> : <Trash2 className="w-3.5 h-3.5" />}
              {loading ? "Deleting…" : "Yes, permanently delete"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FaqDetailPanel ──────────────────────────────────────────────────────── */
function FaqDetailPanel({ faq, onBack, onRefresh }) {
  const [mode, setMode] = useState("view");

  const handleSuccess = () => {
    setMode("view");
    onRefresh();
    if (mode === "delete") onBack();
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to FAQ list
      </button>

      {/* ID strip */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
          FAQ #{faq.faqId}
        </span>
        <CategoryBadge category={faq.category} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          <Hash className="w-3 h-3" /> Position {faq.position}
        </span>
      </div>

      {/* View mode */}
      {mode === "view" && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-4 shadow-sm">
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Question</p>
              <p className="text-base font-semibold text-slate-900 leading-snug">{faq.question}</p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Answer</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400">Edit content or permanently remove this entry from the help centre.</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setMode("delete")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-red-600 text-xs font-semibold hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit mode */}
      {mode === "edit" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800">Edit FAQ</h3>
            <button type="button" onClick={() => setMode("view")} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <FaqForm initial={faq} mode="edit" onSuccess={handleSuccess} onCancel={() => setMode("view")} />
        </div>
      )}

      {/* Delete mode */}
      {mode === "delete" && (
        <DeleteConfirm faq={faq} onConfirm={handleSuccess} onCancel={() => setMode("view")} />
      )}
    </div>
  );
}

/* ─── CreateFaqPanel ──────────────────────────────────────────────────────── */
function CreateFaqPanel({ onSuccess, onCancel }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">New FAQ entry</h3>
          <p className="text-xs text-slate-400 mt-0.5">Fill in all fields below to publish a new FAQ.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <FaqForm mode="create" onSuccess={onSuccess} onCancel={onCancel} />
    </div>
  );
}

/* ─── FaqTableRow ─────────────────────────────────────────────────────────── */
function FaqTableRow({ faq, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
    >
      <td className="px-5 py-4">
        <span className="font-mono text-xs text-slate-400 font-medium">#{faq.faqId}</span>
      </td>
      <td className="px-5 py-4">
        <CategoryBadge category={faq.category} />
      </td>
      <td className="px-5 py-4 max-w-sm">
        <p className="text-sm text-slate-800 font-medium truncate">{faq.question}</p>
      </td>
      <td className="px-5 py-4 max-w-[260px] hidden lg:table-cell">
        <p className="text-xs text-slate-400 truncate leading-relaxed">{faq.answer}</p>
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          <Hash className="w-3 h-3" />{faq.position}
        </span>
      </td>
      <td className="px-5 py-4 text-slate-300 group-hover:text-slate-500 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ search, filter }) {
  const isFiltered = search || filter !== "all";
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
        <FileQuestion className="w-7 h-7 text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600">
          {isFiltered ? "No matching FAQs" : "No FAQs yet"}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
          {isFiltered
            ? "Try adjusting your search or category filter."
            : "Click \"New FAQ\" to publish your first help centre entry."}
        </p>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function CmsFaqPage() {
  const [faqs,       setFaqs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [showCreate, setShowCreate] = useState(false);

   useEffect(() => {
    document.title = "Faq | APSTS Admin Portal";
  }, []);

  const loadFaqs = useCallback(() => {
    setLoading(true);
    cmsApi.getAllFaqs()
      .then((res) => setFaqs(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load FAQs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const handleCreateSuccess = () => { setShowCreate(false); loadFaqs(); };

  const filtered = faqs.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || f.question?.toLowerCase().includes(q)
      || f.answer?.toLowerCase().includes(q)
      || String(f.faqId).includes(q);
    const matchFilter = filter === "all" || f.category?.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  const counts = CATEGORIES.reduce((a, c) => {
    a[c] = faqs.filter((f) => f.category?.toLowerCase() === c).length;
    return a;
  }, {});
  const categoryCount = new Set(faqs.map((f) => f.category?.toLowerCase())).size;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Detail view */}
        {selected ? (
          <FaqDetailPanel faq={selected} onBack={() => setSelected(null)} onRefresh={loadFaqs} />
        ) : (
          <>
            {/* Page header */}
            <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LayoutList className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">CMS</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FAQ Management</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Manage passenger-facing help centre content.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadFaqs}
                  disabled={loading}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate((s) => !s)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New FAQ
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total FAQs"      value={faqs.length}           sub={`${categoryCount} categories used`}      accent="blue"    />
              <StatCard label="Booking"         value={counts.booking ?? 0}   sub="booking category"                         accent="blue"    />
              <StatCard label="Payment & Refund" value={(counts.payment ?? 0) + (counts.refund ?? 0)} sub="financial topics" accent="emerald" />
              <StatCard label="Other"           value={(counts.cancellation ?? 0) + (counts.account ?? 0) + (counts.general ?? 0)} sub="cancellation, account, general" accent="amber" />
            </div>

            {/* Create panel */}
            {showCreate && (
              <CreateFaqPanel onSuccess={handleCreateSuccess} onCancel={() => setShowCreate(false)} />
            )}

            {/* Filter bar */}
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search question or answer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div className="flex gap-1.5 flex-wrap">
                {["all", ...CATEGORIES].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilter(c)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      filter === c
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {c === "all" ? "All" : CATEGORY_META[c]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
                  <Spin size={20} /><span className="text-sm">Loading FAQs…</span>
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState search={search} filter={filter} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["ID", "Category", "Question", "Answer preview", "Position", ""].map((h) => (
                          <th
                            key={h}
                            className={`px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest last:w-8 ${
                              h === "Answer preview" ? "hidden lg:table-cell" : ""
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((f) => (
                        <FaqTableRow key={f.faqId} faq={f} onClick={() => setSelected(f)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center justify-between mt-3 px-1">
                <p className="text-xs text-slate-400">
                  {filter !== "all" && (
                    <>Filtered by <span className="font-semibold text-slate-600">{CATEGORY_META[filter]?.label}</span></>
                  )}
                </p>
                <p className="text-xs text-slate-400 tabular-nums">
                  {filtered.length} of {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}