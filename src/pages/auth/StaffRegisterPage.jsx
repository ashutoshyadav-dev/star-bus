import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import CaptchaBox from "../../components/common/CaptchaBox";
import PasswordInput from "../../components/common/PasswordInput";
import Spinner from "../../components/common/Spinner";
import StaffAuthShell from "../../components/auth/StaffAuthShell";
import FormField, { inputCls } from "../../components/common/FormField";
import DateField from "../../components/common/DateField";
import { useOtpTimer } from "../../hooks/useOtpTimer";
import { validators, filters } from "../../utils/validators";
import { validateDob, todayISO } from "../../utils/dateUtils";

const DESIGNATIONS = [
  { value: "driver",           label: "Driver" },
  { value: "conductor",        label: "Conductor" },
  { value: "ticket_checker",   label: "Ticket Checker" },
  { value: "counter_clerk",    label: "Counter Clerk" },
  { value: "depot_manager",    label: "Depot Manager" },
  { value: "route_manager",    label: "Route Manager" },
  { value: "accounts_officer", label: "Accounts Officer" },
];

const EMPLOYMENT = [
  { value: "permanent",  label: "Permanent" },
  { value: "contract",   label: "Contract" },
  { value: "probation",  label: "Probation" },
  { value: "daily_wage", label: "Daily wage" },
];

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;
const LICENSE_ROLES = ["driver", "conductor"];

export default function StaffRegisterPage() {
  const navigate = useNavigate();
  const { timer: otpTimer, start: startTimer, reset: resetTimer } = useOtpTimer(60);

  const [step, setStep] = useState(1); // 1 = verify phone, 2 = details, 3 = done
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: "", employeeCode: "", designation: "", employmentType: "",
    dateOfBirth: "", joiningDate: "", licenseNumber: "", licenseExpiryDate: "",
    email: "", password: "", confirmPassword: "",
  });
  const setVal = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  };
  const set = (k) => (e) => setVal(k, e.target.value);

  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer("");
    try {
      const { data } = await authApi.getCaptcha();
      const c = data?.data ?? data;
      setCaptchaId(c.captchaId);
      setCaptchaImage(c.image);
    } catch {
      setCaptchaImage("");
      toast.error("Could not load captcha");
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const needsLicense = LICENSE_ROLES.includes(form.designation);

  const validateStep1 = () => {
    const e = { phone: validators.mobile(phone), captcha: validators.captcha(captchaAnswer) };
    Object.keys(e).forEach((k) => !e[k] && delete e[k]);
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep2 = () => {
    const e = {
      otp: validators.otp(otp),
      fullName: validators.name(form.fullName, "Full name"),
      employeeCode: /^[A-Z0-9]{3,20}$/.test(form.employeeCode) ? "" : "Employee code: 3-20 letters/digits",
      designation: form.designation ? "" : "Select a designation",
      employmentType: form.employmentType ? "" : "Select an employment type",
      email: validators.email(form.email, { required: false }),
      dateOfBirth: validateDob(form.dateOfBirth, { minAge: 18 }),
      joiningDate: form.joiningDate
        ? form.joiningDate > todayISO() ? "Joining date cannot be in the future" : ""
        : "Joining date is required",
      password: STRONG_PASSWORD.test(form.password)
        ? ""
        : "Password needs 8-64 characters with upper, lower, digit and special character",
      confirmPassword: form.password === form.confirmPassword ? "" : "Passwords do not match",
      consent: hasConsent ? "" : "Please provide your consent to continue",
    };
    if (needsLicense && !form.licenseNumber.trim()) e.licenseNumber = "Licence number is required for this designation";
    Object.keys(e).forEach((k) => !e[k] && delete e[k]);
    setErrors(e);
    return !Object.keys(e).length;
  };

  const sendOtp = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const { data } = await authApi.requestOtp({
        phone: `+91${phone}`,
        purpose: "registration",
        channel: "sms",
        captchaId,
        captchaAnswer,
      });
      setRequestId(data?.data?.requestId ?? "");
      toast.success(`OTP sent to +91 ${phone}`);
      setStep(2);
      startTimer();
    } catch {
      /* interceptor toasts the reason */
    } finally {
      setLoading(false);
      loadCaptcha(); // single-use
    }
  };

  const backToPhone = () => {
    setStep(1);
    setOtp("");
    setRequestId("");
    setErrors({});
    resetTimer();
    loadCaptcha();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return toast.error("Please correct the highlighted fields", { id: "reg-invalid" });

    setLoading(true);
    try {
      await authApi.registerStaff({
        phone: `+91${phone}`,
        otp,
        requestId,
        password: form.password,
        fullName: form.fullName.trim(),
        employeeCode: form.employeeCode.trim(),
        designation: form.designation,
        employmentType: form.employmentType,
        dateOfBirth: form.dateOfBirth,
        joiningDate: form.joiningDate,
        licenseNumber: form.licenseNumber.trim() || null,
        licenseExpiryDate: form.licenseExpiryDate || null,
        email: form.email.trim() || null,
        hasConsent,
      });
      setStep(3);
    } catch {
      /* interceptor toasts the reason */
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <StaffAuthShell title="Registration submitted">
        <div className="text-center">
          <FaCheckCircle className="mx-auto mb-3 text-5xl text-green-600" />
          <p className="text-sm text-gray-700">
            Your staff registration has been received. An administrator will review it and assign your role.
            You can log in once your role has been assigned.
          </p>
          <button
            onClick={() => navigate("/staff/login", { replace: true })}
            className="mt-6 w-full rounded-xl bg-[#0F3D2E] py-2.5 font-semibold text-white hover:bg-[#0c2e22]"
          >
            Go to Staff Login
          </button>
        </div>
      </StaffAuthShell>
    );
  }

  return (
    <StaffAuthShell
      title="Staff Registration"
      subtitle={step === 1 ? "Verify your mobile number to begin" : "Enter your employment details"}
      wide={step === 2}
    >
      {step === 1 && (
        <div className="space-y-3">
          <FormField label="Mobile number" required error={errors.phone}>
            <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3D2E] ${errors.phone ? "border-red-400" : "border-gray-300"}`}>
              <span className="px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 border-r select-none">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => { setPhone(filters.digits(e.target.value, 10)); setErrors((p) => ({ ...p, phone: "" })); }}
                className="w-full px-3 py-2.5 text-sm outline-none text-gray-800"
              />
            </div>
          </FormField>
          <div>
            <CaptchaBox
              image={captchaImage}
              value={captchaAnswer}
              onChange={(v) => { setCaptchaAnswer(v); setErrors((p) => ({ ...p, captcha: "" })); }}
              onRefresh={loadCaptcha}
              loading={captchaLoading}
            />
            {errors.captcha && <p role="alert" className="mt-1 text-xs text-red-500">{errors.captcha}</p>}
          </div>
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-[#0F3D2E] hover:bg-[#0c2e22] text-white py-2.5 rounded-xl flex justify-center items-center font-semibold disabled:opacity-60"
          >
            {loading ? <Spinner size="sm" /> : "Send OTP"}
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              OTP sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
            </span>
            <button type="button" onClick={backToPhone} className="text-[#0F3D2E] hover:underline">
              Change number
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="OTP" required error={errors.otp}
              hint={otpTimer > 0 ? `Resend available in ${otpTimer}s` : "Did not get it? Change number and request again."}
            >
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(filters.digits(e.target.value, 6)); setErrors((p) => ({ ...p, otp: "" })); }}
                className={`${inputCls(errors.otp)} tracking-widest font-mono`}
                placeholder="6-digit OTP"
              />
            </FormField>
            <FormField label="Full name" required error={errors.fullName}>
              <input value={form.fullName} onChange={(e) => setVal("fullName", filters.name(e.target.value, 150))}
                     maxLength={150} className={inputCls(errors.fullName)} />
            </FormField>
            <FormField label="Employee code" required error={errors.employeeCode}>
              <input value={form.employeeCode} onChange={(e) => setVal("employeeCode", filters.upper(e.target.value, 20))}
                     maxLength={20} className={inputCls(errors.employeeCode)} />
            </FormField>
            <FormField label="Designation" required error={errors.designation}>
              <select value={form.designation} onChange={set("designation")} className={inputCls(errors.designation)}>
                <option value="">Select designation</option>
                {DESIGNATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Employment type" required error={errors.employmentType}>
              <select value={form.employmentType} onChange={set("employmentType")} className={inputCls(errors.employmentType)}>
                <option value="">Select type</option>
                {EMPLOYMENT.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Email (optional)" error={errors.email}>
              <input type="text" inputMode="email" value={form.email}
                     onChange={(e) => setVal("email", e.target.value.replace(/\s/g, ""))}
                     className={inputCls(errors.email)} />
            </FormField>
            <FormField label="Date of birth" required error={errors.dateOfBirth}>
              <div className={`relative ${inputCls(errors.dateOfBirth)}`}>
                <DateField value={form.dateOfBirth} onChange={(v) => setVal("dateOfBirth", v)} max={todayISO()} />
              </div>
            </FormField>
            <FormField label="Joining date" required error={errors.joiningDate}>
              <div className={`relative ${inputCls(errors.joiningDate)}`}>
                <DateField value={form.joiningDate} onChange={(v) => setVal("joiningDate", v)} max={todayISO()} />
              </div>
            </FormField>
            {needsLicense && (
              <>
                <FormField label="Driving licence number" required error={errors.licenseNumber}>
                  <input value={form.licenseNumber} onChange={(e) => setVal("licenseNumber", filters.upper(e.target.value, 20))}
                         maxLength={20} className={inputCls(errors.licenseNumber)} />
                </FormField>
                <FormField label="Licence expiry date" error={errors.licenseExpiryDate}>
                  <div className={`relative ${inputCls(errors.licenseExpiryDate)}`}>
                    <DateField value={form.licenseExpiryDate} onChange={(v) => setVal("licenseExpiryDate", v)} />
                  </div>
                </FormField>
              </>
            )}
            <FormField label="Create password" required error={errors.password}>
              <div className="relative">
                <PasswordInput
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  className={`${inputCls(errors.password)} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm password" required error={errors.confirmPassword}>
              <PasswordInput
                type={showPass ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                className={inputCls(errors.confirmPassword)}
                autoComplete="new-password"
              />
            </FormField>
          </div>
          <p className="text-[11px] text-gray-500">
            Password: 8-64 characters with an uppercase letter, a lowercase letter, a digit and a special character.
          </p>

          <div>
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => { setHasConsent(e.target.checked); setErrors((p) => ({ ...p, consent: "" })); }}
                className="mt-1 h-4 w-4 accent-[#0F3D2E]"
              />
              <span className="text-xs leading-5 text-gray-700">
                I consent to receive OTPs and service-related notifications on my mobile number for authentication and
                official duty communication.<span className="text-red-500"> *</span>
              </span>
            </label>
            {errors.consent && <p role="alert" className="mt-1 text-xs text-red-500">{errors.consent}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl flex justify-center items-center font-semibold disabled:opacity-60"
          >
            {loading ? <Spinner size="sm" /> : "Submit registration"}
          </button>
        </form>
      )}

      <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-600">
        Already registered?{" "}
        <Link to="/staff/login" className="text-orange-500 font-semibold hover:underline">
          Staff login
        </Link>
      </div>
    </StaffAuthShell>
  );
}
