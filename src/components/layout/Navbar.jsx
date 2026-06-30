import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Settings, UserCircle } from "lucide-react";
import AdminNotificationPanel from "../../pages/notification/AdminNotificationPanel";
import { notificationApi } from "../../api/notificationApi";
import logo from "../../assets/logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Single source of truth for unread count ───────────────────────────────
  const [unreadCount,       setUnreadCount]       = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Fetch on mount, then poll every 30 s
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

  // Close panel on outside click
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
   * Called by AdminNotificationPanel after optimistic mark-read.
   * delta = -1 (single) | -N (mark all) | +N (rollback).
   * Clamps at 0 so badge never goes negative.
   */
  const handleCountChange = (delta) => {
    setUnreadCount((c) => Math.max(0, c + delta));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/home/login");
  };

  return (
    <header className="fixed top-0 left-[240px] right-0 z-30 h-[64px] bg-[#0c1f2c] border-b border-white/10 flex items-center justify-between px-6">

      {/* Left: logo + title */}
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
      <div className="flex items-center gap-2">

        {/* ── Notification bell + dropdown ── */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[52px] z-50 shadow-2xl">
              <AdminNotificationPanel
                unreadCount={unreadCount}
                onCountChange={handleCountChange}
              />
            </div>
          )}
        </div>

        {/* Settings */}
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

        {/* Logout */}
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
