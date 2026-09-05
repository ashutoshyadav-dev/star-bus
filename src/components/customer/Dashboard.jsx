import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { dashboardApi } from "../../api/dashboad";
import {
  FiBook,
  FiMap,
  FiCheckCircle,
  FiXCircle,
  FiCreditCard,
  FiGift,
  FiArrowRight,
  FiHelpCircle,
  FiBell,
} from "react-icons/fi";
import { useEffect } from "react";

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

function statusStyle(status) {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "FULLY_CANCELLED":
    case "PARTIALLY_CANCELLED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function UserDashboard() {
  const navigate = useNavigate();

   useEffect(() => {
    document.title = "Dashboard | APSTS Passenger Portal";
  }, []);

  const { data, isLoading } = useQuery(
    "user-dashboard-summary",
    () => dashboardApi.getUserSummary(),
    { refetchInterval: 60000 }
  );
  const summary = data?.data?.data;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const statsData = [
    {
      title: "Total Bookings",
      value: summary?.totalBookings ?? "—",
      icon: <FiBook size={18} />,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Upcoming Trips",
      value: summary?.upcomingTrips ?? "—",
      icon: <FiMap size={18} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Completed Trips",
      value: summary?.completedTrips ?? "—",
      icon: <FiCheckCircle size={18} />,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Cancelled",
      value: summary?.cancelledTrips ?? "—",
      icon: <FiXCircle size={18} />,
      color: "bg-red-50 text-red-600",
    },
    {
      title: "Wallet Balance",
      value: summary?.walletBalance != null ? `₹${Number(summary.walletBalance).toLocaleString("en-IN")}` : "—",
      icon: <FiCreditCard size={18} />,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Reward Points",
      value: summary?.loyaltyPoints ?? "—",
      icon: <FiGift size={18} />,
      color: "bg-pink-50 text-pink-600",
    },
  ];

  const upcoming = summary?.upcomingJourney;
  const recentBookings = summary?.recentBookings ?? [];

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {greeting} 👋
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your trips and bookings
          </p>
        </div>

        <button
          onClick={() => navigate("/user/book-ticket")}
          className="bg-orange-500 hover:bg-orange-600 transition text-white px-5 py-3 rounded-xl font-medium"
        >
          Book Ticket
        </button>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Cards */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

        {statsData.map((item) => (

          <div
            key={item.title}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >

            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-gray-500">
                  {item.title}
                </p>

                <h2 className="text-2xl font-bold text-gray-800 mt-1">
                  {isLoading ? "…" : item.value}
                </h2>
              </div>

              <div className={`p-2.5 rounded-xl ${item.color}`}>
                {item.icon}
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Upcoming Journey + Quick Actions */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Upcoming Journey */}

        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-xl font-semibold text-gray-800">
              Upcoming Journey
            </h2>

            {upcoming && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                Confirmed
              </span>
            )}

          </div>

          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : !upcoming ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-gray-500">You have no upcoming trips.</p>
              <button
                onClick={() => navigate("/user/book-ticket")}
                className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                Book your next journey →
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row justify-between gap-6">

              <div className="space-y-3">

                <div>

                  <p className="text-gray-400 text-sm">
                    Route
                  </p>

                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {upcoming.fromStation}
                    <FiArrowRight />
                    {upcoming.toStation}
                  </h3>

                </div>

                <div className="grid grid-cols-2 gap-5 text-sm">

                  <div>
                    <p className="text-gray-400">Journey Date</p>
                    <p className="font-semibold text-gray-700">
                      {upcoming.journeyDate}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Departure</p>
                    <p className="font-semibold text-gray-700">
                      {upcoming.departureTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Passengers</p>
                    <p className="font-semibold text-gray-700">
                      {upcoming.passengerCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">PNR</p>
                    <p className="font-semibold text-gray-700">
                      {upcoming.pnr}
                    </p>
                  </div>

                </div>

              </div>

              <div className="flex flex-col gap-3">

                <button
                  onClick={() => navigate("/user/my-bookings")}
                  className="bg-orange-500 hover:bg-orange-600 transition text-white px-5 py-3 rounded-xl font-medium"
                >
                  View Bookings
                </button>

              </div>

            </div>
          )}

        </div>

        {/* Quick Actions */}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-800 mb-5">
            Quick Actions
          </h2>

          <div className="space-y-3">

            {[
              {
                label: "Book Ticket",
                icon: <FiBook />,
                path: "/user/book-ticket",
              },
              {
                label: "My Bookings",
                icon: <FiMap />,
                path: "/user/my-bookings",
              },
              {
                label: "My Wallet",
                icon: <FiCreditCard />,
                path: "/user/wallet",
              },
              {
                label: "Helpdesk",
                icon: <FiHelpCircle />,
                path: "/user/helpdesk",
              },
            ].map((item) => (

              <div
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 transition hover:border-orange-200 hover:bg-orange-50 cursor-pointer"
              >

                <div className="flex items-center gap-3 text-gray-700">
                  {item.icon}
                  <span className="font-medium">
                    {item.label}
                  </span>
                </div>

                <FiArrowRight className="text-gray-400" />

              </div>
            ))}

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Notification */}
      {/* ------------------------------------------------------------------ */}

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">

        <div className="flex items-start gap-4">

          <div className="bg-white/20 p-3 rounded-xl">
            <FiBell size={20} />
          </div>

          <div>

            <h3 className="font-semibold text-lg">
              Special Offer 🎉
            </h3>

            <p className="text-sm opacity-90 mt-1">
              Get 20% OFF on your next booking using code
              <span className="font-bold"> TRAVEL20</span>
            </p>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recent Bookings */}
      {/* ------------------------------------------------------------------ */}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-x-auto">

        <div className="flex justify-between items-center mb-5">

          <h2 className="text-xl font-semibold text-gray-800">
            Recent Bookings
          </h2>

          <button
            onClick={() => navigate("/user/my-bookings")}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            View All
          </button>

        </div>

        <table className="w-full min-w-[700px]">

          <thead>

            <tr className="border-b border-gray-100 text-left text-sm text-gray-500">

              <th className="pb-3 font-medium">
                PNR
              </th>

              <th className="pb-3 font-medium">
                Route
              </th>

              <th className="pb-3 font-medium">
                Journey Date
              </th>

              <th className="pb-3 font-medium">
                Amount
              </th>

              <th className="pb-3 font-medium">
                Status
              </th>

              <th className="pb-3 font-medium">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {recentBookings.map((booking) => (

              <tr
                key={booking.id}
                className="border-b border-gray-50 text-sm"
              >

                <td className="py-4 font-semibold text-gray-700">
                  {booking.pnr}
                </td>

                <td className="py-4 text-gray-600">
                  {booking.routeName}
                </td>

                <td className="py-4 text-gray-600">
                  {booking.journeyDate ?? "—"}
                </td>

                <td className="py-4 text-gray-600">
                  ₹{booking.amount}
                </td>

                <td className="py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(booking.status)}`}
                  >
                    {booking.status?.replace(/_/g, " ")}
                  </span>

                </td>

                <td className="py-4">

                  <button
                    onClick={() =>
                      navigate(`/user/booking/${booking.id}`)
                    }
                    className="text-orange-500 hover:text-orange-600 font-medium"
                  >
                    View
                  </button>

                </td>

              </tr>
            ))}

            {!isLoading && recentBookings.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                  You haven't made any bookings yet.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}