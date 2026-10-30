import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import CaptchaBox from "../../components/common/CaptchaBox";
import PasswordInput from "../../components/common/PasswordInput";
import Spinner from "../../components/common/Spinner";
import StaffAuthShell from "../../components/auth/StaffAuthShell";
import { useOtpTimer } from "../../hooks/useOtpTimer";

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

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;
const LICENSE_ROLES = ["driver", "conductor"];

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E]";

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

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
  const [form, setForm] = useState({
    fullName: "", employeeCode: "", designation: "", employmentType: "",
    dateOfBirth: "", joiningDate: "", licenseNumber: "", licenseExpiryDate: "",
    email: "", password: "", confirmPassword: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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

  const sendOtp = async () => {
    if (phone.length !== 10) return toast.error("Enter a valid 10-digit mobile number");
    if (captchaAnswer.length < 4) return toast.error("Enter the captcha");
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
    resetTimer();
    loadCaptcha();
  };

  const needsLicense = LICENSE_ROLES.includes(form.designation);

  const submit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    if (!PASSWORD_RE.test(form.password))
      return toast.error("Password needs 8-64 characters with upper, lower, digit and special character");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    if (!hasConsent) return toast.error("Please provide your consent to continue");
    if (needsLicense && !form.licenseNumber.trim())
      return toast.error("Licence number is required for this designation");

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
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3D2E]">
            <span className="px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 border-r select-none">+91</span>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2.5 text-sm outline-none text-gray-800"
            />
          </div>
          <CaptchaBox
            image={captchaImage}
            value={captchaAnswer}
            onChange={setCaptchaAnswer}
            onRefresh={loadCaptcha}
            loading={captchaLoading}
          />
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
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              OTP sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
            </span>
            <button type="button" onClick={backToPhone} className="text-[#0F3D2E] hover:underline">
              Change number
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="OTP" required>
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={`${inputCls} tracking-widest font-mono`}
                placeholder="6-digit OTP"
              />
              <span className="mt-1 block text-[11px] text-gray-400">
                {otpTimer > 0 ? `Resend available in ${otpTimer}s` : "Did not get it? Change number and request again."}
              </span>
            </Field>
            <Field label="Full name" required>
              <input value={form.fullName} onChange={set("fullName")} required maxLength={150} className={inputCls} />
            </Field>
            <Field label="Employee code" required>
              <input value={form.employeeCode} onChange={set("employeeCode")} required maxLength={20} className={inputCls} />
            </Field>
            <Field label="Designation" required>
              <select value={form.designation} onChange={set("designation")} required className={inputCls}>
                <option value="">Select designation</option>
                {DESIGNATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Employment type" required>
              <select value={form.employmentType} onChange={set("employmentType")} required className={inputCls}>
                <option value="">Select type</option>
                {EMPLOYMENT.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Email (optional)">
              <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
            </Field>
            <Field label="Date of birth" required>
              <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required className={inputCls}
                max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Joining date" required>
              <input type="date" value={form.joiningDate} onChange={set("joiningDate")} required className={inputCls} />
            </Field>
            {needsLicense && (
              <>
                <Field label="Driving licence number" required>
                  <input value={form.licenseNumber} onChange={set("licenseNumber")} maxLength={20} className={inputCls} />
                </Field>
                <Field label="Licence expiry date">
                  <input type="date" value={form.licenseExpiryDate} onChange={set("licenseExpiryDate")} className={inputCls} />
                </Field>
              </>
            )}
            <Field label="Create password" required>
              <div className="relative">
                <PasswordInput
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  className={`${inputCls} pr-10`}
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
            </Field>
            <Field label="Confirm password" required>
              <PasswordInput
                type={showPass ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <p className="text-[11px] text-gray-400">
            Password: 8-64 characters with an uppercase letter, a lowercase letter, a digit and a special character.
          </p>

          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#0F3D2E]"
            />
            <span className="text-xs leading-5 text-gray-700">
              I consent to receive OTPs and service-related notifications on my mobile number for authentication and
              official duty communication.<span className="text-red-500"> *</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !hasConsent}
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
