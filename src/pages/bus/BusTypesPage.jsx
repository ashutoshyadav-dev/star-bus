import { useState, useEffect } from "react";
import {
  getAllBusTypes,
  createBusType,
  updateBusType,
  deactivateBusType,
} from "../../api/bus";

const VEHICLE_CATEGORIES = ["bus", "mini_bus", "suv_xylo", "suv_sumo"];

const emptyForm = {
  name: "",
  code: "",
  vehicleCategory: "bus",
  totalSeats: "",
  seatLayoutTemplate: "",
  hasAc: false,
  hasGps: false,
  hasLuggageRack: false,
  hasMusicSystem: false,
  hasSeatbelts: false,
  fareMultiplier: "1.00",
};

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
      setError("Failed to load bus types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeOnly]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); setError(""); };
  const openEdit   = (bt) => {
    setEditTarget(bt);
    setForm({
      name: bt.name ?? "",
      code: bt.code ?? "",
      vehicleCategory: bt.vehicleCategory ?? "bus",
      totalSeats: bt.totalSeats ?? "",
      seatLayoutTemplate: bt.seatLayoutTemplate ?? "",
      hasAc: bt.hasAc ?? false,
      hasGps: bt.hasGps ?? false,
      hasLuggageRack: bt.hasLuggageRack ?? false,
      hasMusicSystem: bt.hasMusicSystem ?? false,
      hasSeatbelts: bt.hasSeatbelts ?? false,
      fareMultiplier: bt.fareMultiplier ?? "1.00",
    });
    setShowModal(true);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        totalSeats: Number(form.totalSeats),
        fareMultiplier: parseFloat(form.fareMultiplier),
      };
      if (editTarget) {
        await updateBusType(editTarget.id, payload);
      } else {
        await createBusType(payload);
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
    if (!window.confirm("Deactivate this bus type?")) return;
    try {
      await deactivateBusType(id);
      load();
    } catch {
      alert("Deactivation failed.");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bus Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage vehicle categories and configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="rounded" />
            Active only
          </label>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Bus Type
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ID", "Name", "Code", "Category", "Seats", "AC", "GPS", "Fare ×", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {busTypes.map((bt) => (
                <tr key={bt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{bt.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{bt.name}</td>
                  <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-xs">{bt.code}</span></td>
                  <td className="px-4 py-3 text-gray-600">{bt.vehicleCategory}</td>
                  <td className="px-4 py-3 text-gray-600">{bt.totalSeats}</td>
                  <td className="px-4 py-3">{bt.hasAc ? "✅" : "—"}</td>
                  <td className="px-4 py-3">{bt.hasGps ? "✅" : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{bt.fareMultiplier}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bt.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {bt.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(bt)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      {bt.isActive && (
                        <button onClick={() => handleDeactivate(bt.id)} className="text-red-500 hover:underline text-xs">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {busTypes.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">No bus types found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editTarget ? "Edit Bus Type" : "Add Bus Type"}</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label>
                <input name="code" value={form.code} onChange={handleChange} maxLength={15} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Category *</label>
                <select name="vehicleCategory" value={form.vehicleCategory} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {VEHICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Total Seats */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Seats *</label>
                <input name="totalSeats" type="number" min={1} max={120} value={form.totalSeats} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {/* Fare Multiplier */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fare Multiplier *</label>
                <input name="fareMultiplier" type="number" step="0.01" min="0.50" max="9.99" value={form.fareMultiplier} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {/* Layout Template */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Seat Layout Template * <span className="text-gray-400 font-normal">(JSON string)</span></label>
                <textarea name="seatLayoutTemplate" value={form.seatLayoutTemplate} onChange={handleChange} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {/* Boolean flags */}
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-600 mb-2">Features</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: "hasAc", label: "AC" },
                    { key: "hasGps", label: "GPS" },
                    { key: "hasLuggageRack", label: "Luggage Rack" },
                    { key: "hasMusicSystem", label: "Music System" },
                    { key: "hasSeatbelts", label: "Seatbelts" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} className="rounded accent-blue-600" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="col-span-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
