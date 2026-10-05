import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMenu, FiLogOut, FiUser } from "react-icons/fi";
import NotificationPanel, { NotificationBell } from "../customer/NotificationPanel";
import { notificationApi } from "../../api/notificationApi";
import logo from "../../assets/logo.png";

function StaffSidebar({ isOpen, navItems }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-sm ${
      isActive
        ? "bg-orange-500 text-white font-semibold shadow"
        : "hover:bg-white/10 text-gray-300 hover:text-white border-b border-white/5 pb-2"
    }`;

  return (
    <div
      className={`h-screen fixed top-14 left-0 text-white p-4 transition-all duration-300 z-20
        bg-gradient-to-b from-[#081935] via-[#0F2D2F] to-[#163F2D]
        ${isOpen ? "w-60" : "w-16"}`}
    >
      <nav className="flex flex-col gap-2 mt-4">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end className={linkClass}>
            <span className="text-lg flex-shrink-0">{icon}</span>
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function StaffTopNavbar({ toggleSidebar, user, onLogout, roleLabel, showNotifications }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (!showNotifications) return;
    const fetchCount = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        setUnreadCount((res.data?.data ?? res.data)?.unreadCount ?? 0);
      } catch {
        // silent — stale badge is better than a broken navbar
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountChange = (delta) => {
    setUnreadCount((c) => Math.max(0, c + delta));
  };

  return (
    <div className="fixed top-0 left-0 w-full z-30 shadow px-4 py-2 flex justify-between items-center bg-gradient-to-r from-[#163F2D] via-[#081935] to-[#163F2D] text-white">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-xl text-gray-300 hover:text-orange-400 transition">
          <FiMenu />
        </button>
        <div className="flex items-center gap-3">
          <img src={logo} alt="APSTS" className="w-9 h-9 rounded-full object-cover" />
          <div className="leading-tight hidden sm:block">
            <h2 className="text-sm font-semibold">Arunachal Pradesh State Transport</h2>
            <p className="text-[10px] text-gray-300">Online Bus Booking Portal</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showNotifications && (
          <div ref={notificationRef} className="relative">
            <NotificationBell unreadCount={unreadCount} onClick={() => setPanelOpen((p) => !p)} />
            {panelOpen && (
              <div className="absolute right-0 top-12 z-50 shadow-2xl">
                <NotificationPanel unreadCount={unreadCount} onCountChange={handleCountChange} />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
          <FiUser />
          <span className="text-xs hidden sm:block">
            {user?.fullName ?? user?.phoneNumber ?? roleLabel}
          </span>
        </div>

        <button onClick={onLogout} className="text-lg text-gray-300 hover:text-red-400 transition" title="Logout">
          <FiLogOut />
        </button>
      </div>
    </div>
  );
}

export default function StaffLayoutBase({ navItems, roleLabel, showNotifications = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/home/login");
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <StaffSidebar isOpen={isOpen} navItems={navItems} />

      <div className={`flex-1 min-h-screen transition-all duration-300 ${isOpen ? "ml-60" : "ml-16"}`}>
        <StaffTopNavbar
          toggleSidebar={() => setIsOpen((o) => !o)}
          user={user}
          onLogout={handleLogout}
          roleLabel={roleLabel}
          showNotifications={showNotifications}
        />
        <div className="pt-14">
          <Outlet />
        </div>
      </div>
    </div>
  );
}