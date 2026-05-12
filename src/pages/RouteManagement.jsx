import React, { useState } from "react";
import { Search, CheckCircle, Ban, ShieldOff, ShieldCheck, Plus, Eye, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { getAllRoutes, suspendRoute, activateRoute } from "../api/route";
import toast from "react-hot-toast";
import { format } from "date-fns";

const STATUS_COLORS = {
  ACTIVE:    "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-600",
  INACTIVE:  "bg-gray-200 text-gray-600",
};

const ROUTE_TYPE_COLORS = {
  EXPRESS:       "bg-purple-50 text-purple-700 border-purple-200",
  SUPER_EXPRESS: "bg-pink-50 text-pink-700 border-pink-200",
  URBAN:         "bg-blue-50 text-blue-700 border-blue-200",
  SUBURBAN:      "bg-indigo-50 text-indigo-700 border-indigo-200",
  RURAL:         "bg-amber-50 text-amber-700 border-amber-200",
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500";
  const icon = status === "ACTIVE"
    ? <CheckCircle size={12} />
    : <Ban size={12} />;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {icon} {status}
    </span>
  );
}

export default function RouteManagement() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [typeFilter,    setTypeFilter]    = useState("");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [suspendModal,  setSuspendModal]  = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");

  const ENTRIES = 8;

  /* ── data ── */
  const { data, isLoading } = useQuery(["routes"], getAllRoutes, { staleTime: 30_000 });
  const routes = data?.data?.data ?? [];

  /* ── mutations ── */
  const suspendMut = useMutation(
    ({ id, reason }) =>
      suspendRoute(id, { status: "SUSPENDED", suspensionReason: reason }),
    {
      onSuccess: () => {
        toast.success("Route suspended");
        qc.invalidateQueries("routes");
        setSuspendModal(false);
        setSuspendReason("");
      },
      onError: () => toast.error("Failed to suspend route"),
    }
  );

  const activateMut = useMutation(activateRoute, {
    onSuccess: () => { toast.success("Route activated"); qc.invalidateQueries("routes"); },
    onError:   () => toast.error("Failed to activate route"),
  });

  /* ── filter ── */
  const filtered = routes.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      (r.routeNumber ?? "").toLowerCase().includes(q) ||
      (r.name ?? "").toLowerCase().includes(q) ||
      (r.originStationName ?? "").toLowerCase().includes(q) ||
      (r.destinationStationName ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    const matchType   = typeFilter   ? r.routeType === typeFilter  : true;
    return matchSearch && matchStatus && matchType;
  });

  /* ── pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ENTRIES));
  const start      = (currentPage - 1) * ENTRIES;
  const current    = filtered.slice(start, start + ENTRIES);

  const fmtDuration = (mins) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" className="w-12 h-12" alt="" />
            <div>
              <h2 className="text-2xl font-semibold">Route Management</h2>
              <p className="text-sm text-gray-400">{routes.length} routes • {filtered.length} shown</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/addroute")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Route 
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow">
          <div className="flex items-center border rounded-lg px-3 py-2 w-72">
            <Search size={15} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search number, name, origin, destination..."
              className="w-full outline-none text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2 text-sm outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm outline-none"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Types</option>
            {["URBAN","SUBURBAN","RURAL","EXPRESS","SUPER_EXPRESS"].map(t => (
              <option key={t} value={t}>{t.replace("_"," ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-gray-400">Loading routes…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No routes found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                  <tr>
                    {["Route No","Name","Origin → Destination","Depot","Type","Distance","Duration","Permit Until","Status","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left border-b border-gray-100 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {current.map((route) => (
                    <tr
                      key={route.id}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/routes/${route.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {route.routeNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="truncate font-medium text-gray-800" title={route.name}>{route.name ?? "—"}</p>
                        {route.isInterstate && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Interstate</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-blue-600 font-medium">{route.originStationName ?? "—"}</span>
                        <span className="text-gray-400 mx-1.5">→</span>
                        <span className="text-gray-700">{route.destinationStationName ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{route.operatingDepotName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROUTE_TYPE_COLORS[route.routeType] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {route.routeType?.replace("_"," ") ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {route.totalDistanceKm ? `${route.totalDistanceKm} km` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {fmtDuration(route.estimatedDurationMin)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {route.permitValidUntil ? format(new Date(route.permitValidUntil), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={route.status} /></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/admin/routes/${route.id}`)}
                            title="View detail"
                            className="p-1.5 hover:bg-blue-100 text-blue-500 rounded"
                          ><Eye size={15} /></button>
                          <button
                            onClick={() => navigate(`/admin/routes/${route.id}/edit`)}
                            title="Edit"
                            className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded"
                          ><Pencil size={15} /></button>
                          {route.status !== "ACTIVE" && (
                            <button
                              onClick={() => activateMut.mutate(route.id)}
                              title="Activate"
                              disabled={activateMut.isLoading}
                              className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded disabled:opacity-40"
                            ><ShieldCheck size={15} /></button>
                          )}
                          {route.status === "ACTIVE" && (
                            <button
                              onClick={() => { setSuspendTarget(route.id); setSuspendModal(true); }}
                              title="Suspend"
                              className="p-1.5 hover:bg-red-100 text-red-500 rounded"
                            ><ShieldOff size={15} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 text-sm bg-gray-50 border-t border-gray-100">
              <p className="text-gray-500">
                Showing {start + 1}–{Math.min(start + ENTRIES, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100">Prev</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "border hover:bg-gray-100"}`}>
                    {i + 1}
                  </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Suspend Modal ── */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-1">Suspend Route</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason — this is stored in the backend.</p>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
              rows={3}
              placeholder="e.g. Road construction on NH-415"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setSuspendModal(false); setSuspendReason(""); }}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50"
              >Cancel</button>
              <button
                disabled={!suspendReason.trim() || suspendMut.isLoading}
                onClick={() => suspendMut.mutate({ id: suspendTarget, reason: suspendReason })}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {suspendMut.isLoading ? "Suspending…" : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}