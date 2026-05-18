// src/components/customer/Profile.jsx

import { useState, useEffect } from "react";
import { FiEdit, FiSave, FiX, FiCamera } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { profileApi } from "../../api/profile";

export default function Profile() {
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [draft, setDraft] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    idProofType: "",
    idProofNumber: "",
    preferredLanguage: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    profilePhotoUrl: "",
  });

  // =========================
  // GET PROFILE
  // =========================
  const {
    data: profileResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await profileApi.getDetails();
      return response.data.data;
    },
  });

  // =========================
  // POPULATE FORM
  // =========================
  useEffect(() => {
    if (profileResponse) {
      setDraft({
        fullName: profileResponse.fullName || "",
        dateOfBirth: profileResponse.dateOfBirth || "",
        gender: profileResponse.gender || "",
        idProofType: profileResponse.idProofType || "",
        idProofNumber: profileResponse.idProofNumber || "",
        preferredLanguage: profileResponse.preferredLanguage || "",
        emergencyContactName:
          profileResponse.emergencyContactName || "",
        emergencyContactPhone:
          profileResponse.emergencyContactPhone || "",
        profilePhotoUrl:
          profileResponse.profilePhotoUrl || "",
      });

      setPreviewImage("");
    }
  }, [profileResponse]);

  // =========================
  // IMAGE UPLOAD
  // =========================
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // image size validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    // image type validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setPreviewImage(previewUrl);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://localhost:8080/upload/image",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();

      const serverUrl =
        data.imageUrl ||
        data.url ||
        data.path ||
        "";

      setDraft((prev) => ({
        ...prev,
        profilePhotoUrl: serverUrl,
      }));

      toast.success("Profile photo uploaded");
    } catch (error) {
      console.error("Image upload failed:", error);

      setPreviewImage("");

      toast.error(
        "Image upload failed. Photo was not saved."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    const newErrors = {};

    // Full Name
    if (!draft.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (draft.fullName.trim().length < 3) {
      newErrors.fullName =
        "Full name should be at least 3 characters";
    }

    // DOB
    if (!draft.dateOfBirth) {
      newErrors.dateOfBirth =
        "Date of birth is required";
    } else {
      const dob = new Date(draft.dateOfBirth);
      const today = new Date();

      let age =
        today.getFullYear() - dob.getFullYear();

      const monthDiff =
        today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 &&
          today.getDate() < dob.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        newErrors.dateOfBirth =
          "Passenger must be at least 18 years old";
      }
    }

    // Gender
    if (!draft.gender) {
      newErrors.gender = "Please select gender";
    }

    // Preferred Language
    if (!draft.preferredLanguage) {
      newErrors.preferredLanguage =
        "Preferred language is required";
    }

    // ID Proof Type
    if (!draft.idProofType) {
      newErrors.idProofType =
        "Please select ID proof type";
    }

    // Aadhaar validation
    if (draft.idProofType === "aadhaar") {
      if (!/^\d{12}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber =
          "Aadhaar number must be exactly 12 digits";
      }
    }

    // PAN validation
    if (draft.idProofType === "pan") {
      if (
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
          draft.idProofNumber
        )
      ) {
        newErrors.idProofNumber =
          "Invalid PAN format (ABCDE1234F)";
      }
    }

    // Emergency Contact Name
    if (!draft.emergencyContactName.trim()) {
      newErrors.emergencyContactName =
        "Emergency contact name is required";
    }

    // Emergency Contact Phone
    if (!draft.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone =
        "Emergency contact phone is required";
    } else {
      const raw =
        draft.emergencyContactPhone.replace(
          /^\+91/,
          ""
        );

      if (!/^[6-9]\d{9}$/.test(raw)) {
        newErrors.emergencyContactPhone =
          "Enter valid 10-digit Indian mobile number";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // UPDATE PROFILE
  // =========================
  const updateProfileMutation = useMutation({
    mutationFn: (updatedData) =>
      profileApi.editDetails(updatedData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });

      setEditMode(false);
      setPreviewImage("");

      toast.success("Profile updated successfully");
    },

    onError: (error) => {
      console.error("Update failed:", error);

      toast.error(
        error?.response?.data?.message ||
          "Profile update failed"
      );
    },
  });

  // =========================
  // SAVE
  // =========================
  const handleSave = () => {
    if (!validate()) {
      toast.error("Please fix validation errors");
      return;
    }

    const formattedPhone =
      draft.emergencyContactPhone
        ? draft.emergencyContactPhone.startsWith("+")
          ? draft.emergencyContactPhone
          : `+91${draft.emergencyContactPhone}`
        : "";

    const photoUrl =
      draft.profilePhotoUrl?.startsWith("blob:")
        ? profileResponse?.profilePhotoUrl || ""
        : draft.profilePhotoUrl || "";

    const payload = {
      fullName: draft.fullName.trim(),
      dateOfBirth: draft.dateOfBirth,
      gender: draft.gender,
      idProofType: draft.idProofType,
      idProofNumber: draft.idProofNumber,
      preferredLanguage:
        draft.preferredLanguage,
      emergencyContactName:
        draft.emergencyContactName.trim(),
      emergencyContactPhone:
        formattedPhone,
      profilePhotoUrl: photoUrl,
    };

    updateProfileMutation.mutate(payload);
  };

  // =========================
  // CANCEL
  // =========================
  const handleCancel = () => {
    if (profileResponse) {
      setDraft({
        fullName: profileResponse.fullName || "",
        dateOfBirth:
          profileResponse.dateOfBirth || "",
        gender: profileResponse.gender || "",
        idProofType:
          profileResponse.idProofType || "",
        idProofNumber:
          profileResponse.idProofNumber || "",
        preferredLanguage:
          profileResponse.preferredLanguage || "",
        emergencyContactName:
          profileResponse.emergencyContactName ||
          "",
        emergencyContactPhone:
          profileResponse.emergencyContactPhone ||
          "",
        profilePhotoUrl:
          profileResponse.profilePhotoUrl || "",
      });
    }

    setPreviewImage("");
    setErrors({});
    setEditMode(false);

    toast.success("Changes discarded");
  };

  // =========================
  // LOADING / ERROR
  // =========================
  if (isLoading) {
    return (
      <div className="p-6 text-gray-600">
        Loading profile...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-500">
        Failed to load profile
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            My Profile
          </h2>

          <p className="text-gray-500 text-sm mt-0.5">
            Manage your personal information
          </p>
        </div>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
          >
            <FiEdit />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <FiX />
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={
                updateProfileMutation.isPending ||
                uploadingImage
              }
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
            >
              <FiSave />

              {updateProfileMutation.isPending
                ? "Saving..."
                : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* Avatar */}
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

            {uploadingImage && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">
                  Uploading...
                </span>
              </div>
            )}

            {editMode && (
              <label
                className={`absolute bottom-0 right-0 bg-[#0F3D2E] p-2 rounded-full text-white cursor-pointer hover:bg-[#14543f] transition ${
                  uploadingImage
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
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
            <p className="font-semibold text-gray-800 text-xl">
              {draft.fullName || "—"}
            </p>

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

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Full Name */}
          <Field
            label="Full Name"
            error={errors.fullName}
          >
            {editMode ? (
              <>
                <input
                  type="text"
                  value={draft.fullName}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      fullName: e.target.value,
                    }))
                  }
                  className={inputCls}
                  placeholder="Enter full name"
                />

                {errors.fullName && (
                  <ErrorText>
                    {errors.fullName}
                  </ErrorText>
                )}
              </>
            ) : (
              <Display value={draft.fullName} />
            )}
          </Field>

          {/* DOB */}
          <Field
            label="Date of Birth"
            error={errors.dateOfBirth}
          >
            {editMode ? (
              <>
                <input
                  type="date"
                  value={draft.dateOfBirth}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      dateOfBirth:
                        e.target.value,
                    }))
                  }
                  className={inputCls}
                />

                {errors.dateOfBirth && (
                  <ErrorText>
                    {errors.dateOfBirth}
                  </ErrorText>
                )}
              </>
            ) : (
              <Display value={draft.dateOfBirth} />
            )}
          </Field>

          {/* Gender */}
          <Field
            label="Gender"
            error={errors.gender}
          >
            {editMode ? (
              <>
                <select
                  value={draft.gender}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      gender: e.target.value,
                    }))
                  }
                  className={inputCls}
                >
                  <option value="">
                    Select
                  </option>
                  <option value="male">
                    Male
                  </option>
                  <option value="female">
                    Female
                  </option>
                  <option value="other">
                    Other
                  </option>
                </select>

                {errors.gender && (
                  <ErrorText>
                    {errors.gender}
                  </ErrorText>
                )}
              </>
            ) : (
              <Display value={draft.gender} />
            )}
          </Field>

          {/* Language */}
          <Field
            label="Preferred Language"
            error={errors.preferredLanguage}
          >
            {editMode ? (
              <>
                <select
                  value={
                    draft.preferredLanguage
                  }
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      preferredLanguage:
                        e.target.value,
                    }))
                  }
                  className={inputCls}
                >
                  <option value="">
                    Select Language
                  </option>

                  <option value="English">
                    English
                  </option>

                  <option value="Hindi">
                    Hindi
                  </option>
                </select>

                {errors.preferredLanguage && (
                  <ErrorText>
                    {
                      errors.preferredLanguage
                    }
                  </ErrorText>
                )}
              </>
            ) : (
              <Display
                value={
                  draft.preferredLanguage
                }
              />
            )}
          </Field>

          {/* ID Proof Type */}
          <Field
            label="ID Proof Type"
            error={errors.idProofType}
          >
            {editMode ? (
              <>
                <select
                  value={draft.idProofType}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      idProofType:
                        e.target.value,
                      idProofNumber: "",
                    }))
                  }
                  className={inputCls}
                >
                  <option value="">
                    Select
                  </option>

                  <option value="aadhaar">
                    Aadhaar
                  </option>

                  <option value="pan">
                    PAN Card
                  </option>
                </select>

                {errors.idProofType && (
                  <ErrorText>
                    {errors.idProofType}
                  </ErrorText>
                )}
              </>
            ) : (
              <Display
                value={draft.idProofType}
              />
            )}
          </Field>

          {/* ID Proof Number */}
          <Field
            label={
              draft.idProofType === "pan"
                ? "PAN Number"
                : "Aadhaar Number"
            }
            error={errors.idProofNumber}
          >
            {editMode ? (
              <>
                <input
                  type="text"
                  value={draft.idProofNumber}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      idProofNumber:
                        draft.idProofType ===
                        "pan"
                          ? e.target.value.toUpperCase()
                          : e.target.value,
                    }))
                  }
                  placeholder={
                    draft.idProofType ===
                    "pan"
                      ? "ABCDE1234F"
                      : "12-digit Aadhaar number"
                  }
                  className={inputCls}
                />

                {errors.idProofNumber && (
                  <ErrorText>
                    {errors.idProofNumber}
                  </ErrorText>
                )}
              </>
            ) : (
              <Display
                value={draft.idProofNumber}
              />
            )}
          </Field>

          {/* Emergency Contact Name */}
          <Field
            label="Emergency Contact Name"
            error={
              errors.emergencyContactName
            }
          >
            {editMode ? (
              <>
                <input
                  type="text"
                  value={
                    draft.emergencyContactName
                  }
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      emergencyContactName:
                        e.target.value,
                    }))
                  }
                  placeholder="Contact person name"
                  className={inputCls}
                />

                {errors.emergencyContactName && (
                  <ErrorText>
                    {
                      errors.emergencyContactName
                    }
                  </ErrorText>
                )}
              </>
            ) : (
              <Display
                value={
                  draft.emergencyContactName
                }
              />
            )}
          </Field>

          {/* Emergency Contact Phone */}
          <Field
            label="Emergency Contact Phone"
            error={
              errors.emergencyContactPhone
            }
          >
            {editMode ? (
              <>
                <input
                  type="tel"
                  value={
                    draft.emergencyContactPhone
                  }
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      emergencyContactPhone:
                        e.target.value,
                    }))
                  }
                  placeholder="9876543210"
                  className={inputCls}
                />

                {errors.emergencyContactPhone && (
                  <ErrorText>
                    {
                      errors.emergencyContactPhone
                    }
                  </ErrorText>
                )}
              </>
            ) : (
              <Display
                value={
                  draft.emergencyContactPhone
                }
              />
            )}
          </Field>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">
          Account Info
        </h3>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>
            💰 Wallet: ₹
            {profileResponse?.walletBalance ??
              0}
          </span>

          <span>
            ⭐ Loyalty Points:{" "}
            {profileResponse?.loyaltyPoints ??
              0}
          </span>

          {profileResponse?.isSeniorCitizen && (
            <span className="text-green-700 font-medium">
              🧓 Senior Citizen
            </span>
          )}

          {profileResponse?.isPwd && (
            <span className="text-blue-700 font-medium">
              ♿ PWD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================
// HELPERS
// =========================

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1 font-semibold text-[#0F3D2E]">
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

function ErrorText({ children }) {
  return (
    <p className="text-red-500 text-xs mt-1">
      {children}
    </p>
  );
}

const inputCls = `
  w-full border-2 border-[#0F3D2E]
  rounded-xl px-4 py-3 text-sm text-gray-800
  font-medium outline-none bg-white
  focus:ring-4 focus:ring-green-100
  focus:border-green-700
`;