import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBusById,
  getSeatsByBus,
  getMaintenanceByBus,
  deactivateSeat,
  completeMaintenance,
} from "../../api/bus";
import BusSeatsTab from "./BusSeatsTab";
import BusMaintenanceTab from "./BusMaintenanceTab";

const TABS = ["Overview", "Seats", "Maintenance"];

export default function BusDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bus, setBus] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusById(id)
      .then(({ data }) => setBus(data))
      .catch(() => alert("Bus not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!bus) return null;

  const statusColor = {
    active: "bg-green-100 text-green-700",
    in_maintenance: "bg-yellow-100 text-yellow-700",
    breakdown: "bg-red-100 text-red-600",
    retired: "bg-gray-100 text-gray-500",
    condemned: "bg-gray-200 text-gray-400",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/buses")} className="text-gray-400 hover:text-gray-700 transition-colors">
            ← Back
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 font-mono">{bus.registrationNumber}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[bus.status] ?? ""}`}>
                {bus.status?.replace("_", " ")}
              </span>
              {!bus.isActive && <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-xs font-semibold">Inactive</span>}
            </div>
            <p className="text-sm text-gray-500">{[bus.make, bus.model, bus.manufacturingYear].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/admin/buses/${id}/edit`)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && <BusOverview bus={bus} />}
      {activeTab === "Seats" && <BusSeatsTab busId={Number(id)} />}
      {activeTab === "Maintenance" && <BusMaintenanceTab busId={Number(id)} />}
    </div>
  );
}

function BusOverview({ bus }) {
  const fields = [
    ["Bus Type", bus.busTypeName],
    ["Bus Type Code", bus.busTypeCode],
    ["Home Depot", bus.homeDepotName],
    ["Chassis No.", bus.chassisNumber],
    ["Engine No.", bus.engineNumber],
    ["Seating Capacity", bus.seatingCapacity],
    ["Standing Capacity", bus.standingCapacity],
    ["Fuel Type", bus.fuelType],
    ["Odometer (km)", bus.odometerKm],
    ["Fitness Cert. No.", bus.fitnessCertificateNumber],
    ["Fitness Valid Until", bus.fitnessValidUntil],
    ["Insurance Policy No.", bus.insurancePolicyNumber],
    ["Insurance Valid Until", bus.insuranceValidUntil],
    ["Permit No.", bus.permitNumber],
    ["Permit Valid Until", bus.permitValidUntil],
    ["GPS Device ID", bus.gpsDeviceId],
    ["Created At", bus.createdAt ? new Date(bus.createdAt).toLocaleString() : "—"],
    ["Updated At", bus.updatedAt ? new Date(bus.updatedAt).toLocaleString() : "—"],
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div className="divide-y divide-gray-100">
          {fields.slice(0, Math.ceil(fields.length / 2)).map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {fields.slice(Math.ceil(fields.length / 2)).map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex px-5 py-3 gap-4">
      <span className="text-xs font-semibold text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value ?? "—"}</span>
    </div>
  );
}
