import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

export default function ConductorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onScanScreen = location.pathname.startsWith("/conductor/scan");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Same gradient + logo as the passenger SeatNavbar — same brand, mobile-first shape */}
      <div className="fixed top-0 left-0 w-full z-40 flex items-center justify-between
        px-4 py-2.5 bg-gradient-to-r from-[#163F2D] via-[#081935] to-[#163F2D]
        text-white shadow-lg h-14">
        <div className="flex items-center gap-3">
          {onScanScreen ? (
            <button onClick={() => navigate("/conductor/duty")} className="p-1">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <img src={logo} alt="APSTS"
                 className="w-8 h-8 rounded-full object-cover border border-white/30" />
          )}
          <div className="leading-tight">
            <p className="text-sm font-semibold">
              {onScanScreen ? "Scanning" : "Arunachal Pradesh State Transport"}
            </p>
            <p className="text-[10px] text-gray-300">
              {user?.fullName ?? "Conductor"}
            </p>
          </div>
        </div>
        <button onClick={logout}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full
                  bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 transition">
          <LogOut size={16} />
        </button>
      </div>
      <div className="pt-14">
        <Outlet />
      </div>
    </div>
  );
}