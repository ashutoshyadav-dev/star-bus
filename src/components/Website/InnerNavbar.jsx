import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function InnerNavbar() {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-gradient-to-r from-[#081935] via-[#0F2D2F] to-[#163F2D] text-white shadow-lg">
      {/* Top strip */}
      <div className="flex justify-between items-center px-8 py-1.5 text-xs bg-black/20 border-b border-white/10">
        <span>Arunachal Pradesh State Transport Services</span>
        <span>Version 4.0</span>
      </div>
      {/* Main bar */}
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="APSTS" className="w-9 h-9 rounded-full object-cover border border-white/30" />
          <div>
            <p className="text-sm font-semibold leading-tight">APSTS Online Portal</p>
            <p className="text-[10px] text-gray-300">Arunachal Pradesh</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/user/helpdesk")}
            className="px-4 py-1.5 text-sm bg-orange-500/80 hover:bg-orange-500 rounded-full transition-colors"
          >
            Helpdesk
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-colors"
          >
            Login / Register
          </button>
        </div>
      </div>
    </div>
  );
}
