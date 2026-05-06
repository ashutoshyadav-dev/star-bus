import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiX } from "react-icons/fi";

const bookingsData = [
  { booking_id: "BK101", route: { from: "Itanagar", to: "Guwahati" },    journey_date: "25 May, 2026 • 08:00 PM", seat_no: "A1, A2", status: "Upcoming",  amount: "₹2,400" },
  { booking_id: "BK102", route: { from: "Naharlagun", to: "Tezpur" },   journey_date: "18 May, 2026 • 07:30 AM", seat_no: "B1, B2", status: "Completed", amount: "₹1,800" },
  { booking_id: "BK103", route: { from: "Itanagar", to: "Ziro" },       journey_date: "10 May, 2026 • 06:00 AM", seat_no: "C1",     status: "Cancelled", amount: "₹900" },
  { booking_id: "BK104", route: { from: "Pasighat", to: "Itanagar" },   journey_date: "05 May, 2026 • 05:30 AM", seat_no: "D3",     status: "Completed", amount: "₹1,200" },
];

const STATUS_STYLES = {
  Upcoming:  "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-600",
};

export default function MyBookings() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All"
    ? bookingsData
    : bookingsData.filter((b) => b.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage all your trips</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {["All", "Upcoming", "Completed", "Cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === s ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border">
          No bookings found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.booking_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Route */}
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  {b.route.from} <FiArrowRight className="text-orange-500" /> {b.route.to}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[b.status]}`}>
                  {b.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-500">
                <div><p className="text-xs text-gray-400">Booking ID</p><p className="font-medium text-gray-700">{b.booking_id}</p></div>
                <div><p className="text-xs text-gray-400">Date & Time</p><p className="font-medium text-gray-700">{b.journey_date}</p></div>
                <div><p className="text-xs text-gray-400">Seats</p><p className="font-medium text-gray-700">{b.seat_no}</p></div>
                <div><p className="text-xs text-gray-400">Amount</p><p className="font-medium text-gray-700">{b.amount}</p></div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/user/booking/${b.booking_id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                >
                  <FiEye /> View Details
                </button>
                {b.status === "Upcoming" && (
                  <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">
                    <FiX /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
