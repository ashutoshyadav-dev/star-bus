import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import CaptchaBox from "../../components/common/CaptchaBox";
import PasswordInput from "../../components/common/PasswordInput";
import Spinner from "../../components/common/Spinner";
import StaffAuthShell from "../../components/auth/StaffAuthShell";
import { useAuth } from "../../context/AuthContext";
import { adminHome, classifyRole, dutyHome } from "../../constants/roles";
import { validators, filters } from "../../utils/validators";

const ErrorText = ({ children }) =>
  children ? <p role="alert" className="mt-1 text-xs text-red-500">{children}</p> : null;

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { saveTokens } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleRedirect = (userData) => {
    const roles = userData?.roles ?? [];
    const roleClass = classifyRole(roles);
    const target =
      roleClass === "admin"      ? adminHome(roles) :
      roleClass === "duty_staff" ? dutyHome(roles) :
      roleClass === "counter"    ? "/counter/dashboard" :
                                   "/user/dashboard";
    navigate(target, { replace: true });
  };

  const clearErr = (k) => setErrors((p) => ({ ...p, [k]: "" }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(false);

    // ALL problems are reported together; a captcha message never hides a mobile error (item 15)
    const errs = {
      phone: validators.mobile(phone),
      password: password ? "" : "Password is required",
      captcha: validators.captcha(captchaAnswer),
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await authApi.loginStaff({
        phone: `+91${phone}`,
        password,
        captchaId,
        captchaAnswer,
      });
      const res = data.data;
      const userData = {
        ...res.user,
        roles: res.roles ?? [],
        accountType: res.accountType,
        permissions: res.permissions ?? [],
      };
      saveTokens(res.accessToken, res.refreshToken, userData);
      toast.success("Welcome back!");
      handleRedirect(userData);
    } catch (err) {
      const code = err?.response?.data?.code ?? err?.response?.data?.errorCode;
      const msg = err?.response?.data?.message || "Login failed. Check your credentials.";
      if (code === "STAFF_PENDING_APPROVAL" || /awaiting approval/i.test(msg)) setPending(true);
      // the axios interceptor already toasts every non-401 error; 401 (bad credentials) is silent there
      else if (err?.response?.status === 401) toast.error(msg);
    } finally {
      setLoading(false);
      loadCaptcha(); // captcha is single-use
    }
  };

  return (
    <StaffAuthShell title="Staff / Admin Login" subtitle="Sign in with your registered mobile number and password">
      {pending && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Your registration is awaiting approval. You can log in once an administrator has assigned your role.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F3D2E] ${errors.phone ? "border-red-400" : "border-gray-300"}`}>
            <span className="px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 border-r select-none">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number *"
              value={phone}
              maxLength={10}
              onChange={(e) => { setPhone(filters.digits(e.target.value, 10)); clearErr("phone"); }}
              className="w-full px-3 py-2.5 text-sm outline-none text-gray-800"
              autoComplete="username"
            />
          </div>
          <ErrorText>{errors.phone}</ErrorText>
        </div>

        <div>
          <div className="relative">
            <PasswordInput
              type={showPass ? "text" : "password"}
              placeholder="Password *"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearErr("password"); }}
              className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#0F3D2E] ${errors.password ? "border-red-400" : "border-gray-300"}`}
              autoComplete="current-password"
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
          <ErrorText>{errors.password}</ErrorText>
        </div>

        <div>
          <CaptchaBox
            image={captchaImage}
            value={captchaAnswer}
            onChange={(v) => { setCaptchaAnswer(v); clearErr("captcha"); }}
            onRefresh={loadCaptcha}
            loading={captchaLoading}
          />
          <ErrorText>{errors.captcha}</ErrorText>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F3D2E] hover:bg-[#0c2e22] text-white py-2.5 rounded-xl flex justify-center items-center font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" /> : "Login"}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-600 space-y-1">
        <p>
          New staff member?{" "}
          <Link to="/staff/register" className="text-orange-500 font-semibold hover:underline">
            Register here
          </Link>
        </p>
        <p className="text-xs text-gray-500">
          Passenger?{" "}
          <Link to="/home/login" className="hover:underline">
            Go to passenger login
          </Link>
        </p>
      </div>
    </StaffAuthShell>
  );
}
