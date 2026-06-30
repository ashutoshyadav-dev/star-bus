import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NavLink } from "react-router-dom";
import {
  FiHome, FiCreditCard, FiSearch, FiUser,
  FiHeadphones, FiMenu, FiLogOut,
} from "react-icons/fi";
import NotificationPanel, { NotificationBell } from "./NotificationPanel";
import { notificationApi } from "../../api/notificationApi";
import logo from "../../assets/logo.png";

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ isOpen }) {
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
        <NavLink to="/user/dashboard"   className={linkClass}>
          <FiHome className="text-lg flex-shrink-0" />
          {isOpen && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/user/profile"     className={linkClass}>
          <FiUser className="text-lg flex-shrink-0" />
          {isOpen && <span>Profile</span>}
        </NavLink>
        <NavLink to="/user/my-bookings" className={linkClass}>
          <FiCreditCard className="text-lg flex-shrink-0" />
          {isOpen && <span>My Bookings</span>}
        </NavLink>
        <NavLink to="/user/book-ticket" className={linkClass}>
          <FiSearch className="text-lg flex-shrink-0" />
          {isOpen && <span>Book Ticket</span>}
        </NavLink>
        <NavLink to="/user/my-refunds"  className={linkClass}>
          <FiCreditCard className="text-lg flex-shrink-0" />
          {isOpen && <span>Refunds</span>}
        </NavLink>
        <NavLink to="/user/wallet"      className={linkClass}>
          <FiUser className="text-lg flex-shrink-0" />
          {isOpen && <span>Wallet</span>}
        </NavLink>
        <NavLink to="/user/helpdesk"    className={linkClass}>
          <FiHeadphones className="text-lg flex-shrink-0" />
          {isOpen && <span>Helpdesk</span>}
        </NavLink>
        <NavLink to="/user/all-grievance" className={linkClass}>
          <FiHeadphones className="text-lg flex-shrink-0" />
          {isOpen && <span>All Grievances</span>}
        </NavLink>
      </nav>
    </div>
  );
}

// ── TopNavbar ─────────────────────────────────────────────────────────────────

function TopNavbar({ toggleSidebar, user, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Single source of truth for unread count ───────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef(null);

  // Fetch unread count on mount + poll every 30 s
  useEffect(() => {
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
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Called by NotificationPanel after optimistic mark-read.
   * delta = -1 (single read) or -N (mark all read) or +N (rollback on error).
   * Clamps at 0 so badge never goes negative.
   */
  const handleCountChange = (delta) => {
    setUnreadCount((c) => Math.max(0, c + delta));
  };

  return (
    <div className="fixed top-0 left-0 w-full z-30 shadow px-4 py-2 flex justify-between items-center bg-gradient-to-r from-[#163F2D] via-[#081935] to-[#163F2D] text-white">

      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-xl text-gray-300 hover:text-orange-400 transition"
        >
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

      {/* Right: bell + user chip + logout */}
      <div className="flex items-center gap-3">

        {/* Notification bell + dropdown */}
        <div ref={notificationRef} className="relative">
          <NotificationBell
            unreadCount={unreadCount}
            onClick={() => setShowNotifications((prev) => !prev)}
          />

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 shadow-2xl">
              <NotificationPanel
                unreadCount={unreadCount}
                onCountChange={handleCountChange}
              />
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
          <FiUser />
          <span className="text-xs hidden sm:block">
            {user?.name ?? user?.phone ?? "Passenger"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="text-lg text-gray-300 hover:text-red-400 transition"
          title="Logout"
        >
          <FiLogOut />
        </button>
      </div>
    </div>
  );
}

// ── UserLayout ────────────────────────────────────────────────────────────────

export default function UserLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const noPaddingRoutes = ["/user/book-ticket", "/user/search-results"];
  const isNoPadding = noPaddingRoutes.some((r) => pathname.includes(r));

  const handleLogout = async () => {
    await logout();
    navigate("/home/login");
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={isOpen} />

      <div className={`flex-1 min-h-screen transition-all duration-300 ${isOpen ? "ml-60" : "ml-16"}`}>
        <TopNavbar
          toggleSidebar={() => setIsOpen((o) => !o)}
          user={user}
          onLogout={handleLogout}
        />
        <div className={isNoPadding ? "pt-14" : "pt-14 p-6"}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
