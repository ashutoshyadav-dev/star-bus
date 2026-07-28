// import React, { useState } from "react";
// import { ArrowLeft, Save } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const AddUser = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     employeeCode: "",
//     employeeId: "",
//     name: "",
//     role: "",
//     designation: "",
//     dob: "",
//     doj: "",
//     employeeType: "",
//     dutyStatus: "On Duty",
//     mobile: "",
//     email: "",
//     password: "",
//     bankAccount: "",
//     emergencyContact: "",
//     relation: "",
//     license: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

  
//   const inputStyle =
//     "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500";

//   const selectStyle =
//     "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">

//       {/* Header */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-800">Add New User</h1>
//           <p className="text-gray-500 text-sm mt-1">
//             Create and manage system users
//           </p>
//         </div>

//         <button
//           onClick={() => navigate("/usermanagement")}
//           className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-800 transition"
//         >
//           <ArrowLeft size={18} />
//           Back
//         </button>
//       </div>

//       {/* Form (NO CARD STYLE) */}
//       <div className="max-w-6xl mx-auto">
//         <div className="grid md:grid-cols-2 gap-6">

//           <input className={inputStyle} name="employeeCode" placeholder="Employee Code" onChange={handleChange} />
//           <input className={inputStyle} name="employeeId" placeholder="Employee ID" onChange={handleChange} />
//           <input className={inputStyle} name="name" placeholder="Full Name" onChange={handleChange} />

//           <select className={selectStyle} name="role" onChange={handleChange}>
//             <option value="">Select Role</option>
//             <option>Customer</option>
//             <option>Operator</option>
//             <option>Admin</option>
//           </select>

//           <input className={inputStyle} name="designation" placeholder="Designation" onChange={handleChange} />

//           <input className={inputStyle} type="date" name="dob" onChange={handleChange} />
//           <input className={inputStyle} type="date" name="doj" onChange={handleChange} />

//           <select className={selectStyle} name="employeeType" onChange={handleChange}>
//             <option value="">Employee Type</option>
//             <option>Driver</option>
//             <option>Operator</option>
//             <option>Staff</option>
//           </select>

//           <select className={selectStyle} name="dutyStatus" onChange={handleChange}>
//             <option>On Duty</option>
//             <option>Off Duty</option>
//           </select>

//           <input className={inputStyle} name="mobile" placeholder="Mobile Number" onChange={handleChange} />
//           <input className={inputStyle} name="email" placeholder="Email Address" onChange={handleChange} />
//           <input className={inputStyle} type="password" name="password" placeholder="Password" onChange={handleChange} />

//           <input className={inputStyle} name="bankAccount" placeholder="Bank Account Number" onChange={handleChange} />
//           <input className={inputStyle} name="emergencyContact" placeholder="Emergency Contact" onChange={handleChange} />
//           <input className={inputStyle} name="relation" placeholder="Relation" onChange={handleChange} />

//           {form.employeeType === "Driver" && (
//             <input className={inputStyle} name="license" placeholder="License Number" onChange={handleChange} />
//           )}
//         </div>

//         {/* Buttons */}
//         <div className="flex justify-end gap-4 mt-10">
//           <button
//             onClick={() => navigate("/app/usermanagement")}
//             className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-800 transition"
//           >
//             Cancel
//           </button>

//           <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-md">
//             <Save size={18} />
//             Save User
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddUser;

























import React, { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { usersApi } from "../../api/users";
import { rolesApi } from "../../api/roles";
import Spinner from "../../components/common/Spinner";

// Matches backend Designation enum — verify against GET /admin/roles or
// your Designation.java enum if this list drifts
const DESIGNATIONS = ["conductor", "driver", "relief_driver", "guard", "depot_staff"];
const EMPLOYMENT_TYPES = ["permanent", "contract", "temporary"];

const AddUser = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    phoneNumber: "",
    email: "",
    password: "",
    fullName: "",
    employeeCode: "",
    designation: "",
    depotId: "",
    dateOfBirth: "",
    joiningDate: "",
    employmentType: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    roleId: "",
  });

  // Roles list is fetched live from the backend — do NOT hard-code
  // "Customer/Operator/Admin" like the old form did; those don't exist
  // as real Role rows.
  useEffect(() => {
    rolesApi.getAll()
      .then((res) => setRoles(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load roles"));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\+91[6-9]\d{9}$/.test(form.phoneNumber)) {
      toast.error("Phone must be in +91XXXXXXXXXX format, starting 6-9");
      return;
    }
    if (!form.password || form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!form.roleId) {
      toast.error("Select a role");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        depotId: form.depotId ? Number(form.depotId) : null,
        roleId: Number(form.roleId),
      };
      await usersApi.createStaff(payload);
      toast.success("Staff account created");
      navigate("/admin/usermanagement");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to create staff account");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle =
    "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500";
  const selectStyle =
    "w-full bg-white text-black border border-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Add New Staff</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create a conductor, driver, or other staff account
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/usermanagement")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-800 transition text-white"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <input className={inputStyle} name="phoneNumber" placeholder="+91XXXXXXXXXX"
                 value={form.phoneNumber} onChange={handleChange} required />
          <input className={inputStyle} name="email" type="email" placeholder="Email Address"
                 value={form.email} onChange={handleChange} />
          <input className={inputStyle} name="password" type="password" placeholder="Password"
                 value={form.password} onChange={handleChange} required />
          <input className={inputStyle} name="fullName" placeholder="Full Name"
                 value={form.fullName} onChange={handleChange} required />
          <input className={inputStyle} name="employeeCode" placeholder="Employee Code"
                 value={form.employeeCode} onChange={handleChange} required />

          <select className={selectStyle} name="designation" value={form.designation}
                  onChange={handleChange} required>
            <option value="">Select Designation</option>
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Role list is live from the backend — this is what actually
              grants ticket:scan / manifest:view / dutyAssignment:checkIn
              permissions, separate from "designation" which is just a label */}
          <select className={selectStyle} name="roleId" value={form.roleId}
                  onChange={handleChange} required>
            <option value="">Select Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.displayName ?? r.name}</option>
            ))}
          </select>

          <input className={inputStyle} name="depotId" placeholder="Depot ID (optional)"
                 value={form.depotId} onChange={handleChange} />
          <input className={inputStyle} type="date" name="dateOfBirth"
                 value={form.dateOfBirth} onChange={handleChange} required />
          <input className={inputStyle} type="date" name="joiningDate"
                 value={form.joiningDate} onChange={handleChange} required />

          <select className={selectStyle} name="employmentType" value={form.employmentType}
                  onChange={handleChange} required>
            <option value="">Employment Type</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {form.designation === "driver" && (
            <>
              <input className={inputStyle} name="licenseNumber" placeholder="License Number"
                     value={form.licenseNumber} onChange={handleChange} />
              <input className={inputStyle} type="date" name="licenseExpiryDate"
                     value={form.licenseExpiryDate} onChange={handleChange} />
            </>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button type="button" onClick={() => navigate("/admin/usermanagement")}
                  className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-60">
            {submitting ? <Spinner /> : <Save size={18} />}
            {submitting ? "Saving…" : "Save Staff"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;