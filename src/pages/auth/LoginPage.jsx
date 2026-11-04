import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/auth";
import BusImage from "../../assets/bus.png";
import logo from "../../assets/logo.png";
import Spinner from "../../components/common/Spinner";
import CaptchaBox from "../../components/common/CaptchaBox";
import { useAuth } from "../../context/AuthContext";
import { useOtpTimer } from "../../hooks/useOtpTimer";
import { classifyRole, dutyHome } from "../../constants/roles";
import { filters, validators } from "../../utils/validators";

const MODES = [
  { key: "login",    label: "Passenger Login" },
  { key: "register", label: "Register" },
];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(() => (searchParams.get("mode") === "register" ? "register" : "login"));
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Captcha state ─────────────────────────────────────────────────────────
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

  const { saveTokens } = useAuth();
  const navigate = useNavigate();
  const redirectTo = searchParams.get("redirect");

  // Old links (?mode=staff) now land on the separate staff page
  useEffect(() => {
    if (searchParams.get("mode") === "staff") navigate("/staff/login", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { timer: otpTimer, start: startTimer, reset: resetTimer } = useOtpTimer(60);

  const fullPhone = `+91${phone}`;
  const otpPurpose = mode === "register" ? "registration" : "login";

  const handleRedirect = (userData) => {
    const roleClass = classifyRole(userData?.roles ?? []);
    // Only allow internal paths to prevent open-redirect attacks
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      navigate(redirectTo, { replace: true });
      return;
    }
    const target =
      roleClass === "admin"      ? "/admin/dashboard" :
      roleClass === "duty_staff" ? dutyHome(userData?.roles ?? []) :
      roleClass === "counter"    ? "/counter/dashboard" :
                                   "/user/dashboard";
    navigate(target, { replace: true });
  };

  const buildUserData = (res) => ({
    ...res.user,
    roles: res.roles ?? [],
    accountType: res.accountType,
    permissions: res.permissions ?? [],
  });

  const switchMode = (m) => {
    setMode(m);
    setStep(1);
    setOtp("");
    setRequestId("");
    setHasConsent(false);
    setShowConsentError(false);
    setErrors({});
    resetTimer();
    loadCaptcha();
  };

  // Unlock the number (Change number): clears OTP + resend timer, needs a new captcha
  const changeNumber = () => {
    setStep(1);
    setOtp("");
    setRequestId("");
    resetTimer();
    loadCaptcha();
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    const errs = {
      phone: validators.mobile(phone),
      captcha: validators.captcha(captchaAnswer),
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await authApi.requestOtp({
        phone: fullPhone,
        purpose: otpPurpose,
        channel: "sms",
        captchaId,
        captchaAnswer,
      });
      setRequestId(data?.data?.requestId ?? "");
      toast.success(`OTP sent to +91 ${phone}`);
      setStep(2);
      startTimer();
    } catch {
      // the axios interceptor already shows the server message
    } finally {
      setLoading(false);
      loadCaptcha(); // captcha is single-use
    }
  };

  const handleResendClick = () => {
    changeNumber();
    toast("Solve the captcha to resend the OTP", { id: "resend-hint" });
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpErr = validators.otp(otp);
    if (otpErr) return toast.error(otpErr);
    if (mode === "register" && !hasConsent) {
      setShowConsentError(true);
      return;
    }
    setLoading(true);

    const payload = {
      phone: fullPhone,
      otp,
      requestId,
      purpose: otpPurpose,
      hasConsent: mode === "register" ? hasConsent : null,
    };

    try {
      let response;

      if (mode === "register") {
        // Pure registration. If already registered, backend returns 409.
        response = await authApi.registerPassenger(payload);
      } else {
        // Pure login. Never silently create an account.
        try {
          response = await authApi.loginWithOtp(payload);
        } catch (loginErr) {
          const status = loginErr?.response?.status;
          const message = (loginErr?.response?.data?.message ?? "").toLowerCase();
          const isNotRegistered =
            status === 404 ||
            message.includes("not found") ||
            message.includes("no account") ||
            message.includes("register first");

          if (isNotRegistered) {
            switchMode("register");
            return;
          }
          throw loginErr;
        }
      }

      const res = response.data.data;
      const userData = buildUserData(res);
      saveTokens(res.accessToken, res.refreshToken, userData);
      toast.success(mode === "register" ? "Account created! Welcome aboard." : "Login successful!");
      handleRedirect(userData);
    } catch {
      // the axios interceptor already toasts the server message (no second toast here)
    } finally {
      setLoading(false);
    }
  };

  const clearErr = (k) => setErrors((p) => ({ ...p, [k]: "" }));

  return (
    <div
      className="min-h-screen flex items-center justify-center lg:justify-end bg-cover bg-center relative px-4 sm:px-6 lg:px-16"
      style={{ backgroundImage: `url(${BusImage})`, backgroundPosition: "center 85%" }}
    >
      <div className="absolute inset-0 bg-black/50" />

      {/* Logo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0 flex items-center gap-3 text-white z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg">
          <img src={logo} alt="APSTS" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg lg:text-2xl font-semibold leading-tight">Online Bus Reservation</h1>
          <p className="text-xs opacity-80">& Transport Management System</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/home")}
        className="absolute top-6 right-4 sm:right-6 lg:right-10 z-20 px-4 py-2 rounded-xl
          bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium
          hover:bg-white/20 transition-all duration-200 shadow-lg"
      >
        ← Back to Home
      </button>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/96 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 mt-24 lg:mt-0">
        <h2 className="text-2xl font-bold text-center text-[#0F3D2E] mb-1">
          {mode === "register" ? "Create Account" : "Welcome Back!"}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-5">
          {mode === "register" ? "Register to start your journey" : "Login with your mobile number and OTP"}
        </p>

        {redirectTo && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-700 text-center">
            Login to continue your booking
          </div>
        )}

        <div className="flex rounded-xl bg-gray-100 p-1 mb-5 gap-1">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === key ? "bg-[#0F3D2E] text-white shadow" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Phone — locked while the OTP is pending (item 24) */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Mobile number<span className="text-red-500"> *</span>
          </label>
          <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3D2E] ${errors.phone ? "border-red-400" : "border-gray-300"}`}>
            <span className="px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 border-r select-none">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter 10-digit Mobile Number"
              value={phone}
              maxLength={10}
              readOnly={step === 2}
              onChange={(e) => { setPhone(filters.digits(e.target.value, 10)); clearErr("phone"); }}
              className={`w-full px-3 py-2.5 text-sm outline-none text-gray-800 ${step === 2 ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {step === 2 && (
              <button
                type="button"
                onClick={changeNumber}
                className="px-3 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
              >
                Change number
              </button>
            )}
          </div>
          {errors.phone && <p role="alert" className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        {step === 1 ? (
          <>
            <div className="mb-3">
              <CaptchaBox
                image={captchaImage}
                value={captchaAnswer}
                onChange={(v) => { setCaptchaAnswer(v); clearErr("captcha"); }}
                onRefresh={loadCaptcha}
                loading={captchaLoading}
              />
              {errors.captcha && <p role="alert" className="mt-1 text-xs text-red-500">{errors.captcha}</p>}
            </div>
            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full bg-[#0F3D2E] hover:bg-[#0c2e22] text-white py-2.5 rounded-xl mb-3 flex justify-center items-center font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? <Spinner size="sm" /> : "Send OTP"}
            </button>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <p className="text-xs text-gray-500">
              OTP sent to <span className="font-semibold text-gray-700">+91 {phone}</span>
            </p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(filters.digits(e.target.value, 6))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm tracking-widest font-mono outline-none focus:ring-2 focus:ring-[#0F3D2E]"
            />

            {mode === "register" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => { setHasConsent(e.target.checked); setShowConsentError(false); }}
                    className="mt-1 h-4 w-4 accent-[#0F3D2E]"
                  />
                  <span className="text-xs text-gray-700 leading-5">
                    I hereby provide my consent to receive OTPs and service-related notifications on WhatsApp for
                    authentication, booking confirmation, cancellation, refund and other services.
                    <span className="text-red-500"> *</span>
                  </span>
                </label>
                {showConsentError && !hasConsent && (
                  <p className="mt-2 text-xs text-red-600">Please provide your consent to continue with registration.</p>
                )}
              </div>
            )}

            <div className="flex justify-end items-center text-xs">
              {otpTimer > 0 ? (
                <span className="text-gray-500">Resend in {otpTimer}s</span>
              ) : (
                <button type="button" onClick={handleResendClick} className="text-[#0F3D2E] hover:underline font-medium">
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl flex justify-center items-center font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? <Spinner size="sm" /> : mode === "register" ? "Verify & Register" : "Verify & Login"}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-600">
          {mode === "register" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => switchMode("login")} className="text-orange-500 font-semibold hover:underline">
                Login Here
              </button>
            </>
          ) : (
            <>
              New User?{" "}
              <button onClick={() => switchMode("register")} className="text-orange-500 font-semibold hover:underline">
                Register Here
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}