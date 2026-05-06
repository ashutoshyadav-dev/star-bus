import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Settings, UserCircle } from "lucide-react";
import logo from "../../assets/logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-[240px] right-0 z-30 h-[64px] bg-[#0c1f2c] border-b border-white/10 flex items-center justify-between px-6">
      {/* Left: breadcrumb / title area */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="APSTS" className="w-7 h-7 rounded-full object-cover" />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">
            Arunachal Pradesh State Transport Services
          </p>
          <p className="text-[10px] text-gray-400">Admin Dashboard</p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
          <UserCircle className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-gray-200 font-medium">
            {user?.name ?? user?.phone ?? "Admin"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
