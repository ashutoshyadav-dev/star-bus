// src/components/customer/Profile.jsx

import { useState, useEffect } from "react";
import { FiEdit, FiSave, FiX, FiCamera } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../api/profile";

export default function Profile() {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [draft, setDraft] = useState({
    fullName:              "",
    dateOfBirth:           "",
    gender:                "",
    idProofType:           "",
    idProofNumber:         "",
    preferredLanguage:     "",
    emergencyContactName:  "",
    emergencyContactPhone: "",
    profilePhotoUrl:       "",
  });

  // =========================
  // GET PROFILE
  // =========================
  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await profileApi.getDetails();
      console.log("GET profile response:", response.data.data); // ← check what fields come back
      return response.data.data;
    },
  });

  // =========================
  // POPULATE FORM
  // =========================
  useEffect(() => {
    if (profileResponse) {
      setDraft({
        fullName:              profileResponse.fullName              || "",
        dateOfBirth:           profileResponse.dateOfBirth           || "",
        gender:                profileResponse.gender                || "",
        idProofType:           profileResponse.idProofType           || "",
        idProofNumber:         profileResponse.idProofNumber         || "", // ← if blank after update, backend isn't returning it
        preferredLanguage:     profileResponse.preferredLanguage     || "",
        emergencyContactName:  profileResponse.emergencyContactName  || "",
        emergencyContactPhone: profileResponse.emergencyContactPhone || "",
        profilePhotoUrl:       profileResponse.profilePhotoUrl       || "",
      });
      setPreviewImage("");
    }
  }, [profileResponse]);

  // =========================
  // IMAGE UPLOAD
  // When user picks a file:
  // 1. Show blob preview immediately
  // 2. Upload to your image server
  // 3. Store the returned URL in draft.profilePhotoUrl
  // =========================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    // Step 1 — show local preview instantly
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setUploadingImage(true);

    try {
      // Step 2 — upload to your image server
      // Replace this URL with your real image upload endpoint
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();

      // Step 3 — store the real server URL in draft
      // Adjust data.imageUrl to whatever your API returns
      const serverUrl = data.imageUrl || data.url || data.path || "";
      setDraft((prev) => ({ ...prev, profilePhotoUrl: serverUrl }));

    } catch (error) {
      console.error("Image upload failed:", error);
      // Keep preview but warn user the upload failed
      // profilePhotoUrl stays as old value — won't send broken URL
      alert("Image upload failed. The photo will not be saved.");
      setPreviewImage(""); // remove broken preview
    } finally {
      setUploadingImage(false);
    }
  };

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    const newErrors = {};

    if (draft.idProofType === "aadhaar") {
      if (!/^\d{12}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Aadhaar number must be exactly 12 digits";
      }
    }

    if (draft.idProofType === "pan") {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Invalid PAN format (e.g. ABCDE1234F)";
      }
    }

    if (draft.emergencyContactPhone) {
      const raw = draft.emergencyContactPhone.replace(/^\+91/, "");
      if (!/^[6-9]\d{9}$/.test(raw)) {
        newErrors.emergencyContactPhone = "Enter a valid 10-digit Indian mobile number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // PATCH PROFILE
  // =========================
  const updateProfileMutation = useMutation({
    mutationFn: (updatedData) => profileApi.editDetails(updatedData),

    onSuccess: (response) => {
      console.log("Profile updated:", response.data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditMode(false);
      setPreviewImage("");
      alert("Profile updated successfully!");
    },

    onError: (error) => {
      console.error("Update failed:", error);
      alert(error?.response?.data?.message || "Profile update failed");
    },
  });

  // =========================
  // SAVE
  // =========================
  const handleSave = () => {
    if (!validate()) return;

    const formattedPhone = draft.emergencyContactPhone
      ? draft.emergencyContactPhone.startsWith("+")
        ? draft.emergencyContactPhone
        : `+91${draft.emergencyContactPhone}`
      : "";

    // Never send blob: URLs — fall back to original server URL
    const photoUrl = draft.profilePhotoUrl?.startsWith("blob:")
      ? profileResponse?.profilePhotoUrl || ""
      : draft.profilePhotoUrl || "";

    const payload = {
      fullName:              draft.fullName,
      dateOfBirth:           draft.dateOfBirth,
      gender:                draft.gender,
      idProofType:           draft.idProofType,
      idProofNumber:         draft.idProofNumber,
      preferredLanguage:     draft.preferredLanguage,
      emergencyContactName:  draft.emergencyContactName,
      emergencyContactPhone: formattedPhone,
      profilePhotoUrl:       photoUrl,
    };

    console.log("PATCH payload:", payload);
    updateProfileMutation.mutate(payload);
  };

  // =========================
  // CANCEL
  // =========================
  const handleCancel = () => {
    if (profileResponse) {
      setDraft({
        fullName:              profileResponse.fullName              || "",
        dateOfBirth:           profileResponse.dateOfBirth           || "",
        gender:                profileResponse.gender                || "",
        idProofType:           profileResponse.idProofType           || "",
        idProofNumber:         profileResponse.idProofNumber         || "",
        preferredLanguage:     profileResponse.preferredLanguage     || "",
        emergencyContactName:  profileResponse.emergencyContactName  || "",
        emergencyContactPhone: profileResponse.emergencyContactPhone || "",
        profilePhotoUrl:       profileResponse.profilePhotoUrl       || "",
      });
    }
    setPreviewImage("");
    setErrors({});
    setEditMode(false);
  };

  // =========================
  // LOADING / ERROR
  // =========================
  if (isLoading) return <div className="p-6 text-gray-600">Loading profile...</div>;
  if (isError)   return <div className="p-6 text-red-500">Failed to load profile</div>;

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage your personal information</p>
        </div>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
          >
            <FiEdit /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <FiX /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending || uploadingImage}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
            >
              <FiSave />
              {updateProfileMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* Avatar — NO profilePhotoUrl text field, upload sets it automatically */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative">
            <img
              src={
                previewImage ||
                draft.profilePhotoUrl ||
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#0F3D2E] shadow-md"
            />

            {/* Uploading spinner overlay */}
            {uploadingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">Uploading...</span>
              </div>
            )}

            {editMode && (
              <label className={`absolute bottom-0 right-0 bg-[#0F3D2E] p-2 rounded-full text-white cursor-pointer hover:bg-[#14543f] transition ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                <FiCamera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>

          <div>
            <p className="font-semibold text-gray-800 text-xl">{draft.fullName || "—"}</p>
            {editMode && (
              <p className="text-xs text-green-700 mt-2 font-medium">
                {uploadingImage
                  ? "Uploading photo, please wait..."
                  : "Click the camera icon to upload a profile photo"}
              </p>
            )}
          </div>
        </div>

        <hr />

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Full Name */}
          <Field label="Full Name" editMode={editMode}>
            {editMode
              ? <input type="text" value={draft.fullName}
                  onChange={(e) => setDraft(p => ({ ...p, fullName: e.target.value }))}
                  className={inputCls} placeholder="Enter full name" />
              : <Display value={draft.fullName} />}
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" editMode={editMode}>
            {editMode
              ? <input type="date" value={draft.dateOfBirth}
                  onChange={(e) => setDraft(p => ({ ...p, dateOfBirth: e.target.value }))}
                  className={inputCls} />
              : <Display value={draft.dateOfBirth} />}
          </Field>

          {/* Gender */}
          <Field label="Gender" editMode={editMode}>
            {editMode
              ? (
                <select value={draft.gender}
                  onChange={(e) => setDraft(p => ({ ...p, gender: e.target.value }))}
                  className={inputCls}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              )
              : <Display value={draft.gender} />}
          </Field>

          {/* Preferred Language */}
          <Field label="Preferred Language" editMode={editMode}>
            {editMode
              ? (
                <select value={draft.preferredLanguage}
                  onChange={(e) => setDraft(p => ({ ...p, preferredLanguage: e.target.value }))}
                  className={inputCls}>
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              )
              : <Display value={draft.preferredLanguage} />}
          </Field>

          {/* ID Proof Type */}
          <Field label="ID Proof Type" editMode={editMode}>
            {editMode
              ? (
                <select value={draft.idProofType}
                  onChange={(e) => setDraft(p => ({ ...p, idProofType: e.target.value, idProofNumber: "" }))}
                  className={inputCls}>
                  <option value="">Select</option>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN Card</option>
                </select>
              )
              : <Display value={draft.idProofType} />}
          </Field>

          {/* ID Proof Number */}
          <Field label={draft.idProofType === "pan" ? "PAN Number" : "Aadhaar Number"} editMode={editMode}>
            {editMode
              ? (
                <>
                  <input type="text" value={draft.idProofNumber}
                    onChange={(e) => setDraft(p => ({
                      ...p,
                      idProofNumber: draft.idProofType === "pan"
                        ? e.target.value.toUpperCase()
                        : e.target.value,
                    }))}
                    placeholder={draft.idProofType === "pan" ? "ABCDE1234F" : "12-digit Aadhaar number"}
                    className={inputCls} />
                  {errors.idProofNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.idProofNumber}</p>
                  )}
                </>
              )
              : <Display value={draft.idProofNumber} />}
            {/* ↑ If this shows "—" after save, backend is not returning idProofNumber in GET response */}
          </Field>

          {/* Emergency Contact Name */}
          <Field label="Emergency Contact Name" editMode={editMode}>
            {editMode
              ? <input type="text" value={draft.emergencyContactName}
                  onChange={(e) => setDraft(p => ({ ...p, emergencyContactName: e.target.value }))}
                  placeholder="Contact person name"
                  className={inputCls} />
              : <Display value={draft.emergencyContactName} />}
          </Field>

          {/* Emergency Contact Phone */}
          <Field label="Emergency Contact Phone" editMode={editMode}>
            {editMode
              ? (
                <>
                  <input type="tel" value={draft.emergencyContactPhone}
                    onChange={(e) => setDraft(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                    placeholder="9876543210 or +919876543210"
                    className={inputCls} />
                  {errors.emergencyContactPhone && (
                    <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>
                  )}
                </>
              )
              : <Display value={draft.emergencyContactPhone} />}
          </Field>

        </div>
      </div>

      {/* Account Info — read only */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Account Info</h3>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>💰 Wallet: ₹{profileResponse?.walletBalance ?? 0}</span>
          <span>⭐ Loyalty Points: {profileResponse?.loyaltyPoints ?? 0}</span>
          {profileResponse?.isSeniorCitizen && (
            <span className="text-green-700 font-medium">🧓 Senior Citizen</span>
          )}
          {profileResponse?.isPwd && (
            <span className="text-blue-700 font-medium">♿ PWD</span>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, editMode, children }) {
  return (
    <div>
      <label className={`block text-xs mb-1 font-semibold ${editMode ? "text-[#0F3D2E]" : "text-gray-400"}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Display({ value }) {
  return (
    <p className="text-sm font-medium text-gray-800 py-3 px-4 bg-gray-50 rounded-xl">
      {value || "—"}
    </p>
  );
}

const inputCls = `
  w-full border-2 border-[#0F3D2E] rounded-xl
  px-4 py-3 text-sm text-gray-800 font-medium
  outline-none focus:ring-4 focus:ring-green-100
  focus:border-green-700 bg-white
`;