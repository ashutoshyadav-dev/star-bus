import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0F3D2E] flex flex-col items-center justify-center text-white px-4 text-center">
      <img src={logo} alt="APSTS" className="w-16 h-16 rounded-full mb-6 border-2 border-white/30" />
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-gray-300 mb-8 max-w-md">
        You do not have permission to access this page.
        {user && ` You are logged in as ${user?.name ?? user?.phone}.`}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/user/dashboard")}
          className="px-6 py-2.5 border border-white/30 rounded-xl hover:bg-white/10 transition"
        >
          My Dashboard
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
