import { useState, useEffect } from "react";
import { getMaintenanceByBus, createMaintenance, updateMaintenance, completeMaintenance } from "../../api/bus";

const MAINTENANCE_TYPES = [
  "scheduled_service", "engine_repair", "tyre_replacement", "brake_service",
  "electrical_repair", "ac_repair", "body_repair", "general", "annual_inspection",
];

const emptyForm = {
  maintenanceType: "general",
  description: "",
  startedAt: "",
  expectedCompletionAt: "",
  completedAt: "",
  costInr: "",
  odometerAtService: "",
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
      .catch(() => setError("Failed to load records."))
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
      } else {
        await createMaintenance(payload);
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
    if (!window.confirm("Mark this maintenance as complete?")) return;
    try {
      await completeMaintenance(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message ?? "Failed to complete.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{records.length} maintenance record(s)</p>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          + New Record
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${r.inProgress ? "border-yellow-300" : "border-gray-200"}`}>
              <div className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 capitalize">{r.maintenanceType?.replace(/_/g, " ")}</span>
                    {r.inProgress && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">In Progress</span>}
                    {!r.inProgress && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Completed</span>}
                  </div>
                  {r.description && <p className="text-sm text-gray-600 mb-2">{r.description}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-500">
                    <div><span className="font-semibold">Started:</span> {r.startedAt ? new Date(r.startedAt).toLocaleString() : "—"}</div>
                    <div><span className="font-semibold">Expected:</span> {r.expectedCompletionAt ? new Date(r.expectedCompletionAt).toLocaleString() : "—"}</div>
                    <div><span className="font-semibold">Completed:</span> {r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}</div>
                    <div><span className="font-semibold">Cost (₹):</span> {r.costInr ?? "—"}</div>
                    <div><span className="font-semibold">Odometer:</span> {r.odometerAtService ?? "—"} km</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-4 items-end">
                  <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  {r.inProgress && (
                    <button onClick={() => handleComplete(r.id)} className="text-green-600 hover:underline text-xs">Mark Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">No maintenance records.</div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">{editTarget ? "Edit Maintenance Record" : "New Maintenance Record"}</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Maintenance Type *</label>
                <select name="maintenanceType" value={form.maintenanceType} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {[
                { name: "startedAt", label: "Started At *" },
                { name: "expectedCompletionAt", label: "Expected Completion" },
                { name: "completedAt", label: "Completed At (retroactive)" },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type="datetime-local" name={name} value={form[name]} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cost (₹)</label>
                <input name="costInr" type="number" step="0.01" min="0" value={form.costInr} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Odometer at Service (km)</label>
                <input name="odometerAtService" type="number" min="0" value={form.odometerAtService} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <div className="col-span-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Saving…" : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
