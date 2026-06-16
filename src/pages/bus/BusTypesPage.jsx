import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  getAllBusTypes, createBusType, updateBusType,
  deactivateBusType, uploadBusTypeImage,
} from "../../api/bus";
import { buildImageUrl } from "../../api/cms";
import busPlaceholder from "../../assets/bus1.png";

const VEHICLE_CATEGORIES = ["bus", "mini_bus", "suv_xylo", "suv_sumo"];

const FEATURES = [
  { key: "hasAc",          label: "AC",           icon: "❄️" },
  { key: "hasGps",         label: "GPS",          icon: "📡" },
  { key: "hasLuggageRack", label: "Luggage Rack", icon: "🧳" },
  { key: "hasMusicSystem", label: "Music System", icon: "🎵" },
  { key: "hasSeatbelts",   label: "Seatbelts",    icon: "🪢" },
];

const emptyForm = {
  name: "", code: "", vehicleCategory: "bus", totalSeats: "",
  seatLayoutTemplate: "",
  hasAc: false, hasGps: false,
  hasLuggageRack: false, hasMusicSystem: false, hasSeatbelts: false,
  fareMultiplier: "1.00",
};

// ─── Seat Layout Builder ──────────────────────────────────────────────────────

function generateTemplateJson(rows, cols, aisleCol, lastRowFull) {
  const seats = [];
  let label = 1;
  for (let r = 1; r <= rows; r++) {
    const isLast = r === rows && lastRowFull;
    for (let c = 1; c <= cols; c++) {
      if (c === aisleCol && !isLast) continue;
      const type = (c === 1 || c === cols) ? "window" : "aisle";
      seats.push({ label: String(label++), row: r, col: c, type, deck: "lower" });
    }
  }
  return JSON.stringify({ rows, cols, aisleColumn: aisleCol, lastRowFull, seats }, null, 2);
}

