import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getBusById, createBus, updateBus, getAllBusTypes } from "../../api/bus";

const FUEL_TYPES = ["diesel", "cng", "electric", "hybrid"];
const BUS_STATUSES = ["active", "in_maintenance", "breakdown", "retired", "condemned"];

const empty = {
  registrationNumber: "", busTypeId: "", homeDepotId: "",
  make: "", model: "", manufacturingYear: "",
  chassisNumber: "", engineNumber: "",
  seatingCapacity: "", standingCapacity: "0",
  fuelType: "diesel",
  fitnessCertificateNumber: "", fitnessValidUntil: "",
  insurancePolicyNumber: "",   insuranceValidUntil: "",
  permitNumber: "",            permitValidUntil: "",
  odometerKm: "0", status: "active", isActive: true, gpsDeviceId: "",
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

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
        .then(({ data }) => setForm({
          registrationNumber: data.registrationNumber ?? "",
          busTypeId:          data.busTypeId          ?? "",
          homeDepotId:        data.homeDepotId        ?? "",
          make:               data.make               ?? "",
          model:              data.model              ?? "",
          manufacturingYear:  data.manufacturingYear  ?? "",
          chassisNumber:      data.chassisNumber      ?? "",
          engineNumber:       data.engineNumber       ?? "",
          seatingCapacity:    data.seatingCapacity    ?? "",
          standingCapacity:   data.standingCapacity   ?? "0",
          fuelType:           data.fuelType           ?? "diesel",
          fitnessCertificateNumber: data.fitnessCertificateNumber ?? "",
          fitnessValidUntil:        data.fitnessValidUntil        ?? "",
          insurancePolicyNumber:    data.insurancePolicyNumber    ?? "",
          insuranceValidUntil:      data.insuranceValidUntil      ?? "",
          permitNumber:             data.permitNumber             ?? "",
          permitValidUntil:         data.permitValidUntil         ?? "",
          odometerKm:  data.odometerKm  ?? "0",
          status:      data.status      ?? "active",
          isActive:    data.isActive    ?? true,
          gpsDeviceId: data.gpsDeviceId ?? "",
        }))
        .catch(() => toast.error("Failed to load bus data."))
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
        busTypeId:         Number(form.busTypeId),
        homeDepotId:       Number(form.homeDepotId),
        manufacturingYear: form.manufacturingYear ? Number(form.manufacturingYear) : undefined,
        seatingCapacity:   Number(form.seatingCapacity),
        standingCapacity:  Number(form.standingCapacity),
        odometerKm:        Number(form.odometerKm),
        fitnessValidUntil: form.fitnessValidUntil  || undefined,
        insuranceValidUntil: form.insuranceValidUntil || undefined,
        permitValidUntil:  form.permitValidUntil   || undefined,
      };
      if (isEdit) {
        await updateBus(id, payload);
        toast.success("Bus updated successfully.");
      } else {
        await createBus(payload);
        toast.success("Bus registered successfully.");
      }
      navigate("/admin/buses");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Save failed. Check all required fields.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading bus data…</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Bus" : "Register New Bus"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? `Editing bus #${id}` : "Add a new vehicle to the fleet"}</p>
        </div>
        <button onClick={() => navigate("/admin/buses")} className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          ← Back
        </button>
      </div>

      <div className="space-y-5">
        <Section title="Basic Information" icon="🪪">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Registration Number" required>
              <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Bus Type" required>
              <select name="busTypeId" value={form.busTypeId} onChange={handleChange} className={inputCls}>
                <option value="">Select bus type</option>
                {busTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name} ({bt.code})</option>)}
              </select>
            </Field>
            <Field label="Home Depot ID" required>
              <input name="homeDepotId" type="number" value={form.homeDepotId} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Make">
              <input name="make" value={form.make} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Model">
              <input name="model" value={form.model} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Manufacturing Year">
              <input name="manufacturingYear" type="number" value={form.manufacturingYear} onChange={handleChange} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Technical Details" icon="⚙️">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Chassis Number">
              <input name="chassisNumber" value={form.chassisNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Engine Number">
              <input name="engineNumber" value={form.engineNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Seating Capacity" required>
              <input name="seatingCapacity" type="number" value={form.seatingCapacity} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Standing Capacity">
              <input name="standingCapacity" type="number" value={form.standingCapacity} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Fuel Type">
              <select name="fuelType" value={form.fuelType} onChange={handleChange} className={inputCls}>
                {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Odometer (km)">
              <input name="odometerKm" type="number" value={form.odometerKm} onChange={handleChange} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Compliance & Documents" icon="📋">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fitness Certificate No.">
              <input name="fitnessCertificateNumber" value={form.fitnessCertificateNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Fitness Valid Until">
              <input name="fitnessValidUntil" type="date" value={form.fitnessValidUntil} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Insurance Policy No.">
              <input name="insurancePolicyNumber" value={form.insurancePolicyNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Insurance Valid Until">
              <input name="insuranceValidUntil" type="date" value={form.insuranceValidUntil} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Permit Number">
              <input name="permitNumber" value={form.permitNumber} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Permit Valid Until">
              <input name="permitValidUntil" type="date" value={form.permitValidUntil} onChange={handleChange} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Status & GPS" icon="🛰️">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                {BUS_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="GPS Device ID">
              <input name="gpsDeviceId" value={form.gpsDeviceId} onChange={handleChange} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <label className={`inline-flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-xl border transition-all ${form.isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="sr-only" />
                <span className="text-base">{form.isActive ? "✅" : "⬜"}</span>
                <span className="text-sm font-medium">Bus is Active</span>
              </label>
            </div>
          </div>
        </Section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={() => navigate("/admin/buses")} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-sm">
            {saving ? "Saving…" : isEdit ? "Update Bus" : "Register Bus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
