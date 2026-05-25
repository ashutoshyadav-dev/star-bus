import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBusById } from "../../api/bus";
import BusSeatsTab from "./BusSeatsTab";
import BusMaintenanceTab from "./BusMaintenanceTab";

const TABS = ["Overview", "Seats", "Maintenance"];

const STATUS_CONFIG = {
  active:         { color: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  in_maintenance: { color: "bg-amber-100 text-amber-700 ring-amber-200",       dot: "bg-amber-500"   },
  breakdown:      { color: "bg-red-100 text-red-600 ring-red-200",             dot: "bg-red-500"     },
  retired:        { color: "bg-gray-100 text-gray-500 ring-gray-200",          dot: "bg-gray-400"    },
  condemned:      { color: "bg-zinc-100 text-zinc-500 ring-zinc-200",          dot: "bg-zinc-400"    },
};

export default function BusDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusById(id)
      .then(({ data }) => setBus(data))
      .catch(() => navigate("/admin/buses"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading bus details…</span>
      </div>
    </div>
  );
  if (!bus) return null;

  const sc = STATUS_CONFIG[bus.status] ?? STATUS_CONFIG.condemned;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0 border border-blue-100 select-none">
              🚌
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900 font-mono tracking-wide">{bus.registrationNumber}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 capitalize ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {bus.status?.replace(/_/g, " ")}
                </span>
                {!bus.isActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 ring-1 ring-red-200">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {[bus.busTypeName, bus.make, bus.model, bus.manufacturingYear].filter(Boolean).join(" · ")}
              </p>
              {bus.homeDepotName && (
                <p className="text-xs text-gray-400 mt-0.5">📍 {bus.homeDepotName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/admin/buses")}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate(`/admin/buses/${id}/edit`)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Seating",   value: bus.seatingCapacity  ? `${bus.seatingCapacity} seats`    : "—" },
            { label: "Standing",  value: bus.standingCapacity ? `${bus.standingCapacity} standing` : "—" },
            { label: "Fuel",      value: bus.fuelType ?? "—" },
            { label: "Odometer",  value: bus.odometerKm != null ? `${Number(bus.odometerKm).toLocaleString()} km` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview"    && <BusOverview bus={bus} />}
      {activeTab === "Seats"       && <BusSeatsTab busId={Number(id)} />}
      {activeTab === "Maintenance" && <BusMaintenanceTab busId={Number(id)} />}
    </div>
  );
}

function BusOverview({ bus }) {
  const sections = [
    {
      title: "Identity & Type", icon: "🪪",
      fields: [
        ["Bus Type",          bus.busTypeName],
        ["Bus Type Code",     bus.busTypeCode],
        ["Home Depot",        bus.homeDepotName],
        ["Make",              bus.make],
        ["Model",             bus.model],
        ["Year",              bus.manufacturingYear],
      ],
    },
    {
      title: "Technical", icon: "⚙️",
      fields: [
        ["Chassis No.",       bus.chassisNumber],
        ["Engine No.",        bus.engineNumber],
        ["Seating Capacity",  bus.seatingCapacity],
        ["Standing Capacity", bus.standingCapacity],
        ["Fuel Type",         bus.fuelType],
        ["Odometer (km)",     bus.odometerKm != null ? Number(bus.odometerKm).toLocaleString() : null],
      ],
    },
    {
      title: "Compliance & Documents", icon: "📋",
      fields: [
        ["Fitness Cert. No.",     bus.fitnessCertificateNumber],
        ["Fitness Valid Until",   bus.fitnessValidUntil],
        ["Insurance Policy No.",  bus.insurancePolicyNumber],
        ["Insurance Valid Until", bus.insuranceValidUntil],
        ["Permit No.",            bus.permitNumber],
        ["Permit Valid Until",    bus.permitValidUntil],
      ],
    },
    {
      title: "System", icon: "🛰️",
      fields: [
        ["GPS Device ID", bus.gpsDeviceId],
        ["Created At",    bus.createdAt ? new Date(bus.createdAt).toLocaleString() : null],
        ["Updated At",    bus.updatedAt ? new Date(bus.updatedAt).toLocaleString() : null],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ title, icon, fields }) => (
        <div key={title} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {fields.map(([label, value], i) => (
              <div
                key={label}
                className={`flex items-start px-5 py-3 gap-3 ${
                  i < fields.length - (fields.length % 2 === 0 ? 2 : 1) ? "border-b border-gray-50" : ""
                } ${i % 2 === 1 ? "sm:border-l sm:border-gray-100" : ""}`}
              >
                <span className="text-xs font-semibold text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-800 capitalize">{value ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
