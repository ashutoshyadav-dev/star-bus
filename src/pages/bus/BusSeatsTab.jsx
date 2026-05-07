import { useState, useEffect } from "react";
import { getSeatsByBus, createSeat, updateSeat, deactivateSeat } from "../../api/bus";

const SEAT_TYPES = ["window", "aisle", "middle", "lower_berth", "upper_berth", "driver_side", "sleeper"];
const DECKS = ["lower", "upper"];

const emptySeat = {
  seatLabel: "",
  seatType: "window",
  deck: "lower",
  rowNumber: "",
  colNumber: "",
  isLadiesQuota: false,
  isDifferentlyAbled: false,
  isActive: true,
};

export default function BusSeatsTab({ busId }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptySeat);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getSeatsByBus(busId)
      .then(({ data }) => setSeats(data))
      .catch(() => setError("Failed to load seats."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [busId]);

  const openCreate = () => { setEditTarget(null); setForm(emptySeat); setError(""); setShowModal(true); };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      seatLabel: s.seatLabel,
      seatType: s.seatType,
      deck: s.deck ?? "lower",
      rowNumber: s.rowNumber,
      colNumber: s.colNumber,
      isLadiesQuota: s.isLadiesQuota ?? false,
      isDifferentlyAbled: s.isDifferentlyAbled ?? false,
      isActive: s.isActive ?? true,
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
      const payload = {
        ...form,
        busId,
        rowNumber: Number(form.rowNumber),
        colNumber: Number(form.colNumber),
      };
      if (editTarget) {
        await updateSeat(editTarget.id, payload);
      } else {
        await createSeat(payload);
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
    if (!window.confirm("Deactivate this seat?")) return;
    try { await deactivateSeat(id); load(); } catch { alert("Failed."); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{seats.length} seats</p>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          + Add Seat
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Label", "Type", "Deck", "Row", "Col", "Ladies", "Disabled", "Active", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {seats.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{s.seatLabel}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{s.seatType?.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{s.deck}</td>
                  <td className="px-4 py-3 text-gray-600">{s.rowNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{s.colNumber}</td>
                  <td className="px-4 py-3">{s.isLadiesQuota ? "✅" : "—"}</td>
                  <td className="px-4 py-3">{s.isDifferentlyAbled ? "✅" : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      {s.isActive && <button onClick={() => handleDeactivate(s.id)} className="text-red-500 hover:underline text-xs">Deactivate</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {seats.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-gray-400">No seats configured.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">{editTarget ? "Edit Seat" : "Add Seat"}</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Seat Label *</label>
                <input name="seatLabel" value={form.seatLabel} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Seat Type *</label>
                <select name="seatType" value={form.seatType} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SEAT_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Deck</label>
                <select name="deck" value={form.deck} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DECKS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Row *</label>
                <input name="rowNumber" type="number" min={1} value={form.rowNumber} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Col *</label>
                <input name="colNumber" type="number" min={1} value={form.colNumber} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                {[
                  { name: "isLadiesQuota", label: "Ladies Quota" },
                  { name: "isDifferentlyAbled", label: "Differently Abled" },
                  { name: "isActive", label: "Active" },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="rounded accent-blue-600" />
                    {label}
                  </label>
                ))}
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
