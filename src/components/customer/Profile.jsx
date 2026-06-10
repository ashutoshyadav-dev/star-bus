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
        emergencyContactName: profileResponse.emergencyContactName || "",
        emergencyContactPhone: profileResponse.emergencyContactPhone || "",
        profilePhotoUrl: profileResponse.profilePhotoUrl || "",
      });

      setPreviewImage("");
    }
  }, [profileResponse]);

  // =========================

  // BLOCK DIGITS IN NAME FIELDS
  // =========================
  const blockDigits = (e) => {
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // =========================

  // IMAGE UPLOAD
  // =========================
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Image size validation (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2 MB");
      return;
    }

    // Image type validation — only jpg, png, webp
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed");

      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      const serverUrl = data.imageUrl || data.url || data.path || "";

      setDraft((prev) => ({ ...prev, profilePhotoUrl: serverUrl }));
      toast.success("Profile photo uploaded successfully");
    } catch (error) {
      console.error("Image upload failed:", error);
      setPreviewImage("");
      toast.error("Image upload failed. Photo was not saved.");

    } finally {
      setUploadingImage(false);
    }
  };

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    const newErrors = {};


    // Full Name — no digits allowed
    if (!draft.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (draft.fullName.trim().length < 3) {
      newErrors.fullName = "Full name should be at least 3 characters";
    } else if (/[0-9]/.test(draft.fullName)) {
      newErrors.fullName = "Full name must not contain numbers";

    }

    // DOB
    if (!draft.dateOfBirth) {

      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(draft.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dateOfBirth = "Passenger must be at least 18 years old";

      }
    }

    // Gender
    if (!draft.gender) {
      newErrors.gender = "Please select gender";
    }

    // Preferred Language
    if (!draft.preferredLanguage) {

      newErrors.preferredLanguage = "Preferred language is required";

    }

    // ID Proof Type
    if (!draft.idProofType) {

      newErrors.idProofType = "Please select ID proof type";
    }

    // ID Proof Number — format rules per type
    if (draft.idProofType === "aadhaar") {
      if (!/^\d{12}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Aadhaar number must be exactly 12 digits";
      }
    }

    if (draft.idProofType === "pan_card") {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Invalid PAN format (e.g. ABCDE1234F)";
      }
    }

    if (draft.idProofType === "voter_id") {
      // EPIC: 3 letters + 7 digits, exactly 10 chars
      if (!/^[A-Z]{3}[0-9]{7}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Invalid Voter ID format (e.g. ABC1234567)";
      }
    }

    if (draft.idProofType === "passport") {
      // Indian passport: 1 letter + 7 digits, exactly 8 chars
      if (!/^[A-Z]{1}[0-9]{7}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Invalid Passport number (e.g. A1234567)";
      }
    }

    if (draft.idProofType === "driving_license") {
      // State code (2 letters) + digits, 15–16 chars total
      if (!/^[A-Z]{2}[0-9]{13,14}$/.test(draft.idProofNumber)) {
        newErrors.idProofNumber = "Invalid Driving Licence number (e.g. DL0120110012345)";
      }
    }

    // Emergency Contact Name — no digits
    if (!draft.emergencyContactName.trim()) {
      newErrors.emergencyContactName = "Emergency contact name is required";
    } else if (/[0-9]/.test(draft.emergencyContactName)) {
      newErrors.emergencyContactName = "Contact name must not contain numbers";
    }

    // Emergency Contact Phone — exactly 10 Indian digits
    if (!draft.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = "Emergency contact phone is required";
    } else {
      const raw = draft.emergencyContactPhone.replace(/^\+91/, "");
      if (!/^[6-9]\d{9}$/.test(raw)) {
        newErrors.emergencyContactPhone = "Enter a valid 10-digit Indian mobile number";

      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // UPDATE PROFILE
  // =========================
  const updateProfileMutation = useMutation({

    mutationFn: (updatedData) => profileApi.editDetails(updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditMode(false);
      setPreviewImage("");
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error(error?.response?.data?.message || "Profile update failed");

    },
  });

  // =========================
  // SAVE
  // =========================
  const handleSave = () => {
    if (!validate()) {

      toast.error("Please fix the validation errors");
      return;
    }

    const formattedPhone = draft.emergencyContactPhone
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

      preferredLanguage: draft.preferredLanguage,
      emergencyContactName: draft.emergencyContactName.trim(),
      emergencyContactPhone: formattedPhone,

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

        dateOfBirth: profileResponse.dateOfBirth || "",
        gender: profileResponse.gender || "",
        idProofType: profileResponse.idProofType || "",
        idProofNumber: profileResponse.idProofNumber || "",
        preferredLanguage: profileResponse.preferredLanguage || "",
        emergencyContactName: profileResponse.emergencyContactName || "",
        emergencyContactPhone: profileResponse.emergencyContactPhone || "",
        profilePhotoUrl: profileResponse.profilePhotoUrl || "",
      });
    }
    setPreviewImage("");
    setErrors({});
    setEditMode(false);

    toast.success("Changes discarded");
  };

  // =========================

  // LOYALTY TIER HELPER
  // =========================
  const getLoyaltyTier = (points) => {
    if (points >= 5000) return { label: "Gold", color: "text-yellow-600 bg-yellow-50" };
    if (points >= 1000) return { label: "Silver", color: "text-gray-500 bg-gray-100" };
    return { label: "Bronze", color: "text-orange-600 bg-orange-50" };
  };

  // =========================
  // ID PROOF NUMBER RESTRICTIONS
  // =========================
  // Allowed keys helper (shared across cases)
  const allowNav = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];

  const getIdProofInputProps = () => {
    switch (draft.idProofType) {

      case "aadhaar":
        return {
          placeholder: "123412341234",
          maxLength: 12,
          onKeyDown: (e) => {
            if (!/[0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault();
          },
        };

      case "pan_card":
        return {
          placeholder: "ABCDE1234F",
          maxLength: 10,
          onKeyDown: (e) => {
            if (!/[a-zA-Z0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault();
          },
        };

      case "voter_id":
        // EPIC format: 3 letters + 7 digits = 10 chars  e.g. ABC1234567
        return {
          placeholder: "ABC1234567",
          maxLength: 10,
          onKeyDown: (e) => {
            if (!/[a-zA-Z0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault();
          },
        };

      case "passport":
        // Indian passport: 1 letter + 7 digits = 8 chars  e.g. A1234567
        return {
          placeholder: "A1234567",
          maxLength: 8,
          onKeyDown: (e) => {
            if (!/[a-zA-Z0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault();
          },
        };

      case "driving_license":
        // Format varies by state/era; typically 15-16 chars  e.g. DL0120110012345
        return {
          placeholder: "DL0120110012345",
          maxLength: 16,
          onKeyDown: (e) => {
            if (!/[a-zA-Z0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault();
          },
        };

      default:
        return { placeholder: "ID number" };
    }
  };

  // =========================
  // LOADING / ERROR
  // =========================
  if (isLoading) {
    return <div className="p-6 text-gray-600">Loading profile...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Failed to load profile</div>;
  }

  const loyaltyTier = getLoyaltyTier(profileResponse?.loyaltyPoints ?? 0);
  const idProps = getIdProofInputProps();


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

                <span className="text-white text-xs">Uploading...</span>

              </div>
            )}

            {editMode && (
              <label
                className={`absolute bottom-0 right-0 bg-[#0F3D2E] p-2 rounded-full text-white cursor-pointer hover:bg-[#14543f] transition ${

                  uploadingImage ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <FiCamera size={16} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"

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

              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-green-700 font-medium">
                  {uploadingImage
                    ? "Uploading photo, please wait..."
                    : "Click the camera icon to upload a profile photo"}
                </p>
                {/* ── Photo upload guidance ── */}
                <p className="text-xs text-gray-400">
                  Accepted formats: JPG, PNG, WEBP · Max size: 2 MB
                </p>
              </div>

            )}
          </div>
        </div>

        <hr />

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Full Name */}

          <Field label="Full Name" error={errors.fullName}>


            {editMode ? (
              <>
                <input
                  type="text"
                  value={draft.fullName}

                  onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                  onKeyDown={blockDigits}
                  className={inputCls}
                  placeholder="Enter full name"
                />
                {errors.fullName && <ErrorText>{errors.fullName}</ErrorText>}

              </>
            ) : (
              <Display value={draft.fullName} />
            )}
          </Field>

          {/* DOB */}

          <Field label="Date of Birth" error={errors.dateOfBirth}>

            {editMode ? (
              <>
                <input
                  type="date"
                  value={draft.dateOfBirth}

                  onChange={(e) => setDraft((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className={inputCls}
                />
                {errors.dateOfBirth && <ErrorText>{errors.dateOfBirth}</ErrorText>}

              </>
            ) : (
              <Display value={draft.dateOfBirth} />
            )}
          </Field>


          {/* Gender — added prefer_not_to_say */}
          <Field label="Gender" error={errors.gender}>

            {editMode ? (
              <>
                <select
                  value={draft.gender}

                  onChange={(e) => setDraft((p) => ({ ...p, gender: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <ErrorText>{errors.gender}</ErrorText>}

              </>
            ) : (
              <Display value={draft.gender} />
            )}
          </Field>

          {/* Language */}

          <Field label="Preferred Language" error={errors.preferredLanguage}>
            {editMode ? (
              <>
                <select
                  value={draft.preferredLanguage}
                  onChange={(e) => setDraft((p) => ({ ...p, preferredLanguage: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
                {errors.preferredLanguage && <ErrorText>{errors.preferredLanguage}</ErrorText>}
              </>
            ) : (
              <Display value={draft.preferredLanguage} />
            )}
          </Field>

          {/* ID Proof Type — all 5 enum values */}
          <Field label="ID Proof Type" error={errors.idProofType}>

            {editMode ? (
              <>
                <select
                  value={draft.idProofType}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,

                      idProofType: e.target.value,
                      idProofNumber: "",   // reset number on type change

                    }))
                  }
                  className={inputCls}
                >

                  <option value="">Select</option>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan_card">PAN Card</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving Licence</option>
                </select>
                {errors.idProofType && <ErrorText>{errors.idProofType}</ErrorText>}
              </>
            ) : (
              <Display value={draft.idProofType} />
            )}
          </Field>

          {/* ID Proof Number — restricted by type */}
          <Field
            label={
              draft.idProofType === "aadhaar"        ? "Aadhaar Number"
              : draft.idProofType === "pan_card"     ? "PAN Number"
              : draft.idProofType === "voter_id"     ? "Voter ID (EPIC) Number"
              : draft.idProofType === "passport"     ? "Passport Number"
              : draft.idProofType === "driving_license" ? "Driving Licence Number"
              : "ID Number"

            }
            error={errors.idProofNumber}
          >
            {editMode ? (
              <>
                <input
                  type="text"
                  value={draft.idProofNumber}

                  onChange={(e) => {
                    // All types except aadhaar are uppercased
                    const val = draft.idProofType === "aadhaar"
                      ? e.target.value
                      : e.target.value.toUpperCase();
                    setDraft((p) => ({ ...p, idProofNumber: val }));
                  }}
                  className={inputCls}
                  {...idProps}
                />
                {/* Dynamic hint per ID type */}
                {draft.idProofType === "aadhaar" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Digits only · {draft.idProofNumber.length}/12
                  </p>
                )}
                {draft.idProofType === "pan_card" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Format: ABCDE1234F · {draft.idProofNumber.length}/10
                  </p>
                )}
                {draft.idProofType === "voter_id" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Format: ABC1234567 (3 letters + 7 digits) · {draft.idProofNumber.length}/10
                  </p>
                )}
                {draft.idProofType === "passport" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Format: A1234567 (1 letter + 7 digits) · {draft.idProofNumber.length}/8
                  </p>
                )}
                {draft.idProofType === "driving_license" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Format: DL0120110012345 (state code + digits, 15–16 chars) · {draft.idProofNumber.length}/16
                  </p>
                )}
                {errors.idProofNumber && <ErrorText>{errors.idProofNumber}</ErrorText>}
              </>
            ) : (
              <Display value={draft.idProofNumber} />
            )}
          </Field>

          {/* Emergency Contact Name — no digits */}
          <Field label="Emergency Contact Name" error={errors.emergencyContactName}>

            {editMode ? (
              <>
                <input
                  type="text"

                  value={draft.emergencyContactName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, emergencyContactName: e.target.value }))
                  }
                  onKeyDown={blockDigits}
                  placeholder="Contact person name"
                  className={inputCls}
                />
                {errors.emergencyContactName && (
                  <ErrorText>{errors.emergencyContactName}</ErrorText>
                )}
              </>
            ) : (
              <Display value={draft.emergencyContactName} />
            )}
          </Field>

          {/* Emergency Contact Phone — digits only, max 10 */}
          <Field label="Emergency Contact Phone" error={errors.emergencyContactPhone}>

            {editMode ? (
              <>
                <input
                  type="tel"

                  value={draft.emergencyContactPhone}
                  onChange={(e) => {
                    // strip +91 prefix for display, keep raw 10 digits
                    const raw = e.target.value.replace(/^\+91/, "").replace(/\D/g, "");
                    if (raw.length <= 10) {
                      setDraft((p) => ({ ...p, emergencyContactPhone: raw }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={10}
                  placeholder="9876543210"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">
                  10 digits · {draft.emergencyContactPhone.replace(/^\+91/, "").length}/10
                </p>
                {errors.emergencyContactPhone && (
                  <ErrorText>{errors.emergencyContactPhone}</ErrorText>
                )}
              </>
            ) : (
              <Display value={draft.emergencyContactPhone} />

            )}
          </Field>
        </div>
      </div>


      {/* Wallet & Account Info — improved */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Account Info</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

          {/* Wallet Balance */}
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-700 font-medium mb-1">Wallet Balance</p>
            <p className="text-lg font-bold text-green-900">
              ₹{(profileResponse?.walletBalance ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {profileResponse?.walletFrozen && (
              <span className="text-xs text-red-600 font-medium mt-1 block">🔒 Frozen</span>
            )}
          </div>

          {/* Loyalty Points */}
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-xs text-orange-700 font-medium mb-1">Loyalty Points</p>
            <p className="text-lg font-bold text-orange-900">
              {(profileResponse?.loyaltyPoints ?? 0).toLocaleString("en-IN")}
            </p>
            <span
              className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${loyaltyTier.color}`}
            >
              {loyaltyTier.label}
            </span>
          </div>

          {/* Special categories */}
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 justify-center">
            {profileResponse?.isSeniorCitizen && (
              <span className="text-xs text-green-700 font-medium">🧓 Senior Citizen</span>
            )}
            {profileResponse?.isPwd && (
              <span className="text-xs text-blue-700 font-medium">♿ PWD</span>
            )}
            {!profileResponse?.isSeniorCitizen && !profileResponse?.isPwd && (
              <span className="text-xs text-gray-400">No special categories</span>
            )}
          </div>

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

  return <p className="text-red-500 text-xs mt-1">{children}</p>;

}

const inputCls = `
  w-full border-2 border-[#0F3D2E]
  rounded-xl px-4 py-3 text-sm text-gray-800
  font-medium outline-none bg-white
  focus:ring-4 focus:ring-green-100
  focus:border-green-700

`;

