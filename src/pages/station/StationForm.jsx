import React, { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stationApi } from "../../api/station";
import { depotApi } from "../../api/depot";
import toast from "react-hot-toast";

const StationForm = () => {
  const navigate = useNavigate();

  const [depots, setDepots] = useState([]);

  const [form, setForm] = useState({
    code: "",
    name: "",
    nameLocal: "",
    depotId: "",
    district: "",
    state: "Arunachal Pradesh",
    latitude: "",
    longitude: "",
    hasWaitingRoom: false,
    hasTicketCounter: false,
    landmark: "",
     isActive: true,
  });

  useEffect(() => {
    document.title = "Station | APSTS Admin Portal";
  }, []);

  // 🔹 Fetch depots
  useEffect(() => {
    const fetchDepots = async () => {
      try {
        const res = await depotApi.getAllDepots();
        setDepots(res.data.data);
      } catch (err) {
        console.error("Failed to load depots", err);
        toast.error("Failed to load depots");
      }
    };

    fetchDepots();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!form.code || !form.name || !form.district) {
        toast.error("Please fill required fields");
        return;
      }

      const payload = {
        code: form.code,
        name: form.name,
        nameLocal: form.nameLocal || null,
        depotId: form.depotId ? Number(form.depotId) : null,
        district: form.district,
        state: form.state,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        hasWaitingRoom: form.hasWaitingRoom,
        hasTicketCounter: form.hasTicketCounter,
        landmark: form.landmark || null,
      };

      await stationApi.createStation(payload);

      toast.success("Station created successfully 🚀");

      setForm({
        code: "",
        name: "",
        nameLocal: "",
        depotId: "",
        district: "",
        state: "Arunachal Pradesh",
        latitude: "",
        longitude: "",
        hasWaitingRoom: false,
        hasTicketCounter: false,
        landmark: "",
         isActive: form.isActive,
      });

      navigate("/app/stations");

    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to create station"
      );
    }
  };

  const inputStyle =
    "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Add Station</h1>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-6">

        <input className={inputStyle} name="code" placeholder="Station Code" value={form.code} onChange={handleChange} />
        <input className={inputStyle} name="name" placeholder="Station Name" value={form.name} onChange={handleChange} />

        <input className={inputStyle} name="nameLocal" placeholder="Local Name" value={form.nameLocal} onChange={handleChange} />

        {/* DEPOT */}
        <select
          className={inputStyle}
          name="depotId"
          value={form.depotId}
          onChange={handleChange}
        >
          <option value="">Select Depot</option>
          {depots.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <input className={inputStyle} name="district" placeholder="District" value={form.district} onChange={handleChange} />
        <input className={inputStyle} name="state" value={form.state} onChange={handleChange} />

        <input className={inputStyle} name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} />
        <input className={inputStyle} name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} />

        <input className={`${inputStyle} md:col-span-2`} name="landmark" placeholder="Landmark" value={form.landmark} onChange={handleChange} />

        {/* Checkboxes */}
        <label className="flex items-center gap-2">
          <input type="checkbox" name="hasWaitingRoom" checked={form.hasWaitingRoom} onChange={handleChange} />
          Waiting Room
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="hasTicketCounter" checked={form.hasTicketCounter} onChange={handleChange} />
          Ticket Counter
        </label>

        <label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="isActive"
    checked={form.isActive}
    onChange={handleChange}
  />
  Active
</label>

      </div>

      {/* Buttons */}
      <div className="flex justify-end mt-8 gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-300 rounded-xl"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          <Save size={18} />
          Save
        </button>
      </div>
    </div>
  );
};

export default StationForm;