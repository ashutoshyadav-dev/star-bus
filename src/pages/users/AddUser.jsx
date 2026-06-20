import React, { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AddUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    employeeCode: "",
    employeeId: "",
    name: "",
    role: "",
    designation: "",
    dob: "",
    doj: "",
    employeeType: "",
    dutyStatus: "On Duty",
    mobile: "",
    email: "",
    password: "",
    bankAccount: "",
    emergencyContact: "",
    relation: "",
    license: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  
  const inputStyle =
    "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500";

  const selectStyle =
    "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Add New User</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage system users
          </p>
        </div>

        <button
          onClick={() => navigate("/usermanagement")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-800 transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Form (NO CARD STYLE) */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">

          <input className={inputStyle} name="employeeCode" placeholder="Employee Code" onChange={handleChange} />
          <input className={inputStyle} name="employeeId" placeholder="Employee ID" onChange={handleChange} />
          <input className={inputStyle} name="name" placeholder="Full Name" onChange={handleChange} />

          <select className={selectStyle} name="role" onChange={handleChange}>
            <option value="">Select Role</option>
            <option>Customer</option>
            <option>Operator</option>
            <option>Admin</option>
          </select>

          <input className={inputStyle} name="designation" placeholder="Designation" onChange={handleChange} />

          <input className={inputStyle} type="date" name="dob" onChange={handleChange} />
          <input className={inputStyle} type="date" name="doj" onChange={handleChange} />

          <select className={selectStyle} name="employeeType" onChange={handleChange}>
            <option value="">Employee Type</option>
            <option>Driver</option>
            <option>Operator</option>
            <option>Staff</option>
          </select>

          <select className={selectStyle} name="dutyStatus" onChange={handleChange}>
            <option>On Duty</option>
            <option>Off Duty</option>
          </select>

          <input className={inputStyle} name="mobile" placeholder="Mobile Number" onChange={handleChange} />
          <input className={inputStyle} name="email" placeholder="Email Address" onChange={handleChange} />
          <input className={inputStyle} type="password" name="password" placeholder="Password" onChange={handleChange} />

          <input className={inputStyle} name="bankAccount" placeholder="Bank Account Number" onChange={handleChange} />
          <input className={inputStyle} name="emergencyContact" placeholder="Emergency Contact" onChange={handleChange} />
          <input className={inputStyle} name="relation" placeholder="Relation" onChange={handleChange} />

          {form.employeeType === "Driver" && (
            <input className={inputStyle} name="license" placeholder="License Number" onChange={handleChange} />
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-10">
          <button
            onClick={() => navigate("/app/usermanagement")}
            className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-800 transition"
          >
            Cancel
          </button>

          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-md">
            <Save size={18} />
            Save User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;