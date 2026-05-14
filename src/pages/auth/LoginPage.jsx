import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // ← added useSearchParams
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Spinner from "../../components/common/Spinner";
import BusImage from "../../assets/bus.png";
import logo from "../../assets/logo.png";

const ADMIN_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DEPOT_MANAGER", "STAFF"];

const MODES = [
  { key: "login",    label: "Passenger Login" },
  { key: "register", label: "Register" },
  { key: "staff",    label: "Staff / Admin" },
];

export default function LoginPage() {
  const [mode, setMode]           = useState("login");
  const [step, setStep]           = useState(1);
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [otp, setOtp]             = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [otpTimer, setOtpTimer]   = useState(0);

  const { saveTokens } = useAuth();
  const navigate = useNavigate();

  // ── Read redirect param ──────────────────────────────────────────────────
  const [searchParams] = useSearchParams();                          // ← added
  const redirectTo = searchParams.get("redirect");                   // ← added

  const fullPhone = `+91${phone}`;

  // ── Start OTP countdown timer ────────────────────────────────────────────
  const startTimer = () => {
    setOtpTimer(60);
    const interval = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Redirect based on roles ──────────────────────────────────────────────
  const redirect = (userData) => {                                   // ← updated
    const isAdminUser = userData?.roles?.some((r) =>
      ADMIN_ROLES.includes(r.toUpperCase())
    );

    // Honor redirect param — only allow internal paths (security: prevent open redirect)
    if (redirectTo && redirectTo.startsWith("/")) {
      navigate(redirectTo, { replace: true });
      return;
    }

    navigate(isAdminUser ? "/admin/dashboard" : "/user/dashboard", { replace: true });
  };

  // ── Build merged user object from auth response ──────────────────────────
  const buildUserData = (res) => ({
    ...res.user,
    roles: res.roles ?? [],
    accountType: res.accountType,
    permissions: res.permissions ?? [],
  });

  // ── Step 1: Request OTP ──────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) return toast.error("Enter a valid 10-digit mobile number");
    setLoading(true);
    try {
      const purpose = mode === "register" ? "registration" : "login";
      const { data } = await authApi.requestOtp({
        phone: fullPhone,
        purpose,
        channel: "sms",
      });
      setRequestId(data?.data?.requestId ?? "");
      toast.success(`OTP sent to +91 ${phone}`);
      setStep(2);
      startTimer();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP (login or register) ───────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return toast.error("Enter the OTP you received");
    setLoading(true);
    const payload = { phone: fullPhone, otp, requestId };
    try {
      let response;
      if (mode === "register") {
        response = await authApi.registerPassenger(payload);
      } else {
        try {
          response = await authApi.loginWithOtp(payload);
          console.log("auth response", response);
        } catch (loginErr) {
          const status  = loginErr?.response?.status;
          const message = (loginErr?.response?.data?.message ?? "").toLowerCase();
          const isNewUser =
            status === 404 ||
            message.includes("not found") ||
            message.includes("not register") ||
            message.includes("no account") ||
            message.includes("does not exist");

          if (!isNewUser) throw loginErr;

          const toastId = toast.loading("Creating your account…");
          await authApi.registerPassenger(payload);
          toast.dismiss(toastId);
          response = await authApi.loginWithOtp(payload);
        }
      }

      const res = response.data.data;
      const userData = buildUserData(res);
      saveTokens(res.accessToken, res.refreshToken, userData);
      toast.success(mode === "register" ? "Account created! Welcome aboard." : "Login successful!");
      redirect(userData);
    } catch (err) {
      toast.error(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Staff / Admin login (phone + password) ───────────────────────────────
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return toast.error("Enter a valid 10-digit mobile number");
    if (!password) return toast.error("Enter your password");
    setLoading(true);
    try {
      const { data } = await authApi.loginStaff({ phone: fullPhone, password });
      const res = data.data;
      console.log("staff/admin", res);
      const userData = buildUserData(res);
      saveTokens(res.accessToken, res.refreshToken, userData);
      toast.success("Welcome back!");
      redirect(userData);
      console.log("USER PERMISSIONS:", userData.permissions);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setStep(1);
    setOtp("");
    setRequestId("");
    setOtpTimer(0);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center lg:justify-end bg-cover bg-center relative px-4 sm:px-6 lg:px-16"
      style={{ backgroundImage: `url(${BusImage})`, backgroundPosition: "center 85%" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Logo – top left */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0 flex items-center gap-3 text-white z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg">
          <img src={logo} alt="APSTS" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg lg:text-2xl font-semibold leading-tight">
            Online Bus Reservation
          </h1>
          <p className="text-xs opacity-80">& Transport Management System</p>
        </div>
      </div>

      {/* Back To Home Button */}
      <button
        onClick={() => navigate("/ap")}
        className="
          absolute top-6 right-4 sm:right-6 lg:right-10
          z-20 px-4 py-2 rounded-xl
          bg-white/10 backdrop-blur-md border border-white/20
          text-white text-sm font-medium
          hover:bg-white/20 transition-all duration-200 shadow-lg
        "
      >
        ← Back to Home
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/96 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 mt-24 lg:mt-0">
        <h2 className="text-2xl font-bold text-center text-[#0F3D2E] mb-1">
          {mode === "register" ? "Create Account" : "Welcome Back!"}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-5">
          {mode === "register"
            ? "Register to start your journey"
            : "Login using OTP or Staff Password"}
        </p>

        {/* Redirect hint — show where user will land after login */}
        {redirectTo && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-700 text-center">
            Login to continue your booking
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-5 gap-1">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === key
                  ? "bg-[#0F3D2E] text-white shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Phone input (all modes) */}
        <div className="flex items-center border border-gray-300 rounded-xl mb-4 overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3D2E]">
          <span className="px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 border-r select-none">
            +91
          </span>
          <input
            type="tel"
            placeholder="Enter 10-digit Mobile Number"
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2.5 text-sm outline-none text-gray-800"
          />
        </div>

        {/* ── OTP / Register Flow ── */}
        {(mode === "login" || mode === "register") && (
          <>
            {step === 1 ? (
              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full bg-[#0F3D2E] hover:bg-[#0c2e22] text-white py-2.5 rounded-xl mb-3 flex justify-center items-center font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? <Spinner size="sm" /> : "Send OTP"}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className="text-xs text-gray-500">
                  OTP sent to{" "}
                  <span className="font-semibold text-gray-700">+91 {phone}</span>
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm tracking-widest font-mono outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(""); }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Change number
                  </button>
                  {otpTimer > 0 ? (
                    <span className="text-gray-400">Resend in {otpTimer}s</span>
                  ) : (
                    <span
                      onClick={handleRequestOtp}
                      className="text-[#0F3D2E] cursor-pointer hover:underline font-medium"
                    >
                      Resend OTP
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl flex justify-center items-center font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : mode === "register" ? (
                    "Verify & Register"
                  ) : (
                    "Verify & Login"
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Staff Login ── */}
        {mode === "staff" && (
          <form onSubmit={handleStaffLogin} className="space-y-3">
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl flex justify-center items-center font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? <Spinner size="sm" /> : "Login"}
            </button>
          </form>
        )}

        {/* Register / Login link */}
        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-600">
          {mode === "register" ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => switchMode("login")}
                className="text-orange-500 font-semibold cursor-pointer hover:underline"
              >
                Login Here
              </span>
            </>
          ) : (
            <>
              New User?{" "}
              <span
                onClick={() => switchMode("register")}
                className="text-orange-500 font-semibold cursor-pointer hover:underline"
              >
                Register Here
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}