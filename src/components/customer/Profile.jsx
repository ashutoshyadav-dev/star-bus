import { useState, useEffect } from "react";
import { FiEdit, FiSave, FiX, FiCamera } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { profileApi } from "../../api/profile";
import { buildImageUrl } from "../../api/cms";
import DateField from "../common/DateField";
import { validators, filters } from "../../utils/validators";
import { validateDob, todayISO, isoToDMY } from "../../utils/dateUtils";
import { ID_PROOF_LABELS, GENDER_LABELS, label } from "../../utils/labels";
import profilrAvtar from "../../assets/profileAvtar.jpg"

const FALLBACK_AVATAR = profilrAvtar;

export default function Profile() {
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Photo is saved on the server the moment it is uploaded (POST /passenger/profile/photo),
  // so it lives in its own state and is NOT part of the editable draft / PATCH payload.
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    document.title = "Profile | APSTS Passenger Portal";
  }, []);

  const [draft, setDraft] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    idProofType: "",
    idProofNumber: "",
    preferredLanguage: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const draftFromProfile = (p) => ({
    fullName: p.fullName || "",
    email: p.email || "",
    dateOfBirth: p.dateOfBirth || "",
    gender: p.gender || "",
    idProofType: p.idProofType || "",
    idProofNumber: p.idProofNumber || "",
    preferredLanguage: p.preferredLanguage || "",
    emergencyContactName: p.emergencyContactName || "",
    emergencyContactPhone: p.emergencyContactPhone || "",
  });

  const setField = (k, v) => {
    setDraft((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  };

  // =========================
  // GET PROFILE
  // =========================
  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await profileApi.getDetails();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (profileResponse) {
      setDraft(draftFromProfile(profileResponse));
      setPhotoUrl(profileResponse.profilePhotoUrl || "");
      setPreviewImage("");
    }
  }, [profileResponse]);

  // =========================
  // IMAGE UPLOAD  (backend: POST /passenger/profile/photo)
  // =========================
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2 MB");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed");
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const res = await profileApi.uploadPhoto(file);
      const saved = res.data?.data ?? res.data;
      setPhotoUrl(saved?.profilePhotoUrl || "");
      toast.success("Profile photo uploaded successfully");
    } catch {
      // interceptor already shows the server message
      setPreviewImage("");
    } finally {
      setUploadingImage(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  // =========================
  // VALIDATION  (all rules come from utils/validators + utils/dateUtils)
  // =========================
  const validate = () => {
    const newErrors = {};

    const nameErr = validators.name(draft.fullName, "Full name");
    if (nameErr) newErrors.fullName = nameErr;

    const mailErr = validators.email(draft.email, { required: false });
    if (mailErr) newErrors.email = mailErr;

    const dobErr = validateDob(draft.dateOfBirth, { minAge: 18 });
    if (dobErr) newErrors.dateOfBirth = dobErr;

    if (!draft.gender) newErrors.gender = "Please select gender";
    if (!draft.preferredLanguage) newErrors.preferredLanguage = "Preferred language is required";
    if (!draft.idProofType) newErrors.idProofType = "Please select ID proof type";

    if (draft.idProofType === "aadhaar" && !/^\d{12}$/.test(draft.idProofNumber))
      newErrors.idProofNumber = "Aadhaar number must be exactly 12 digits";
    if (draft.idProofType === "pan_card" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(draft.idProofNumber))
      newErrors.idProofNumber = "Invalid PAN format (e.g. ABCDE1234F)";
    if (draft.idProofType === "voter_id" && !/^[A-Z]{3}[0-9]{7}$/.test(draft.idProofNumber))
      newErrors.idProofNumber = "Invalid Voter ID format (e.g. ABC1234567)";
    if (draft.idProofType === "passport" && !/^[A-Z]{1}[0-9]{7}$/.test(draft.idProofNumber))
      newErrors.idProofNumber = "Invalid Passport number (e.g. A1234567)";
    if (draft.idProofType === "driving_license" && !/^[A-Z]{2}[0-9]{13,14}$/.test(draft.idProofNumber))
      newErrors.idProofNumber = "Invalid Driving Licence number (e.g. DL0120110012345)";
    if (draft.idProofType && !draft.idProofNumber && !newErrors.idProofNumber)
      newErrors.idProofNumber = "ID number is required";

    const ecName = validators.name(draft.emergencyContactName, "Emergency contact name");
    if (ecName) newErrors.emergencyContactName = ecName;

    const ecPhone = validators.mobile(draft.emergencyContactPhone.replace(/^\+91/, ""));
    if (ecPhone) newErrors.emergencyContactPhone = ecPhone;

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
    // errors: the axios interceptor already toasts the server message
  });

  const handleSave = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields", { id: "profile-invalid" });
      return;
    }
    const phone = draft.emergencyContactPhone.replace(/^\+91/, "");

    // profilePhotoUrl is intentionally NOT sent: photos go through POST /passenger/profile/photo.
    // email: "" removes the email, a value sets/changes it.
    updateProfileMutation.mutate({
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      dateOfBirth: draft.dateOfBirth,
      gender: draft.gender,
      idProofType: draft.idProofType,
      idProofNumber: draft.idProofNumber,
      preferredLanguage: draft.preferredLanguage,
      emergencyContactName: draft.emergencyContactName.trim(),
      emergencyContactPhone: phone ? `+91${phone}` : "",
    });
  };

  const handleCancel = () => {
    if (profileResponse) setDraft(draftFromProfile(profileResponse));
    setPreviewImage("");
    setErrors({});
    setEditMode(false);
    toast.success("Changes discarded");
  };

  // =========================
  // ID PROOF NUMBER RESTRICTIONS
  // =========================
  const allowNav = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
  const alnumOnly = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault();
  };
  const idProps = (() => {
    switch (draft.idProofType) {
      case "aadhaar":
        return {
          placeholder: "123412341234", maxLength: 12,
          onKeyDown: (e) => { if (!/[0-9]/.test(e.key) && !allowNav.includes(e.key)) e.preventDefault(); },
        };
      case "pan_card":        return { placeholder: "ABCDE1234F", maxLength: 10, onKeyDown: alnumOnly };
      case "voter_id":        return { placeholder: "ABC1234567", maxLength: 10, onKeyDown: alnumOnly };
      case "passport":        return { placeholder: "A1234567", maxLength: 8, onKeyDown: alnumOnly };
      case "driving_license": return { placeholder: "DL0120110012345", maxLength: 16, onKeyDown: alnumOnly };
      default:                return { placeholder: "ID number" };
    }
  })();

  if (isLoading) return <div className="p-6 text-gray-600">Loading profile...</div>;
  if (isError) return <div className="p-6 text-red-500">Failed to load profile</div>;

  const idNumberLabel =
    draft.idProofType === "aadhaar"           ? "Aadhaar Number"
    : draft.idProofType === "pan_card"        ? "PAN Number"
    : draft.idProofType === "voter_id"        ? "Voter ID (EPIC) Number"
    : draft.idProofType === "passport"        ? "Passport Number"
    : draft.idProofType === "driving_license" ? "Driving Licence Number"
    : "ID Number";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-600 text-sm mt-0.5">Manage your personal information</p>
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
              disabled={updateProfileMutation.isLoading || uploadingImage}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
            >
              <FiSave /> {updateProfileMutation.isLoading ? "Saving..." : "Save"}
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
              src={previewImage || buildImageUrl(photoUrl) || FALLBACK_AVATAR}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#0F3D2E] shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_AVATAR;
              }}
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
            <p className="font-semibold text-gray-800 text-xl">{draft.fullName || "—"}</p>
            {editMode && (
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-green-700 font-medium">
                  {uploadingImage ? "Uploading photo, please wait..." : "Click the camera icon to upload a profile photo"}
                </p>
                <p className="text-xs text-gray-500">
                  Accepted formats: JPG, PNG, WEBP · Max size: 2 MB · Photo is saved immediately
                </p>
              </div>
            )}
          </div>
        </div>

        <hr />

        {/* Fields — a field gets * exactly when its validator reports "required" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full Name" required error={errors.fullName}>
            {editMode ? (
              <input
                type="text"
                value={draft.fullName}
                onChange={(e) => setField("fullName", filters.name(e.target.value, 150))}
                className={inputCls}
                placeholder="Enter full name"
              />
            ) : (
              <Display value={draft.fullName} />
            )}
          </Field>

          <Field label="Mobile Number">
            <Display value={profileResponse?.phoneNumber} />
          </Field>

          <Field label="Email" error={errors.email}>
            {editMode ? (
              <input
                type="text"
                inputMode="email"
                name="email"
                value={draft.email}
                onChange={(e) => setField("email", e.target.value.replace(/\s/g, ""))}
                maxLength={150}
                className={inputCls}
                placeholder="you@example.com"
              />
            ) : (
              <Display value={draft.email} />
            )}
          </Field>

          <Field label="Date of Birth" required error={errors.dateOfBirth}>
            {editMode ? (
              <div className={`relative ${inputCls}`}>
                <DateField value={draft.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} max={todayISO()} />
              </div>
            ) : (
              <Display value={isoToDMY(draft.dateOfBirth)} />
            )}
          </Field>

          <Field label="Gender" required error={errors.gender}>
            {editMode ? (
              <select value={draft.gender} onChange={(e) => setField("gender", e.target.value)} className={inputCls}>
                <option value="">Select</option>
                {Object.entries(GENDER_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            ) : (
              <Display value={draft.gender ? label(GENDER_LABELS, draft.gender) : ""} />
            )}
          </Field>

          <Field label="Preferred Language" required error={errors.preferredLanguage}>
            {editMode ? (
              <select
                value={draft.preferredLanguage}
                onChange={(e) => setField("preferredLanguage", e.target.value)}
                className={inputCls}
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            ) : (
              <Display value={draft.preferredLanguage} />
            )}
          </Field>

          <Field label="ID Proof Type" required error={errors.idProofType}>
            {editMode ? (
              <select
                value={draft.idProofType}
                onChange={(e) => {
                  setField("idProofType", e.target.value);
                  setField("idProofNumber", ""); // reset number on type change
                }}
                className={inputCls}
              >
                <option value="">Select</option>
                {Object.entries(ID_PROOF_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            ) : (
              <Display value={draft.idProofType ? label(ID_PROOF_LABELS, draft.idProofType) : ""} />
            )}
          </Field>

          <Field label={idNumberLabel} required error={errors.idProofNumber}>
            {editMode ? (
              <>
                <input
                  type="text"
                  value={draft.idProofNumber}
                  onChange={(e) =>
                    setField("idProofNumber", draft.idProofType === "aadhaar" ? e.target.value : e.target.value.toUpperCase())
                  }
                  className={inputCls}
                  {...idProps}
                />
                {draft.idProofType === "aadhaar" && (
                  <p className="text-xs text-gray-500 mt-1">Digits only · {draft.idProofNumber.length}/12</p>
                )}
                {draft.idProofType === "pan_card" && (
                  <p className="text-xs text-gray-500 mt-1">Format: ABCDE1234F · {draft.idProofNumber.length}/10</p>
                )}
                {draft.idProofType === "voter_id" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: ABC1234567 (3 letters + 7 digits) · {draft.idProofNumber.length}/10
                  </p>
                )}
                {draft.idProofType === "passport" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: A1234567 (1 letter + 7 digits) · {draft.idProofNumber.length}/8
                  </p>
                )}
                {draft.idProofType === "driving_license" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: DL0120110012345 (state code + digits) · {draft.idProofNumber.length}/16
                  </p>
                )}
              </>
            ) : (
              <Display value={draft.idProofNumber} />
            )}
          </Field>

          <Field label="Emergency Contact Name" required error={errors.emergencyContactName}>
            {editMode ? (
              <input
                type="text"
                value={draft.emergencyContactName}
                onChange={(e) => setField("emergencyContactName", filters.name(e.target.value, 100))}
                placeholder="Contact person name"
                className={inputCls}
              />
            ) : (
              <Display value={draft.emergencyContactName} />
            )}
          </Field>

          <Field label="Emergency Contact Phone" required error={errors.emergencyContactPhone}>
            {editMode ? (
              <>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={draft.emergencyContactPhone.replace(/^\+91/, "")}
                  onChange={(e) => setField("emergencyContactPhone", filters.digits(e.target.value.replace(/^\+91/, ""), 10))}
                  maxLength={10}
                  placeholder="9876543210"
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 mt-1">
                  10 digits · {draft.emergencyContactPhone.replace(/^\+91/, "").length}/10
                </p>
              </>
            ) : (
              <Display value={draft.emergencyContactPhone} />
            )}
          </Field>
        </div>
      </div>
    </div>
  );
}

// =========================
// HELPERS
// =========================

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs mb-1 font-semibold text-[#0F3D2E]">
        {label}
        {required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <p role="alert" className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Display({ value }) {
  return (
    <p className="text-sm font-medium text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-all">
      {value || "—"}
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
