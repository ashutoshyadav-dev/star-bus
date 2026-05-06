import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, ShieldCheck, ScrollText,
  Ticket, CreditCard, RotateCcw, Wallet, LogOut,
  Bus, Route, MapPin, Layers, QrCode, ChevronDown,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { useState } from "react";

const navItems = [
  { label: "Dashboard",        path: "/admin/dashboard",      icon: LayoutDashboard },
  { label: "Users",            path: "/admin/users",          icon: Users,       perm: "user:view" },
  { label: "Roles",            path: "/admin/roles",          icon: ShieldCheck, perm: "role:manage" },
  { label: "Audit Logs",       path: "/admin/audit",          icon: ScrollText,  perm: "audit:view" },
  { label: "Bookings",         path: "/admin/bookings",       icon: Ticket,      perm: "booking:view_all" },
  { label: "Payments",         path: "/admin/payments",       icon: CreditCard,  perm: "payment:view" },
  { label: "Refunds",          path: "/admin/refunds",        icon: RotateCcw,   perm: "refund:manage" },
  { label: "Wallet",           path: "/admin/wallet",         icon: Wallet },
  { label: "Route Management", path: "/admin/routes",         icon: Route },
  { label: "Bus Management",   path: "/admin/buses",          icon: Bus },
  { label: "Bus Stops",        path: "/admin/stops",          icon: MapPin },
  { label: "Ticket Types",     path: "/admin/tickets",        icon: Ticket },
  { label: "QR Management",    path: "/admin/qr",             icon: QrCode },
];

const masterItems = [
  { label: "Depots",    path: "/admin/depot",    icon: Layers },
  { label: "Stations",  path: "/admin/stations", icon: MapPin },
];

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [masterOpen, setMasterOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter((item) => !item.perm || hasPermission(item.perm));

  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#0c1f2c] border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
        <img src={logo} alt="APSTS" className="w-9 h-9 rounded-full object-cover" />
        <div>
          <p className="text-sm font-bold text-white leading-tight">APSTS</p>
          <p className="text-[10px] text-gray-400">Admin Portal v4.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5 text-sm">
        {visibleItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-orange-500/20 text-orange-400 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Master Management accordion */}
        <button
          onClick={() => setMasterOpen((o) => !o)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-3">
            <Layers className="w-4 h-4" /> Master Management
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${masterOpen ? "rotate-180" : ""}`}
          />
        </button>
        {masterOpen &&
          masterItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg transition-colors text-xs ${
                  isActive
                    ? "bg-orange-500/20 text-orange-400 font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </NavLink>
          ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {(user?.name ?? user?.phone ?? "U").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">
              {user?.name ?? user?.phone ?? "Admin"}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {user?.roles?.[0] ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
