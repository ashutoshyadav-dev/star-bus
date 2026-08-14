import React, { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { depotApi } from "../../api/depot"; 

const DepotForm = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Depot | APSTS Admin Portal";
  }, []);

  const [form, setForm] = useState({
    code: "",
    name: "",
    district: "",
    state: "Arunachal Pradesh",
    depotType: "",
    addressLine1: "",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.code || !form.name || !form.depotType) {
        toast.error("Please fill required fields");
        return;
      }

      setLoading(true);

      await depotApi.createDepot(form); 

      toast.success("Depot created successfully 🚀");

      setForm({
        code: "",
        name: "",
        district: "",
        state: "Arunachal Pradesh",
        depotType: "",
        addressLine1: "",
        latitude: "",
        longitude: "",
        phone: "",
        email: "",
      });

      // setTimeout(() => navigate("/app"), 1000);

    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to create depot"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";

  const selectStyle =
    "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Add Depot</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage depot details
          </p>
        </div>

        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-800"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">

          <input className={inputStyle} name="code" placeholder="Depot Code" value={form.code} onChange={handleChange} />

          <input className={inputStyle} name="name" placeholder="Depot Name" value={form.name} onChange={handleChange} />

          <input className={inputStyle} name="district" placeholder="District" value={form.district} onChange={handleChange} />

         
          <select className={selectStyle} name="state" value={form.state} onChange={handleChange}>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
          </select>

          
          <select className={selectStyle} name="depotType" value={form.depotType} onChange={handleChange}>
            <option value="">Select Depot Type</option>
            <option value="main_depot">Main Depot</option>
            <option value="sub_station">Sub Station</option>
            <option value="terminal">Terminal</option>
            <option value="interstate_terminal">Interstate Terminal</option>
          </select>

          <input
            className={`${inputStyle} md:col-span-2`}
            name="addressLine1"
            placeholder="Address Line"
            value={form.addressLine1}
            onChange={handleChange}
          />

          <input className={inputStyle} name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} />

          <input className={inputStyle} name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} />

          <input className={inputStyle} name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />

          <input className={inputStyle} name="email" placeholder="Email Address" value={form.email} onChange={handleChange} />

        </div>

        
        <div className="flex justify-end gap-4 mt-10">
          <button
            onClick={() => navigate("/app")}
            className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-800"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Depot"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepotForm;