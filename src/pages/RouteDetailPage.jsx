import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  getRouteDetail, getStops, getViaPoints,
  addStop, updateStop, removeStop,
  addViaPoint, removeViaPoint
} from "../api/route";
import { stationApi } from "../api/station";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  ArrowLeft, Pencil, Trash2, Plus, CheckCircle, Ban,
  MapPin, Navigation, Info, AlertTriangle
} from "lucide-react";

const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white w-full";

function Badge({ children, color = "gray" }) {
  const map = {
    green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-700", gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-600",
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>{children}</span>;
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value ?? "—"}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ STOPS TAB */
function StopsTab({ routeId }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editStop, setEditStop] = useState(null);
  const [form, setForm] = useState({
    stationId:"", stopSequence:"", arrivalOffsetMin:0, departureOffsetMin:0,
    haltDurationMin:0, distanceFromOriginKm:"", baseFareFromOrigin:"",
    isBoardingAllowed:true, isAlightingAllowed:true, platformNumber:""
  });

  const { data, isLoading } = useQuery(["stops", routeId], () => getStops(routeId));
  const stops = data?.data?.data ?? [];

  const { data: stData } = useQuery(["stations-active"], stationApi.getActiveStations);
  const stations = stData?.data?.data ?? stData?.data ?? [];

  const addMut = useMutation((payload) => addStop(routeId, payload), {
    onSuccess: () => { toast.success("Stop added"); qc.invalidateQueries(["stops", routeId]); setShowAdd(false); },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Failed to add stop"),
  });

  const updateMut = useMutation(({ id, payload }) => updateStop(id, payload), {
    onSuccess: () => { toast.success("Stop updated"); qc.invalidateQueries(["stops", routeId]); setEditStop(null); },
    onError: () => toast.error("Failed to update stop"),
  });

  const removeMut = useMutation(removeStop, {
    onSuccess: () => { toast.success("Stop removed"); qc.invalidateQueries(["stops", routeId]); },
    onError: () => toast.error("Failed to remove stop"),
  });

  const handleAdd = () => addMut.mutate({
    stationId:            Number(form.stationId),
    stopSequence:         Number(form.stopSequence),
    arrivalOffsetMin:     Number(form.arrivalOffsetMin),
    departureOffsetMin:   Number(form.departureOffsetMin),
    haltDurationMin:      Number(form.haltDurationMin),
    distanceFromOriginKm: parseFloat(form.distanceFromOriginKm),
    baseFareFromOrigin:   parseFloat(form.baseFareFromOrigin),
    isBoardingAllowed:    form.isBoardingAllowed,
    isAlightingAllowed:   form.isAlightingAllowed,
    platformNumber:       form.platformNumber || null,
  });

  const handleUpdate = () => updateMut.mutate({
    id: editStop.id,
    payload: {
      arrivalOffsetMin:   Number(form.arrivalOffsetMin),
      departureOffsetMin: Number(form.departureOffsetMin),
      haltDurationMin:    Number(form.haltDurationMin),
      baseFareFromOrigin: parseFloat(form.baseFareFromOrigin),
      isBoardingAllowed:  form.isBoardingAllowed,
      isAlightingAllowed: form.isAlightingAllowed,
      platformNumber:     form.platformNumber || null,
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">Route Stops ({stops.length})</h3>
        <button onClick={() => { setShowAdd(true); setEditStop(null); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5">
          <Plus size={14} /> Add Stop
        </button>
      </div>

      {isLoading ? <p className="text-center text-gray-400 py-4">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500">
              <tr>
                {["Seq","Station","Arr. Offset","Dep. Offset","Halt","Distance","Base Fare","Platform","Board","Alight",""].map(h =>
                  <th key={h} className="px-3 py-2 text-left border-b border-gray-200 whitespace-nowrap">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stops.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">{s.stopSequence}</td>
                  <td className="px-3 py-2 font-medium">{s.stationName} <span className="text-gray-400 text-xs">({s.stationCode})</span></td>
                  <td className="px-3 py-2 text-gray-500">{s.arrivalOffsetMin} min</td>
                  <td className="px-3 py-2 text-gray-500">{s.departureOffsetMin} min</td>
                  <td className="px-3 py-2 text-gray-500">{s.haltDurationMin} min</td>
                  <td className="px-3 py-2">{s.distanceFromOriginKm} km</td>
                  <td className="px-3 py-2">₹{s.baseFareFromOrigin}</td>
                  <td className="px-3 py-2 text-gray-500">{s.platformNumber ?? "—"}</td>
                  <td className="px-3 py-2">{s.isBoardingAllowed ? <Badge color="green">Yes</Badge> : <Badge color="red">No</Badge>}</td>
                  <td className="px-3 py-2">{s.isAlightingAllowed ? <Badge color="green">Yes</Badge> : <Badge color="red">No</Badge>}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditStop(s); setShowAdd(false);
                        setForm({ arrivalOffsetMin: s.arrivalOffsetMin, departureOffsetMin: s.departureOffsetMin,
                          haltDurationMin: s.haltDurationMin, baseFareFromOrigin: s.baseFareFromOrigin,
                          isBoardingAllowed: s.isBoardingAllowed, isAlightingAllowed: s.isAlightingAllowed,
                          platformNumber: s.platformNumber ?? "" }); }}
                        className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded"><Pencil size={13} /></button>
                      <button onClick={() => { if (window.confirm("Remove this stop?")) removeMut.mutate(s.id); }}
                        className="p-1.5 hover:bg-red-100 text-red-500 rounded"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Stop inline form */}
      {(showAdd || editStop) && (
        <div className="mt-4 border border-blue-100 rounded-xl p-4 bg-blue-50">
          <h4 className="font-medium text-sm text-blue-800 mb-3">{editStop ? "Edit Stop" : "Add New Stop"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {!editStop && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Station *</label>
                  <select className={inputCls} value={form.stationId} onChange={e => setForm(p => ({...p, stationId: e.target.value}))}>
                    <option value="">Select</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Sequence *</label>
                  <input className={inputCls} type="number" min="0" value={form.stopSequence}
                    onChange={e => setForm(p => ({...p, stopSequence: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Distance from Origin (km) *</label>
                  <input className={inputCls} type="number" step="0.01" value={form.distanceFromOriginKm}
                    onChange={e => setForm(p => ({...p, distanceFromOriginKm: e.target.value}))} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-gray-500">Base Fare (₹) *</label>
              <input className={inputCls} type="number" step="0.01" value={form.baseFareFromOrigin}
                onChange={e => setForm(p => ({...p, baseFareFromOrigin: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Arrival Offset (min)</label>
              <input className={inputCls} type="number" min="0" value={form.arrivalOffsetMin}
                onChange={e => setForm(p => ({...p, arrivalOffsetMin: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Departure Offset (min)</label>
              <input className={inputCls} type="number" min="0" value={form.departureOffsetMin}
                onChange={e => setForm(p => ({...p, departureOffsetMin: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Halt Duration (min)</label>
              <input className={inputCls} type="number" min="0" value={form.haltDurationMin}
                onChange={e => setForm(p => ({...p, haltDurationMin: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Platform No.</label>
              <input className={inputCls} maxLength={10} value={form.platformNumber}
                onChange={e => setForm(p => ({...p, platformNumber: e.target.value}))} />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={form.isBoardingAllowed}
                  onChange={e => setForm(p => ({...p, isBoardingAllowed: e.target.checked}))} className="accent-blue-600" />
                Boarding
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={form.isAlightingAllowed}
                  onChange={e => setForm(p => ({...p, isAlightingAllowed: e.target.checked}))} className="accent-blue-600" />
                Alighting
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setShowAdd(false); setEditStop(null); }}
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-white">Cancel</button>
            <button
              disabled={addMut.isLoading || updateMut.isLoading}
              onClick={editStop ? handleUpdate : handleAdd}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {(addMut.isLoading || updateMut.isLoading) ? "Saving…" : editStop ? "Update Stop" : "Add Stop"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════ VIA POINTS TAB */
function ViaPointsTab({ routeId }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    sequence:"", name:"", latitude:"", longitude:"",
    distanceFromOriginKm:"", isHighRiskSegment:false, altitudeM:""
  });

  const { data, isLoading } = useQuery(["via-points", routeId], () => getViaPoints(routeId));
  const points = data?.data?.data ?? [];

  const addMut = useMutation((payload) => addViaPoint(routeId, payload), {
    onSuccess: () => { toast.success("Via point added"); qc.invalidateQueries(["via-points", routeId]); setShowAdd(false); },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Failed"),
  });

  const removeMut = useMutation(removeViaPoint, {
    onSuccess: () => { toast.success("Via point removed"); qc.invalidateQueries(["via-points", routeId]); },
    onError: () => toast.error("Failed to remove via point"),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">Via Points ({points.length})</h3>
        <button onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5">
          <Plus size={14} /> Add Via Point
        </button>
      </div>

      {isLoading ? <p className="text-center text-gray-400 py-4">Loading…</p> : points.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No via points added yet.</p>
      ) : (
        <div className="space-y-2">
          {points.map(vp => (
            <div key={vp.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{vp.sequence}</span>
                <div>
                  <p className="text-sm font-medium">{vp.name ?? "Unnamed"}</p>
                  <p className="text-xs text-gray-400">{vp.latitude}, {vp.longitude}{vp.altitudeM ? ` · ${vp.altitudeM}m` : ""}{vp.distanceFromOriginKm ? ` · ${vp.distanceFromOriginKm}km` : ""}</p>
                </div>
                {vp.isHighRiskSegment && (
                  <Badge color="orange"><AlertTriangle size={10} /> High Risk</Badge>
                )}
              </div>
              <button onClick={() => { if (window.confirm("Remove this via point?")) removeMut.mutate(vp.id); }}
                className="p-1.5 hover:bg-red-100 text-red-500 rounded"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="mt-4 border border-blue-100 rounded-xl p-4 bg-blue-50">
          <h4 className="font-medium text-sm text-blue-800 mb-3">Add Via Point</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500">Sequence *</label>
              <input className={inputCls} type="number" min="1" value={form.sequence}
                onChange={e => setForm(p => ({...p, sequence: e.target.value}))} /></div>
            <div><label className="text-xs text-gray-500">Name</label>
              <input className={inputCls} maxLength={100} value={form.name}
                onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
            <div><label className="text-xs text-gray-500">Latitude *</label>
              <input className={inputCls} type="number" step="0.000001" value={form.latitude}
                onChange={e => setForm(p => ({...p, latitude: e.target.value}))} /></div>
            <div><label className="text-xs text-gray-500">Longitude *</label>
              <input className={inputCls} type="number" step="0.000001" value={form.longitude}
                onChange={e => setForm(p => ({...p, longitude: e.target.value}))} /></div>
            <div><label className="text-xs text-gray-500">Distance from Origin (km)</label>
              <input className={inputCls} type="number" step="0.01" value={form.distanceFromOriginKm}
                onChange={e => setForm(p => ({...p, distanceFromOriginKm: e.target.value}))} /></div>
            <div><label className="text-xs text-gray-500">Altitude (m)</label>
              <input className={inputCls} type="number" value={form.altitudeM}
                onChange={e => setForm(p => ({...p, altitudeM: e.target.value}))} /></div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" checked={form.isHighRiskSegment} className="accent-red-500"
                onChange={e => setForm(p => ({...p, isHighRiskSegment: e.target.checked}))} />
              <label className="text-xs text-red-600 font-medium">High Risk Segment</label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-white">Cancel</button>
            <button disabled={addMut.isLoading}
              onClick={() => addMut.mutate({
                sequence:             Number(form.sequence),
                name:                 form.name || undefined,
                latitude:             parseFloat(form.latitude),
                longitude:            parseFloat(form.longitude),
                distanceFromOriginKm: form.distanceFromOriginKm ? parseFloat(form.distanceFromOriginKm) : undefined,
                isHighRiskSegment:    form.isHighRiskSegment,
                altitudeM:            form.altitudeM ? parseInt(form.altitudeM) : undefined,
              })}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {addMut.isLoading ? "Adding…" : "Add Via Point"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ MAIN DETAIL PAGE */
export default function RouteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");

  const { data, isLoading } = useQuery(["route-detail", id], () => getRouteDetail(id), { enabled: !!id });
  const detail = data?.data?.data ?? data?.data ?? null;
  const route  = detail?.route ?? null;

  const fmtDuration = (mins) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading route details…</div>;
  if (!route)    return <div className="p-8 text-center text-red-400">Route not found.</div>;

  const statusColor = route.status === "ACTIVE" ? "green" : route.status === "SUSPENDED" ? "red" : "gray";

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/routes")} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-700 text-lg">{route.routeNumber}</span>
              <Badge color={statusColor}>
                {route.status === "ACTIVE" ? <CheckCircle size={11} /> : <Ban size={11} />}
                {route.status}
              </Badge>
              {route.isInterstate && <Badge color="orange">Interstate</Badge>}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{route.name}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/admin/routes/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 shadow-sm">
          <Pencil size={14} /> Edit Route
        </button>
      </div>

      {/* Route summary strip */}
      <div className="bg-white rounded-xl shadow border border-blue-100 p-5 mb-5 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <MapPin size={16} /> {route.originStationName}
        </div>
        <div className="flex-1 border-t-2 border-dashed border-gray-200 min-w-[40px]" />
        <div className="text-xs text-center text-gray-400">
          <p>{route.totalDistanceKm} km</p>
          <p>{fmtDuration(route.estimatedDurationMin)}</p>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-gray-200 min-w-[40px]" />
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Navigation size={16} /> {route.destinationStationName}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 mb-5 bg-white rounded-xl shadow p-1 border border-gray-100 w-fit">
        {[
          { key: "info",   label: "Info",       icon: <Info size={14} /> },
          { key: "stops",  label: "Stops",      icon: <MapPin size={14} /> },
          { key: "via",    label: "Via Points",  icon: <Navigation size={14} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow border border-blue-100 p-6">

        {/* INFO TAB */}
        {tab === "info" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <InfoRow label="Route Number"    value={route.routeNumber} />
            <InfoRow label="Route Name"      value={route.name} />
            <InfoRow label="Type"            value={route.routeType?.replace("_"," ")} />
            <InfoRow label="Origin"          value={route.originStationName} />
            <InfoRow label="Destination"     value={route.destinationStationName} />
            <InfoRow label="Operating Depot" value={route.operatingDepotName} />
            <InfoRow label="Distance"        value={route.totalDistanceKm ? `${route.totalDistanceKm} km` : null} />
            <InfoRow label="Duration"        value={fmtDuration(route.estimatedDurationMin)} />
            <InfoRow label="Permit Number"   value={route.permitNumber} />
            <InfoRow label="Permit Valid Until" value={route.permitValidUntil ? format(new Date(route.permitValidUntil), "dd MMM yyyy") : null} />
            <InfoRow label="Via Description" value={route.viaDescription} />
            <InfoRow label="Interstate"      value={route.isInterstate ? "Yes" : "No"} />
            {route.status !== "ACTIVE" && route.suspensionReason && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-gray-400 mb-1">Suspension Reason</p>
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{route.suspensionReason}</p>
              </div>
            )}
            <InfoRow label="Created At" value={route.createdAt ? format(new Date(route.createdAt), "dd MMM yyyy, hh:mm a") : null} />
            <InfoRow label="Updated At" value={route.updatedAt ? format(new Date(route.updatedAt), "dd MMM yyyy, hh:mm a") : null} />
          </div>
        )}

        {tab === "stops" && <StopsTab routeId={Number(id)} />}
        {tab === "via"   && <ViaPointsTab routeId={Number(id)} />}
      </div>
    </div>
  );
}