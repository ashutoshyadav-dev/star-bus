import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { createRoute } from "../../api/route";
import { stationApi } from "../../api/station";
import { depotApi } from "../../api/depot";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const ROUTE_TYPES = ["ordinary","semi_deluxe","deluxe","express","volvo_ac","xylo","sumo"];

const EMPTY = {
  routeNumber:"", name:"", originStationId:"", destinationStationId:"",
  operatingDepotId:"", routeType:"", isInterstate: false, interstateStates:"",
  totalDistanceKm:"", estimatedDurationMin:"", permitNumber:"",
  permitValidUntil:"", viaDescription:"",
};

const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white w-full";

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function AddRoute() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const { data: stData, isLoading: stLoading } = useQuery(["stations-active"], stationApi.getActiveStations);
  const stations = stData?.data?.data ?? stData?.data ?? [];

  const { data: dpData, isLoading: dpLoading } = useQuery(["depots-active"], depotApi.getActiveDepots);
  const depots = dpData?.data?.data ?? dpData?.data ?? [];

  const createMut = useMutation(createRoute, {
    onSuccess: () => { toast.success("Route created"); navigate("/admin/routes"); },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to create route"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (String(form.originStationId) === String(form.destinationStationId)) {
      toast.error("Origin and destination cannot be the same"); return;
    }
    createMut.mutate({
      routeNumber:          form.routeNumber.toUpperCase(),
      name:                 form.name,
      originStationId:      Number(form.originStationId),
      destinationStationId: Number(form.destinationStationId),
      operatingDepotId:     Number(form.operatingDepotId),
      routeType:            form.routeType,
      isInterstate:         form.isInterstate,
      interstateStates:     form.isInterstate ? form.interstateStates || null : null,
      totalDistanceKm:      parseFloat(form.totalDistanceKm),
      estimatedDurationMin: parseInt(form.estimatedDurationMin, 10),
      permitNumber:         form.permitNumber     || null,
      permitValidUntil:     form.permitValidUntil || null,
      viaDescription:       form.viaDescription   || null,
    });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white rounded-xl shadow border border-blue-100 p-6 max-w-4xl mx-auto">

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <button onClick={() => navigate("/admin/routes")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-xl font-semibold">Add New Route</h2>
            <p className="text-xs text-gray-400">All fields marked * are required by the backend</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Basic Information">
            <Field label="Route Number" required>
              <input className={inputCls} placeholder="e.g. RT-001" maxLength={20}
                value={form.routeNumber} onChange={e => set("routeNumber", e.target.value)} required />
            </Field>
            <Field label="Route Name" required>
              <input className={inputCls} placeholder="e.g. Itanagar – Naharlagun Express" maxLength={200}
                value={form.name} onChange={e => set("name", e.target.value)} required />
            </Field>
            <Field label="Route Type" required>
              <select className={inputCls} value={form.routeType} onChange={e => set("routeType", e.target.value)} required>
                <option value="">Select type</option>
                {ROUTE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </Field>
            <Field label="Operating Depot" required>
              {dpLoading
                ? <div className={`${inputCls} text-gray-400`}>Loading depots…</div>
                : <select className={inputCls} value={form.operatingDepotId}
                    onChange={e => set("operatingDepotId", e.target.value)} required>
                    <option value="">Select depot</option>
                    {depots.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                  </select>
              }
            </Field>
          </Section>

          <Section title="Route Stations">
            <Field label="Origin Station" required>
              {stLoading
                ? <div className={`${inputCls} text-gray-400`}>Loading stations…</div>
                : <select className={inputCls} value={form.originStationId}
                    onChange={e => set("originStationId", e.target.value)} required>
                    <option value="">Select origin</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
              }
            </Field>
            <Field label="Destination Station" required>
              {stLoading
                ? <div className={`${inputCls} text-gray-400`}>Loading stations…</div>
                : <select className={inputCls} value={form.destinationStationId}
                    onChange={e => set("destinationStationId", e.target.value)} required>
                    <option value="">Select destination</option>
                    {stations
                      .filter(s => String(s.id) !== String(form.originStationId))
                      .map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
              }
            </Field>
            <div className="md:col-span-2">
              <Field label="Via Description (optional)">
                <input className={inputCls} maxLength={500} placeholder="e.g. via Banderdewa, Nirjuli"
                  value={form.viaDescription} onChange={e => set("viaDescription", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Distance & Duration">
            <Field label="Total Distance (km)" required>
              <input className={inputCls} type="number" step="0.01" min="0.01" placeholder="e.g. 45.5"
                value={form.totalDistanceKm} onChange={e => set("totalDistanceKm", e.target.value)} required />
            </Field>
            <Field label="Estimated Duration (minutes)" required>
              <input className={inputCls} type="number" min="1" placeholder="e.g. 90"
                value={form.estimatedDurationMin} onChange={e => set("estimatedDurationMin", e.target.value)} required />
            </Field>
          </Section>

          <Section title="Permit Details">
            <Field label="Permit Number (optional)">
              <input className={inputCls} maxLength={50} placeholder="e.g. APST/2024/001"
                value={form.permitNumber} onChange={e => set("permitNumber", e.target.value)} />
            </Field>
            <Field label="Permit Valid Until (optional)">
              <input className={inputCls} type="date"
                value={form.permitValidUntil} onChange={e => set("permitValidUntil", e.target.value)} />
            </Field>
          </Section>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">Interstate</h3>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={form.isInterstate}
                onChange={e => set("isInterstate", e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-700">This is an interstate route</span>
            </label>
            {form.isInterstate && (
              <Field label="Interstate States">
                <input className={inputCls} placeholder="e.g. Arunachal Pradesh, Assam"
                  value={form.interstateStates} onChange={e => set("interstateStates", e.target.value)} />
              </Field>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate("/admin/routes")}
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createMut.isLoading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm hover:bg-blue-700 disabled:opacity-50">
              {createMut.isLoading ? "Creating…" : "Create Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}