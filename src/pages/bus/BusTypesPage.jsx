import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getAllBusTypes, createBusType, updateBusType, deactivateBusType } from "../../api/bus";

const VEHICLE_CATEGORIES = ["bus", "mini_bus", "suv_xylo", "suv_sumo"];

const emptyForm = {
  name: "", code: "", vehicleCategory: "bus", totalSeats: "",
  seatLayoutTemplate: "", hasAc: false, hasGps: false,
  hasLuggageRack: false, hasMusicSystem: false, hasSeatbelts: false,
  fareMultiplier: "1.00",
};

const FEATURES = [
  { key: "hasAc",          label: "AC",           icon: "❄️" },
  { key: "hasGps",         label: "GPS",          icon: "📡" },
  { key: "hasLuggageRack", label: "Luggage Rack", icon: "🧳" },
  { key: "hasMusicSystem", label: "Music System", icon: "🎵" },
  { key: "hasSeatbelts",   label: "Seatbelts",    icon: "🪢" },
];

export default function BusTypesPage() {
  const [busTypes, setBusTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAllBusTypes(activeOnly);
      setBusTypes(data);
    } catch {
      toast.error("Failed to load bus types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeOnly]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setError(""); setShowModal(true); };
  const openEdit = (bt) => {
    setEditTarget(bt);
    setForm({
      name: bt.name ?? "", code: bt.code ?? "",
      vehicleCategory: bt.vehicleCategory ?? "bus",
      totalSeats: bt.totalSeats ?? "",
      seatLayoutTemplate: bt.seatLayoutTemplate ?? "",
      hasAc: bt.hasAc ?? false, hasGps: bt.hasGps ?? false,
      hasLuggageRack: bt.hasLuggageRack ?? false,
      hasMusicSystem: bt.hasMusicSystem ?? false,
      hasSeatbelts: bt.hasSeatbelts ?? false,
      fareMultiplier: bt.fareMultiplier ?? "1.00",
    });
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, totalSeats: Number(form.totalSeats), fareMultiplier: parseFloat(form.fareMultiplier) };
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

  const handleActivate = async (id) => {
    try {
      await updateBusType(id, { isActive: true });
      toast.success("Bus type activated.");
      load();
    } catch {
      toast.error("Activation failed.");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage vehicle categories and configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none bg-white border border-gray-200 rounded-xl px-3 py-2">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="rounded accent-blue-600" />
            Active only
          </label>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
            + Add Bus Type
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["ID", "Name", "Code", "Category", "Seats", "Features", "Fare ×", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {busTypes.map((bt) => (
                <tr key={bt.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-4 py-3 text-gray-400 text-xs">{bt.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{bt.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-mono text-xs font-semibold">{bt.code}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{bt.vehicleCategory?.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{bt.totalSeats}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {FEATURES.filter(f => bt[f.key]).map(f => (
                        <span key={f.key} title={f.label} className="text-sm">{f.icon}</span>
                      ))}
                      {!FEATURES.some(f => bt[f.key]) && <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg text-xs font-semibold">{bt.fareMultiplier}×</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${bt.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                      {bt.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(bt)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                        Edit
                      </button>
                      {bt.isActive ? (
                        <button onClick={() => handleDeactivate(bt.id)} className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(bt.id)} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {busTypes.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🚌</span>
                      <span className="text-sm">No bus types found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">{editTarget ? "Edit Bus Type" : "Add Bus Type"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Code *</label>
                <input name="code" value={form.code} onChange={handleChange} maxLength={15} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vehicle Category *</label>
                <select name="vehicleCategory" value={form.vehicleCategory} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {VEHICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Total Seats *</label>
                <input name="totalSeats" type="number" min={1} max={120} value={form.totalSeats} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fare Multiplier *</label>
                <input name="fareMultiplier" type="number" step="0.01" min="0.50" max="9.99" value={form.fareMultiplier} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Seat Layout Template * <span className="text-gray-400 font-normal">(JSON)</span>
                </label>
                <textarea name="seatLayoutTemplate" value={form.seatLayoutTemplate} onChange={handleChange} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 mb-3">Features</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FEATURES.map(({ key, label, icon }) => (
                    <label key={key} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-xl border transition-all ${form[key] ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} className="sr-only" />
                      <span>{icon}</span>
                      <span className="text-xs font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <div className="col-span-2 text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">{error}</div>}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