function SeatLayoutBuilder({ value, onChange, onTotalSeatsChange }) {
  const [rows,        setRows]        = useState(10);
  const [cols,        setCols]        = useState(5);
  const [aisleCol,    setAisleCol]    = useState(3);
  const [lastRowFull, setLastRowFull] = useState(true);

  let preview = [], pRows = 0, pCols = 0, pAisle = 0, pLastFull = false;
  try {
    const t  = JSON.parse(value);
    preview   = t.seats       ?? [];
    pRows     = t.rows        ?? 0;
    pCols     = t.cols        ?? 0;
    pAisle    = t.aisleColumn ?? 0;
    pLastFull = t.lastRowFull ?? false;
  } catch (_) {}

  const handleGenerate = () => {
    const json = generateTemplateJson(rows, cols, aisleCol, lastRowFull);
    onChange(json);
    try {
      const parsed = JSON.parse(json);
      onTotalSeatsChange(parsed.seats.length);
    } catch (_) {}
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Rows",      val: rows,     set: setRows,     min: 1,  max: 30 },
          { label: "Cols",      val: cols,     set: setCols,     min: 2,  max: 10 },
          { label: "Aisle Col", val: aisleCol, set: setAisleCol, min: 2,  max: cols - 1 },
        ].map(({ label, val, set, min, max }) => (
          <div key={label}>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input
              type="number" min={min} max={max} value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
        transition-all select-none ${lastRowFull
          ? "bg-orange-50 border-orange-300 text-orange-700"
          : "bg-gray-50 border-gray-200 text-gray-500"}`}>
        <input
          type="checkbox" checked={lastRowFull}
          onChange={(e) => setLastRowFull(e.target.checked)}
          className="sr-only"
        />
        <span className="text-lg">{lastRowFull ? "✅" : "⬜"}</span>
        <div>
          <p className="text-sm font-semibold">Last row full-width</p>
          <p className="text-xs opacity-70">
            Last row spans all {cols} cols including aisle
          </p>
        </div>
      </label>

      <button
        type="button" onClick={handleGenerate}
        className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600
          text-white text-sm font-semibold transition-colors"
      >
        Generate Layout
      </button>

      {preview.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-x-auto">
          <p className="text-xs text-gray-400 font-medium mb-3">
            Preview — {preview.length} seats
          </p>
          <div className="flex justify-end mb-1 pr-1">
            <span className="text-lg">🚌</span>
          </div>
          <div
            className="inline-grid gap-1"
            style={{ gridTemplateColumns: `repeat(${pCols}, 1.75rem)` }}
          >
            {Array.from({ length: pRows }, (_, rIdx) =>
              Array.from({ length: pCols }, (_, cIdx) => {
                const r = rIdx + 1, c = cIdx + 1;
                const isAisleGap = c === pAisle && !(pLastFull && r === pRows);
                const seat = preview.find((s) => s.row === r && s.col === c);
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`w-7 h-7 rounded flex items-center justify-center
                      text-[9px] font-mono font-bold border transition-colors
                      ${isAisleGap
                        ? "border-transparent bg-transparent"
                        : seat
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-gray-100 border-gray-200 text-gray-300"}`}
                  >
                    {!isAisleGap && (seat?.label ?? "")}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
          Advanced — edit raw JSON
        </summary>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2
            text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </details>
    </div>
  );
}

// ─── Image Upload Cell ────────────────────────────────────────────────────────

function ImageUploadCell({ bt, onUpdated }) {
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const res     = await uploadBusTypeImage(bt.id, file);
      const updated = res.data?.data ?? res.data;
      toast.success(`Image updated for ${bt.name}`);
      onUpdated(updated);
      fileRef.current.value = "";
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <img
        src={bt.imageUrl ? buildImageUrl(bt.imageUrl) : busPlaceholder}
        alt={bt.name}
        className="w-12 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
        onError={(e) => { e.target.src = busPlaceholder; }}
      />
      <label className={`cursor-pointer px-2 py-1 rounded-lg text-xs font-medium
        border transition-colors whitespace-nowrap
        ${loading
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"}`}>
        {loading ? "Uploading…" : bt.imageUrl ? "Change" : "Upload"}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={loading}
          onChange={handle}
        />
      </label>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusTypesPage() {
  const [busTypes,    setBusTypes]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [activeOnly,  setActiveOnly]  = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAllBusTypes(activeOnly);
      setBusTypes(data?.data ?? data ?? []);
    } catch {
      toast.error("Failed to load bus types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeOnly]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setError("");
    setShowBuilder(false);
    setShowModal(true);
  };

  const openEdit = (bt) => {
    setEditTarget(bt);
    setForm({
      name:               bt.name               ?? "",
      code:               bt.code               ?? "",
      vehicleCategory:    bt.vehicleCategory     ?? "bus",
      totalSeats:         bt.totalSeats          ?? "",
      seatLayoutTemplate: bt.seatLayoutTemplate  ?? "",
      hasAc:              bt.hasAc               ?? false,
      hasGps:             bt.hasGps              ?? false,
      hasLuggageRack:     bt.hasLuggageRack      ?? false,
      hasMusicSystem:     bt.hasMusicSystem       ?? false,
      hasSeatbelts:       bt.hasSeatbelts         ?? false,
      fareMultiplier:     bt.fareMultiplier        ?? "1.00",
    });
    setError("");
    setShowBuilder(false);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.seatLayoutTemplate?.trim()) {
      setError("Seat layout template is required. Use the Layout Builder above.");
      return;
    }
    try { JSON.parse(form.seatLayoutTemplate); }
    catch (_) {
      setError("Seat layout template is not valid JSON.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        totalSeats:     Number(form.totalSeats),
        fareMultiplier: parseFloat(form.fareMultiplier),
      };
      if (editTarget) {
        await updateBusType(editTarget.id, payload);
        toast.success("Bus type updated.");
      } else {
        await createBusType(payload);
        toast.success("Bus type created.");
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateBusType(id);
      toast.success("Bus type deactivated.");
      load();
    } catch {
      toast.error("Deactivation failed.");
    }
  };

  const handleActivate = async (bt) => {
    try {
      await updateBusType(bt.id, { ...bt, isActive: true });
      toast.success("Bus type activated.");
      load();
    } catch {
      toast.error("Activation failed.");
    }
  };

  const TABLE_HEADERS = [
    "Image", "Name", "Code", "Category",
    "Seats", "Multiplier", "Features", "Status", "Actions",
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define vehicle classes, seat layouts and fleet images
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600
            cursor-pointer select-none">
            <input
              type="checkbox" checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            Active only
          </label>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2
              rounded-xl text-sm font-semibold transition-colors"
          >
            + New Bus Type
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent
            rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold
                      text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {busTypes.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length}
                    className="text-center py-14 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🚌</span>
                      <span className="text-sm">No bus types found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                busTypes.map((bt) => (
                  <tr key={bt.id}
                    className="hover:bg-gray-50/80 transition-colors group">

                    {/* Image */}
                    <td className="px-4 py-3">
                      <ImageUploadCell
                        bt={bt}
                        onUpdated={(updated) =>
                          setBusTypes((prev) =>
                            prev.map((b) => b.id === updated.id ? updated : b)
                          )
                        }
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {bt.name}
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700
                        px-2 py-0.5 rounded-lg">
                        {bt.code}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600 capitalize text-xs">
                      {bt.vehicleCategory?.replace(/_/g, " ")}
                    </td>

                    {/* Seats */}
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200
                        px-2 py-0.5 rounded-xl text-xs font-bold">
                        {bt.totalSeats}
                      </span>
                    </td>

                    {/* Multiplier */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      ×{bt.fareMultiplier}
                    </td>

                    {/* Features */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {bt.hasAc          && <span title="AC"           className="text-sm">❄️</span>}
                        {bt.hasGps         && <span title="GPS"          className="text-sm">📡</span>}
                        {bt.hasLuggageRack && <span title="Luggage Rack" className="text-sm">🧳</span>}
                        {bt.hasMusicSystem && <span title="Music System" className="text-sm">🎵</span>}
                        {bt.hasSeatbelts   && <span title="Seatbelts"    className="text-sm">🪢</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${bt.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-400"}`}>
                        {bt.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-60 group-hover:opacity-100
                        transition-opacity">
                        <button
                          onClick={() => openEdit(bt)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800
                            px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        {bt.isActive ? (
                          <button
                            onClick={() => handleDeactivate(bt.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700
                              px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(bt)}
                            className="text-xs font-medium text-emerald-600
                              hover:text-emerald-800 px-2 py-1 rounded-lg
                              hover:bg-emerald-50 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex
          items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl
            border border-gray-100 my-8">

            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-lg">
                {editTarget ? "Edit Bus Type" : "New Bus Type"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Name + Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Name *
                  </label>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Ordinary 39-Seat"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Code *
                  </label>
                  <input
                    name="code" value={form.code} onChange={handleChange}
                    placeholder="e.g. ORD-39"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2
                      text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category + Seats + Multiplier */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Vehicle Category *
                  </label>
                  <select
                    name="vehicleCategory" value={form.vehicleCategory}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {VEHICLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Total Seats *
                    <span className="ml-1 font-normal text-gray-400">(auto from builder)</span>
                  </label>
                  <input
                    name="totalSeats" type="number" min={1} max={120}
                    value={form.totalSeats} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Fare Multiplier *
                  </label>
                  <input
                    name="fareMultiplier" type="number" step="0.01"
                    min="0.50" max="9.99"
                    value={form.fareMultiplier} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Seat Layout Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500">
                    Seat Layout Template *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBuilder((b) => !b)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700
                      bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors"
                  >
                    {showBuilder ? "Hide Builder" : "Open Layout Builder"}
                  </button>
                </div>

                {showBuilder ? (
                  <SeatLayoutBuilder
                    value={form.seatLayoutTemplate}
                    onChange={(json) =>
                      setForm((f) => ({ ...f, seatLayoutTemplate: json }))}
                    onTotalSeatsChange={(count) =>
                      setForm((f) => ({ ...f, totalSeats: count }))}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border text-sm
                    ${form.seatLayoutTemplate
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                    {form.seatLayoutTemplate
                      ? (() => {
                          try {
                            const t = JSON.parse(form.seatLayoutTemplate);
                            return `✅ ${t.seats?.length ?? "?"} seats — ${t.rows} rows × ${t.cols} cols`;
                          } catch {
                            return "⚠️ JSON present but invalid";
                          }
                        })()
                      : "No layout yet. Click 'Open Layout Builder' above."}
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3">Features</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FEATURES.map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 text-sm cursor-pointer
                        px-3 py-2 rounded-xl border transition-all select-none
                        ${form[key]
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <input
                        type="checkbox" name={key}
                        checked={form[key]} onChange={handleChange}
                        className="sr-only"
                      />
                      <span>{icon}</span>
                      <span className="text-xs font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-100
                  px-3 py-2.5 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm
                  text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
                  text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}