import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Ticket, ListChecks, LogOut, ClipboardList } from "lucide-react";

export default function CounterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Counter — Ticket Booking</h1>
          <p className="text-sm text-gray-500">Logged in as {user?.fullName ?? user?.phoneNumber ?? "Counter Staff"}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <button
          onClick={() => navigate("/counter/book")}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md hover:border-blue-300 transition"
        >
          <Ticket className="text-blue-600 mb-3" size={28} />
          <div className="font-semibold text-gray-800 text-lg">New Booking</div>
          <div className="text-sm text-gray-500 mt-1">Search a bus, pick seats, and collect cash or UPI payment for a walk-in passenger.</div>
        </button>

        <button
          onClick={() => navigate("/counter/my-bookings")}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md hover:border-blue-300 transition"
        >
          <ListChecks className="text-green-600 mb-3" size={28} />
          <div className="font-semibold text-gray-800 text-lg">My Bookings</div>
          <div className="text-sm text-gray-500 mt-1">Every ticket you've sold — for end-of-shift cash reconciliation.</div>
        </button>

         <button
          onClick={() => navigate("/counter/duty")}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md hover:border-blue-300 transition"
        >
          <ClipboardList className="text-orange-600 mb-3" size={28} />
          <div className="font-semibold text-gray-800 text-lg">Duty Roster</div>
          <div className="text-sm text-gray-500 mt-1">Assign a driver and conductor to each trip and share the trip chart with passengers.</div>
        </button>
      </div>
    </div>
  );
}