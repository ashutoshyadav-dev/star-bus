import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAllBuses, updateBusStatus, deactivateBus, updateBus } from "../../api/bus";
import { FiEye, FiEdit2, FiPower } from "react-icons/fi";

const BUS_STATUSES = ["active", "in_maintenance", "breakdown", "retired", "condemned"];

const STATUS_STYLE = {
  active:         "bg-emerald-100 text-emerald-700",
  in_maintenance: "bg-amber-100 text-amber-700",
  breakdown:      "bg-red-100 text-red-600",
  retired:        "bg-gray-100 text-gray-500",
  condemned:      "bg-zinc-100 text-zinc-500",
};

const STATUS_CARD = {
  active:         { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", num: "text-emerald-800" },
  in_maintenance: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   num: "text-amber-800"   },
  breakdown:      { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-600",     num: "text-red-800"     },
  retired:        { bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-500",    num: "text-gray-700"    },
  condemned:      { bg: "bg-zinc-50",    border: "border-zinc-200",    text: "text-zinc-500",    num: "text-zinc-700"    },
};

export default function BusListPage() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAllBuses(statusFilter || undefined);
      setBuses(data);
    } catch {
      toast.error("Failed to load buses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateBusStatus(id, status);
      toast.success("Status updated.");
      load();
    } catch {
      toast.error("Status update failed.");
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateBus(id);
      toast.success("Bus deactivated.");
      load();
    } catch {
      toast.error("Deactivation failed.");
    }
  };

  const handleActivate = async (id) => {
    try {
      await updateBus(id, { isActive: true });
      toast.success("Bus reactivated.");
      load();
    } catch {
      toast.error("Activation failed.");
    }
  };

  const filtered = buses.filter(
    (b) =>
      !search ||
      b.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.make?.toLowerCase().includes(search.toLowerCase()) ||
      b.model?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{buses.length} vehicles registered</p>
        </div>
        <button
          onClick={() => navigate("/admin/buses/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm"
        >
          + Register Bus
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {BUS_STATUSES.map((s) => {
          const count = buses.filter((b) => b.status === s).length;
          const c = STATUS_CARD[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? "" : s)}
              className={`rounded-xl border p-3 text-left transition-all ${
                active
                  ? `${c.bg} ${c.border} ring-2 ring-offset-1 ${c.text}`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className={`text-xs capitalize mb-1 ${active ? c.text : "text-gray-400"}`}>{s.replace(/_/g, " ")}</p>
              <p className={`text-2xl font-bold ${active ? c.num : "text-gray-800"}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative sm:max-w-xs w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search reg. no., make, model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading buses…</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Reg. No.", "Type", "Make / Model", "Year", "Seats", "Fuel", "Status", "Active", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((bus) => (
                <tr key={bus.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/admin/buses/${bus.id}`)}
                      className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 text-sm tracking-wide"
                    >
                      {bus.registrationNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{bus.busTypeName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{[bus.make, bus.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{bus.manufacturingYear ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{bus.seatingCapacity ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{bus.fuelType ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={bus.status}
                      onChange={(e) => handleStatusChange(bus.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_STYLE[bus.status] ?? ""}`}
                    >
                      {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bus.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                      {bus.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/admin/buses/${bus.id}`)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors" title="View">
                        <FiEye size={14} />
                      </button>
                      <button onClick={() => navigate(`/admin/buses/${bus.id}/edit`)} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors" title="Edit">
                        <FiEdit2 size={14} />
                      </button>
                      {bus.isActive ? (
                        <button onClick={() => handleDeactivate(bus.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Deactivate">
                          <FiPower size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(bus.id)} className="p-1.5 rounded-lg hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition-colors" title="Reactivate">
                          <FiPower size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🚌</span>
                      <span className="text-sm">No buses found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
