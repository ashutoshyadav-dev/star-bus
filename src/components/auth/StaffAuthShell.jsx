import { useNavigate } from "react-router-dom";
import BusImage from "../../assets/bus.png";
import logo from "../../assets/logo.png";

/** Shared page frame for the staff login / registration pages (separate from the passenger page). */
export default function StaffAuthShell({ title, subtitle, children, wide = false }) {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative px-4 py-24 sm:px-6"
      style={{ backgroundImage: `url(${BusImage})`, backgroundPosition: "center 85%" }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute top-6 left-4 sm:left-10 flex items-center gap-3 text-white z-10">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
          <img src={logo} alt="APSTS" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-semibold leading-tight">APSTS Staff Portal</h1>
          <p className="text-xs opacity-80">Authorised personnel only</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/home")}
        className="absolute top-6 right-4 sm:right-10 z-20 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md
          border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all shadow-lg"
      >
        ← Back to Home
      </button>

      <div
        className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-md"} bg-white/96 backdrop-blur-lg
          rounded-2xl shadow-2xl p-6 sm:p-8`}
      >
        <h2 className="text-2xl font-bold text-center text-[#0F3D2E] mb-1">{title}</h2>
        {subtitle && <p className="text-center text-gray-500 text-sm mb-5">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
