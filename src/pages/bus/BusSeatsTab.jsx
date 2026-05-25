import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSeatsByBus, createSeat, updateSeat, deactivateSeat } from "../../api/bus";

const SEAT_TYPES = ["window", "aisle", "middle", "lower_berth", "upper_berth", "driver_side", "sleeper"];
const DECKS = ["lower", "upper"];

const emptySeat = {
  seatLabel: "", seatType: "window", deck: "lower",
  rowNumber: "", colNumber: "",
  isLadiesQuota: false, isDifferentlyAbled: false, isActive: true,
};

const SEAT_TYPE_COLOR = {
  window:       "bg-sky-50 text-sky-700",
  aisle:        "bg-violet-50 text-violet-700",
  middle:       "bg-gray-100 text-gray-600",
  lower_berth:  "bg-amber-50 text-amber-700",
  upper_berth:  "bg-orange-50 text-orange-700",
  driver_side:  "bg-red-50 text-red-600",
  sleeper:      "bg-teal-50 text-teal-700",
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
      .catch(() => toast.error("Failed to load seats."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [busId]);

  const openCreate = () => { setEditTarget(null); setForm(emptySeat); setError(""); setShowModal(true); };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      seatLabel: s.seatLabel, seatType: s.seatType, deck: s.deck ?? "lower",
      rowNumber: s.rowNumber, colNumber: s.colNumber,
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
      const payload = { ...form, busId, rowNumber: Number(form.rowNumber), colNumber: Number(form.colNumber) };
      if (editTarget) {
        await updateSeat(editTarget.id, payload);
        toast.success("Seat updated.");
      } else {
        await createSeat(payload);
        toast.success("Seat added.");
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
      await deactivateSeat(id);
      toast.success("Seat deactivated.");
      load();
    } catch {
      toast.error("Failed to deactivate seat.");
    }
  };

  const handleActivate = async (seat) => {
    try {
      await updateSeat(seat.id, { ...seat, busId, isActive: true });
      toast.success("Seat activated.");
      load();
    } catch {
      toast.error("Failed to activate seat.");
    }
  };

  const activeCount   = seats.filter(s => s.isActive).length;
  const ladiesCount   = seats.filter(s => s.isLadiesQuota).length;
  const disabledCount = seats.filter(s => s.isDifferentlyAbled).length;

  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-3">
          <span className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-600">
            <span className="font-bold text-gray-900">{seats.length}</span> total
          </span>
          <span className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="font-bold">{activeCount}</span> active
          </span>
          {ladiesCount > 0 && (
            <span className="bg-pink-50 border border-pink-200 rounded-xl px-3 py-1.5 text-xs font-medium text-pink-700">
              <span className="font-bold">{ladiesCount}</span> ladies
            </span>
          )}
          {disabledCount > 0 && (
            <span className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-medium text-blue-700">
              <span className="font-bold">{disabledCount}</span> accessible
            </span>
          )}
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors">
          + Add Seat
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Label", "Type", "Deck", "Row", "Col", "Ladies", "Accessible", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {seats.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg text-xs">{s.seatLabel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEAT_TYPE_COLOR[s.seatType] ?? "bg-gray-100 text-gray-600"}`}>
                      {s.seatType?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize text-xs">{s.deck}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.rowNumber}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.colNumber}</td>
                  <td className="px-4 py-3 text-center">{s.isLadiesQuota ? <span className="text-pink-500">♀</span> : <span className="text-gray-200">—</span>}</td>
                  <td className="px-4 py-3 text-center">{s.isDifferentlyAbled ? <span className="text-blue-500">♿</span> : <span className="text-gray-200">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                        Edit
                      </button>
                      {s.isActive ? (
                        <button onClick={() => handleDeactivate(s.id)} className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(s)} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {seats.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">💺</span>
                      <span className="text-sm">No seats configured.</span>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{editTarget ? "Edit Seat" : "Add Seat"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Seat Label *</label>
                <input name="seatLabel" value={form.seatLabel} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Seat Type *</label>
                <select name="seatType" value={form.seatType} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SEAT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Deck</label>
                <select name="deck" value={form.deck} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DECKS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Row *</label>
                <input name="rowNumber" type="number" min={1} value={form.rowNumber} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Column *</label>
                <input name="colNumber" type="number" min={1} value={form.colNumber} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                {[
                  { name: "isLadiesQuota",     label: "Ladies Quota",      emoji: "♀️" },
                  { name: "isDifferentlyAbled", label: "Accessible",        emoji: "♿" },
                  { name: "isActive",           label: "Active",            emoji: "✅" },
                ].map(({ name, label, emoji }) => (
                  <label key={name} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-xl border transition-all ${form[name] ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                    <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="sr-only" />
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs font-medium">{label}</span>
                  </label>
                ))}
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
