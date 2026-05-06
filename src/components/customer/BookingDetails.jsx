import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiMapPin } from "react-icons/fi";

const DUMMY_BOOKINGS = {
  BK101: { pnr: "APS123456", from: "Itanagar", to: "Guwahati",   date: "25 May 2026", time: "06:00 PM", bus: "Volvo AC Sleeper",    seats: "A1, A2", amount: "₹2,400", status: "Confirmed" },
  BK102: { pnr: "APS123457", from: "Naharlagun", to: "Tezpur",   date: "18 May 2026", time: "07:30 AM", bus: "Non-AC Seater",       seats: "B1, B2", amount: "₹1,800", status: "Completed" },
  BK103: { pnr: "APS123458", from: "Itanagar", to: "Ziro",       date: "10 May 2026", time: "06:00 AM", bus: "Ordinary",            seats: "C1",     amount: "₹900",   status: "Cancelled" },
};

export default function BookingDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const booking  = DUMMY_BOOKINGS[id];

  if (!booking) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-semibold">Booking not found</p>
        <button onClick={() => navigate("/user/my-bookings")} className="mt-4 text-orange-500 hover:underline">
          ← Back to Bookings
        </button>
      </div>
    );
  }

  const statusColor = { Confirmed: "bg-green-100 text-green-700", Completed: "bg-blue-100 text-blue-700", Cancelled: "bg-red-100 text-red-600" }[booking.status];

  return (
    <div className="max-w-2xl space-y-5">
      <button onClick={() => navigate("/user/my-bookings")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <FiArrowLeft /> Back to Bookings
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#163F2D] p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-70 mb-1">PNR Number</p>
              <p className="text-2xl font-bold tracking-widest">{booking.pnr}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{booking.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-4 text-lg font-semibold">
            <FiMapPin size={16} /> {booking.from}
            <span className="text-orange-400 mx-1">→</span>
            {booking.to}
          </div>
        </div>

        {/* Details grid */}
        <div className="p-6 grid grid-cols-2 gap-5 text-sm">
          {[
            ["Journey Date", booking.date],
            ["Departure Time", booking.time],
            ["Bus Type", booking.bus],
            ["Seat Numbers", booking.seats],
            ["Total Amount", booking.amount],
            ["Booking ID", id],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-semibold text-gray-800">{val}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        {booking.status !== "Cancelled" && (
          <div className="px-6 pb-6 flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-600 transition font-medium">
              <FiDownload /> Download e-Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
