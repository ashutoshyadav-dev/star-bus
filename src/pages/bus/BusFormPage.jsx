import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBusById, createBus, updateBus } from "../../api/bus";
import { getAllBusTypes } from "../../api/bus";

const FUEL_TYPES = ["diesel", "petrol", "cng", "electric", "hybrid"];
const BUS_STATUSES = ["active", "in_maintenance", "breakdown", "retired", "condemned"];

const empty = {
  registrationNumber: "",
  busTypeId: "",
  homeDepotId: "",
  make: "",
  model: "",
  manufacturingYear: "",
  chassisNumber: "",
  engineNumber: "",
  seatingCapacity: "",
  standingCapacity: "0",
  fuelType: "diesel",
  fitnessCertificateNumber: "",
  fitnessValidUntil: "",
  insurancePolicyNumber: "",
  insuranceValidUntil: "",
  permitNumber: "",
  permitValidUntil: "",
  odometerKm: "0",
  status: "active",
  isActive: true,
  gpsDeviceId: "",
};

export default function BusFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [busTypes, setBusTypes] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllBusTypes(false).then(({ data }) => setBusTypes(data)).catch(() => {});
    if (isEdit) {
      getBusById(id)
        .then(({ data }) => {
          setForm({
            registrationNumber: data.registrationNumber ?? "",
            busTypeId: data.busTypeId ?? "",
            homeDepotId: data.homeDepotId ?? "",
            make: data.make ?? "",
            model: data.model ?? "",
            manufacturingYear: data.manufacturingYear ?? "",
            chassisNumber: data.chassisNumber ?? "",
            engineNumber: data.engineNumber ?? "",
            seatingCapacity: data.seatingCapacity ?? "",
            standingCapacity: data.standingCapacity ?? "0",
            fuelType: data.fuelType ?? "diesel",
            fitnessCertificateNumber: data.fitnessCertificateNumber ?? "",
            fitnessValidUntil: data.fitnessValidUntil ?? "",
            insurancePolicyNumber: data.insurancePolicyNumber ?? "",
            insuranceValidUntil: data.insuranceValidUntil ?? "",
            permitNumber: data.permitNumber ?? "",
            permitValidUntil: data.permitValidUntil ?? "",
            odometerKm: data.odometerKm ?? "0",
            status: data.status ?? "active",
            isActive: data.isActive ?? true,
            gpsDeviceId: data.gpsDeviceId ?? "",
          });
        })
        .catch(() => setError("Failed to load bus data."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        busTypeId: Number(form.busTypeId),
        homeDepotId: Number(form.homeDepotId),
        manufacturingYear: form.manufacturingYear ? Number(form.manufacturingYear) : undefined,
        seatingCapacity: Number(form.seatingCapacity),
        standingCapacity: Number(form.standingCapacity),
        odometerKm: Number(form.odometerKm),
        fitnessValidUntil: form.fitnessValidUntil || undefined,
        insuranceValidUntil: form.insuranceValidUntil || undefined,
        permitValidUntil: form.permitValidUntil || undefined,
      };
      if (isEdit) {
        await updateBus(id, payload);
      } else {
        await createBus(payload);
      }
      navigate("/admin/buses");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Save failed. Check all required fields.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading bus data…</div>;

  const Field = ({ label, name, type = "text", required, children, className = "" }) => (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && " *"}</label>
      {children ?? (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin/buses")} className="text-gray-400 hover:text-gray-700 transition-colors">
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "Edit Bus" : "Register New Bus"}</h1>
          <p className="text-sm text-gray-500">{isEdit ? `Editing bus #${id}` : "Add a new vehicle to the fleet"}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section: Basic Info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Registration Number" name="registrationNumber" required />
            <Field label="Bus Type" name="busTypeId" required>
              <select name="busTypeId" value={form.busTypeId} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select bus type</option>
                {busTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name} ({bt.code})</option>)}
              </select>
            </Field>
            <Field label="Home Depot ID" name="homeDepotId" type="number" required />
            <Field label="Make" name="make" />
            <Field label="Model" name="model" />
            <Field label="Manufacturing Year" name="manufacturingYear" type="number" />
          </div>
        </Section>

        {/* Section: Technical */}
        <Section title="Technical Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Chassis Number" name="chassisNumber" />
            <Field label="Engine Number" name="engineNumber" />
            <Field label="Seating Capacity" name="seatingCapacity" type="number" required />
            <Field label="Standing Capacity" name="standingCapacity" type="number" />
            <Field label="Fuel Type" name="fuelType">
              <select name="fuelType" value={form.fuelType} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Odometer (km)" name="odometerKm" type="number" />
          </div>
        </Section>

        {/* Section: Compliance */}
        <Section title="Compliance & Documents">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fitness Certificate No." name="fitnessCertificateNumber" />
            <Field label="Fitness Valid Until" name="fitnessValidUntil" type="date" />
            <Field label="Insurance Policy No." name="insurancePolicyNumber" />
            <Field label="Insurance Valid Until" name="insuranceValidUntil" type="date" />
            <Field label="Permit Number" name="permitNumber" />
            <Field label="Permit Valid Until" name="permitValidUntil" type="date" />
          </div>
        </Section>

        {/* Section: Status & GPS */}
        <Section title="Status & GPS">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status" name="status">
              <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="GPS Device ID" name="gpsDeviceId" />
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange} className="rounded accent-blue-600" />
              <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Active</label>
            </div>
          </div>
        </Section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => navigate("/admin/buses")} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Update Bus" : "Register Bus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
