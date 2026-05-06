import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiEdit, FiSave, FiX } from "react-icons/fi";

export default function Profile() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name:   user?.name   ?? "",
    phone:  user?.phone  ?? "",
    email:  user?.email  ?? "",
    dob:    user?.dob    ?? "",
    gender: user?.gender ?? "",
  });
  const [draft, setDraft] = useState({ ...profile });

  const handleSave = () => {
    setProfile({ ...draft });
    setEditMode(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage your personal information</p>
        </div>
        {!editMode ? (
          <button
            onClick={() => { setDraft({ ...profile }); setEditMode(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
          >
            <FiEdit /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              <FiX /> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
              <FiSave /> Save
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0F3D2E] to-[#163F2D] flex items-center justify-center text-white text-2xl font-bold">
            {(profile.name || profile.phone || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{profile.name || "—"}</p>
            <p className="text-sm text-gray-500">{profile.phone || "—"}</p>
          </div>
        </div>

        <hr />

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: "Full Name",    key: "name",   type: "text" },
            { label: "Mobile",       key: "phone",  type: "tel",  readOnly: true },
            { label: "Email",        key: "email",  type: "email" },
            { label: "Date of Birth",key: "dob",    type: "date" },
          ].map(({ label, key, type, readOnly }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              {editMode && !readOnly ? (
                <input
                  type={type}
                  value={draft[key]}
                  onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 py-2 px-3 bg-gray-50 rounded-lg">
                  {profile[key] || "—"}
                  {readOnly && <span className="ml-2 text-xs text-gray-400">(verified)</span>}
                </p>
              )}
            </div>
          ))}

          {/* Gender */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gender</label>
            {editMode ? (
              <select
                value={draft.gender}
                onChange={(e) => setDraft((p) => ({ ...p, gender: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-800 py-2 px-3 bg-gray-50 rounded-lg">
                {profile.gender || "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Account Info</h3>
        <div className="flex flex-wrap gap-2">
          {(user?.roles ?? ["PASSENGER"]).map((r) => (
            <span key={r} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
