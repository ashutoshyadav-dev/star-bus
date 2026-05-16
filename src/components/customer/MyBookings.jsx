import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiX } from "react-icons/fi";
import { bookingApi } from "../../api/booking";

const STATUS_META = {
  CONFIRMED:        { label: "Confirmed",  style: "bg-blue-100 text-blue-700" },
  COMPLETED:        { label: "Completed",  style: "bg-green-100 text-green-700" },
  FULLY_CANCELLED:  { label: "Cancelled",  style: "bg-red-100 text-red-600" },
  PENDING_PAYMENT:  { label: "Pending",    style: "bg-yellow-100 text-yellow-700" },
};

// ── Filter tabs — added "Confirmed", "Upcoming" uses journeyDate logic ──
const FILTER_TABS = ["All", "Upcoming", "Confirmed", "Completed", "Cancelled", "Pending"];

function isUpcoming(journeyDate) {
  if (!journeyDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // strip time — compare dates only
  return new Date(journeyDate) > today;
}

function formatTime(time) {
  if (!time) return "—";
  // Handle both object { hour, minute } and string "HH:MM:SS"
  if (typeof time === "string") {
    const [h, m] = time.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  const { hour = 0, minute = 0 } = time;
  const ampm = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching all bookings...");
        const response = await bookingApi.getMyDetails();

        console.log("Raw response:", response?.data);

        const raw = response?.data;
        const list =
          Array.isArray(raw?.data)     ? raw.data     :
          Array.isArray(raw?.content)  ? raw.content  :
          Array.isArray(raw?.bookings) ? raw.bookings :
          Array.isArray(raw)           ? raw           :
          [];

        console.log("Total bookings fetched:", list.length);
        if (list.length > 0) {
          console.table(list[0]); // check all field names
        }

        setBookings(list);
      } catch (err) {
        console.error("API Failed:", err?.response?.status, err?.response?.data);
        setError("Unable to load your bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // =========================
  // FILTER LOGIC
  // =========================
  const filtered = bookings.filter((b) => {
    switch (filter) {
      case "All":
        return true;

      case "Upcoming":
        // journeyDate is in the future — regardless of status
        return isUpcoming(b.journeyDate);

      case "Confirmed":
        return b.bookingStatus === "CONFIRMED";

      case "Completed":
        return b.bookingStatus === "COMPLETED";

      case "Cancelled":
        return b.bookingStatus === "FULLY_CANCELLED";

      case "Pending":
        return b.bookingStatus === "PENDING_PAYMENT";

      default:
        return true;
    }
  });

  // ── Count badges per tab ──
  const counts = {
    All:       bookings.length,
    Upcoming:  bookings.filter((b) => isUpcoming(b.journeyDate)).length,
    Confirmed: bookings.filter((b) => b.bookingStatus === "CONFIRMED").length,
    Completed: bookings.filter((b) => b.bookingStatus === "COMPLETED").length,
    Cancelled: bookings.filter((b) => b.bookingStatus === "FULLY_CANCELLED").length,
    Pending:   bookings.filter((b) => b.bookingStatus === "PENDING_PAYMENT").length,
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage all your trips</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-100">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage all your trips</p>
        </div>

        {/* Filter tabs with count badges */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {/* Count badge */}
              {counts[tab] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === tab
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border">
          <p className="text-lg mb-1">No bookings found</p>
          <p className="text-sm">
            {filter === "All"
              ? "You haven't made any bookings yet."
              : `No ${filter.toLowerCase()} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const statusInfo = STATUS_META[b.bookingStatus] ?? {
              label: b.bookingStatus,
              style: "bg-gray-100 text-gray-600",
            };

            const seats = Array.isArray(b.seatNumbers)
              ? b.seatNumbers.join(", ")
              : b.seatNumbers ?? "—";

            const upcoming = isUpcoming(b.journeyDate);

            return (
              <div
                key={b.bookingId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                {/* Route + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    {b.fromStationName ?? "—"}
                    <FiArrowRight className="text-orange-500" />
                    {b.toStationName ?? "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Upcoming badge — shown when journey is in future */}
                    {upcoming && b.bookingStatus !== "FULLY_CANCELLED" && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                        Upcoming Trip
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.style}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-500">
                  <div>
                    <p className="text-xs text-gray-400">PNR</p>
                    <p className="font-medium text-gray-700 truncate" title={b.pnr}>
                      {b.pnr ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Journey Date</p>
                    <p className="font-medium text-gray-700">
                      {formatDate(b.journeyDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Departure</p>
                    <p className="font-medium text-gray-700">
                      {formatTime(b.departureTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Amount</p>
                    <p className="font-medium text-gray-700">
                      ₹{b.totalAmountPaid?.toLocaleString("en-IN") ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Seats</p>
                    <p className="font-medium text-gray-700">{seats}</p>
                  </div>
                  {b.busTypeName && (
                    <div>
                      <p className="text-xs text-gray-400">Bus Type</p>
                      <p className="font-medium text-gray-700">{b.busTypeName}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/user/booking/${b.bookingId}`, { state: { booking: b } })}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                  >
                    <FiEye /> View Details
                  </button>

                  {/* Cancel button — only for CONFIRMED or PENDING_PAYMENT bookings */}
                  {(b.bookingStatus === "CONFIRMED" || b.bookingStatus === "PENDING_PAYMENT") && (
                    <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors">
                      <FiX /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}