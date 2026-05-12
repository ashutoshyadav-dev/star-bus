import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBuses, updateBusStatus, deactivateBus } from "../../api/bus";
import { FiEye, FiEdit2, FiPower } from "react-icons/fi"; // Added icons

const BUS_STATUSES = ["active", "in_maintenance", "breakdown", "retired", "condemned"];

const statusColor = {
  active: "bg-green-100 text-green-700",
  in_maintenance: "bg-yellow-100 text-yellow-700",
  breakdown: "bg-red-100 text-red-600",
  retired: "bg-gray-100 text-gray-500",
  condemned: "bg-gray-200 text-gray-400",
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
      alert("Failed to load buses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateBusStatus(id, status);
      load();
    } catch {
      alert("Status update failed.");
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this bus?")) return;
    try {
      await deactivateBus(id);
      load();
    } catch {
      alert("Deactivation failed.");
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
          <h1 className="text-2xl font-bold text-white">Buses</h1>
          <p className="text-sm text-white mt-0.5">{buses.length} vehicles in fleet</p>
        </div>
        <button
          onClick={() => navigate("/admin/buses/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-fit"
        >
          + Register Bus 
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search registration, make, model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {BUS_STATUSES.map((s) => {
          const count = buses.filter((b) => b.status === s).length;
          return (
            <div key={s} onClick={() => setStatusFilter(s === statusFilter ? "" : s)} className={`rounded-xl border p-3 cursor-pointer transition-all ${statusFilter === s ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}>
              <p className="text-xs text-gray-500 capitalize mb-1">{s.replace("_", " ")}</p>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Reg. No.", "Type", "Make / Model", "Year", "Seats", "Fuel", "Status", "Active", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/admin/buses/${bus.id}`)} className="text-blue-600 hover:underline font-mono font-medium">
                      {bus.registrationNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{bus.busTypeName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-800">{[bus.make, bus.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{bus.manufacturingYear ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{bus.seatingCapacity}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{bus.fuelType ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={bus.status}
                      onChange={(e) => handleStatusChange(bus.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusColor[bus.status] ?? ""}`}
                    >
                      {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bus.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {bus.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => navigate(`/admin/buses/${bus.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View"
                      >
                        <FiEye />
                      </button>

                      <button
                        onClick={() => navigate(`/admin/buses/${bus.id}/edit`)}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>

                      {bus.isActive && (
                        <button
                          onClick={() => handleDeactivate(bus.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Deactivate"
                        >
                          <FiPower />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No buses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}