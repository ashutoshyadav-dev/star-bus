import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { getRouteById, updateRoute } from "../api/route";
import { depotApi } from "../api/depot";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

// UpdateRouteRequest: name, operatingDepotId, routeType, isInterstate,
// interstateStates, totalDistanceKm, estimatedDurationMin,
// permitNumber, permitValidUntil, viaDescription
// NOTE: originStation & destinationStation cannot be changed via update

const ROUTE_TYPES = ["ordinary","semi_deluxe","deluxe","express","volvo_ac","xylo","sumo"];
const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white w-full";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      {children}
    </div>
  );
}

export default function EditRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(null);
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const { data, isLoading } = useQuery(["route", id], () => getRouteById(id), { enabled: !!id });
  const route = data?.data?.data ?? data?.data ?? null;

  const { data: dpData } = useQuery(["depots-active"], depotApi.getActiveDepots);
  const depots = dpData?.data?.data ?? dpData?.data ?? [];

  // Pre-fill form when route loads
  useEffect(() => {
    if (!route) return;
    setForm({
      name:                route.name ?? "",
      operatingDepotId:    route.operatingDepotId ?? "",
      routeType:           route.routeType ?? "",
      isInterstate:        route.isInterstate ?? false,
      interstateStates:    "",
      totalDistanceKm:     route.totalDistanceKm ?? "",
      estimatedDurationMin: route.estimatedDurationMin ?? "",
      permitNumber:        route.permitNumber ?? "",
      permitValidUntil:    route.permitValidUntil ?? "",
      viaDescription:      route.viaDescription ?? "",
    });
  }, [route]);

  const updateMut = useMutation((payload) => updateRoute(id, payload), {
    onSuccess: () => {
      toast.success("Route updated");
      qc.invalidateQueries(["route", id]);
      qc.invalidateQueries("routes");
      navigate(`/admin/routes/${id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to update"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMut.mutate({
      name:                 form.name                 || undefined,
      operatingDepotId:     form.operatingDepotId     ? Number(form.operatingDepotId) : undefined,
      routeType:            form.routeType             || undefined,
      isInterstate:         form.isInterstate,
      interstateStates:     form.interstateStates      || undefined,
      totalDistanceKm:      form.totalDistanceKm       ? parseFloat(form.totalDistanceKm) : undefined,
      estimatedDurationMin: form.estimatedDurationMin  ? parseInt(form.estimatedDurationMin, 10) : undefined,
      permitNumber:         form.permitNumber          || undefined,
      permitValidUntil:     form.permitValidUntil      || undefined,
      viaDescription:       form.viaDescription        || undefined,
    });
  };

  if (isLoading || !form) {
    return <div className="p-8 text-center text-gray-400">Loading route…</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white rounded-xl shadow border border-blue-100 p-6 max-w-3xl mx-auto">

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-semibold">Edit Route</h2>
            <p className="text-xs text-gray-400 font-mono">{route.routeNumber} — {route.originStationName} → {route.destinationStationName}</p>
          </div>
        </div>

        {/* read-only info */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-xs text-blue-700">
          Origin and destination stations cannot be changed after creation.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Route Name">
              <input className={inputCls} value={form.name} maxLength={200}
                onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Route Type">
              <select className={inputCls} value={form.routeType} onChange={e => set("routeType", e.target.value)}>
                <option value="">Select type</option>
                {ROUTE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </Field>
            <Field label="Operating Depot">
              <select className={inputCls} value={form.operatingDepotId} onChange={e => set("operatingDepotId", e.target.value)}>
                <option value="">Select depot</option>
                {depots.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </Field>
            <Field label="Total Distance (km)">
              <input className={inputCls} type="number" step="0.01" min="0.01"
                value={form.totalDistanceKm} onChange={e => set("totalDistanceKm", e.target.value)} />
            </Field>
            <Field label="Estimated Duration (minutes)">
              <input className={inputCls} type="number" min="1"
                value={form.estimatedDurationMin} onChange={e => set("estimatedDurationMin", e.target.value)} />
            </Field>
            <Field label="Permit Number">
              <input className={inputCls} maxLength={50}
                value={form.permitNumber} onChange={e => set("permitNumber", e.target.value)} />
            </Field>
            <Field label="Permit Valid Until">
              <input className={inputCls} type="date"
                value={form.permitValidUntil} onChange={e => set("permitValidUntil", e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Via Description">
                <input className={inputCls} maxLength={500}
                  value={form.viaDescription} onChange={e => set("viaDescription", e.target.value)} />
              </Field>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isInterstate}
              onChange={e => set("isInterstate", e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">Interstate route</span>
          </label>
          {form.isInterstate && (
            <Field label="Interstate States">
              <input className={inputCls} placeholder="e.g. Arunachal Pradesh, Assam"
                value={form.interstateStates} onChange={e => set("interstateStates", e.target.value)} />
            </Field>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updateMut.isLoading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm hover:bg-blue-700 disabled:opacity-50">
              {updateMut.isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}