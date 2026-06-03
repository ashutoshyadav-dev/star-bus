import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getMaintenanceByBus, createMaintenance, updateMaintenance, completeMaintenance } from "../../api/bus";

const MAINTENANCE_TYPES = [
  "scheduled_service", "breakdown_repair", "accident_repair",
  "fitness_renewal", "tyre_change", "body_work", "engine_overhaul",
];

const TYPE_CONFIG = {
  scheduled_service: { icon: "🔧", color: "bg-blue-50 text-blue-700"    },
  breakdown_repair:  { icon: "🚨", color: "bg-red-50 text-red-600"      },
  accident_repair:   { icon: "💥", color: "bg-orange-50 text-orange-700" },
  fitness_renewal:   { icon: "📋", color: "bg-purple-50 text-purple-700" },
  tyre_change:       { icon: "🛞", color: "bg-yellow-50 text-yellow-700" },
  body_work:         { icon: "🚌", color: "bg-teal-50 text-teal-700"     },
  engine_overhaul:   { icon: "⚙️", color: "bg-gray-100 text-gray-700"   },
};

const emptyForm = {
  maintenanceType: "scheduled_service",
  description: "", startedAt: "", expectedCompletionAt: "",
  completedAt: "", costInr: "", odometerAtService: "",
};

export default function BusMaintenanceTab({ busId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getMaintenanceByBus(busId)
      .then(({ data }) => setRecords(data))
      .catch(() => toast.error("Failed to load maintenance records."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [busId]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setError(""); setShowModal(true); };
  const openEdit = (r) => {
    setEditTarget(r);
    setForm({
      maintenanceType: r.maintenanceType,
      description: r.description ?? "",
      startedAt: r.startedAt ? r.startedAt.slice(0, 16) : "",
      expectedCompletionAt: r.expectedCompletionAt ? r.expectedCompletionAt.slice(0, 16) : "",
      completedAt: r.completedAt ? r.completedAt.slice(0, 16) : "",
      costInr: r.costInr ?? "",
      odometerAtService: r.odometerAtService ?? "",
    });
    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        busId,
        maintenanceType: form.maintenanceType,
        description: form.description || undefined,
        startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : undefined,
        expectedCompletionAt: form.expectedCompletionAt ? new Date(form.expectedCompletionAt).toISOString() : undefined,
        completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : undefined,
        costInr: form.costInr ? parseFloat(form.costInr) : undefined,
        odometerAtService: form.odometerAtService ? Number(form.odometerAtService) : undefined,
      };
      if (editTarget) {
        await updateMaintenance(editTarget.id, payload);
        toast.success("Record updated.");
      } else {
        await createMaintenance(payload);
        toast.success("Maintenance record created.");
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeMaintenance(id);
      toast.success("Marked as complete.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to complete.");
    }
  };

  const inProgressCount = records.filter(r => r.inProgress).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-3">
          <span className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-600">
            <span className="font-bold text-gray-900">{records.length}</span> records
          </span>
          {inProgressCount > 0 && (
            <span className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-medium text-amber-700">
              <span className="font-bold">{inProgressCount}</span> in progress
            </span>
          )}
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors">
          + New Record
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const tc = TYPE_CONFIG[r.maintenanceType] ?? { icon: "🔧", color: "bg-gray-100 text-gray-700" };
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${r.inProgress ? "border-amber-200" : "border-gray-200"}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Type icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${tc.color}`}>
                        {tc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${tc.color}`}>
                            {r.maintenanceType?.replace(/_/g, " ")}
                          </span>
                          {r.inProgress
                            ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">In Progress</span>
                            : <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Completed</span>
                          }
                        </div>
                        {r.description && <p className="text-sm text-gray-600 mb-2 leading-relaxed">{r.description}</p>}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                          {[
                            ["Started",   r.startedAt ? new Date(r.startedAt).toLocaleDateString() : null],
                            ["Expected",  r.expectedCompletionAt ? new Date(r.expectedCompletionAt).toLocaleDateString() : null],
                            ["Completed", r.completedAt ? new Date(r.completedAt).toLocaleDateString() : null],
                            ["Cost",      r.costInr != null ? `₹${Number(r.costInr).toLocaleString()}` : null],
                            ["Odometer",  r.odometerAtService != null ? `${Number(r.odometerAtService).toLocaleString()} km` : null],
                          ].map(([label, val]) => (
                            <div key={label}>
                              <span className="text-gray-400 font-medium">{label}: </span>
                              <span className="text-gray-700">{val ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button onClick={() => openEdit(r)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                        Edit
                      </button>
                      {r.inProgress && (
                        <button
                          onClick={() => handleComplete(r.id)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap"
                        >
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {records.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <span className="text-3xl">🔧</span>
                <span className="text-sm">No maintenance records.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{editTarget ? "Edit Maintenance Record" : "New Maintenance Record"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Maintenance Type *</label>
                <select name="maintenanceType" value={form.maintenanceType} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MAINTENANCE_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_CONFIG[t]?.icon} {t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              {[
                { name: "startedAt",             label: "Started At *"              },
                { name: "expectedCompletionAt",  label: "Expected Completion"       },
                { name: "completedAt",           label: "Completed At (retroactive)" },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input type="datetime-local" name={name} value={form[name]} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cost (₹)</label>
                <input name="costInr" type="number" step="0.01" min="0" value={form.costInr} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Odometer at Service (km)</label>
                <input name="odometerAtService" type="number" min="0" value={form.odometerAtService} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <div className="col-span-2 text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">{error}</div>}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
