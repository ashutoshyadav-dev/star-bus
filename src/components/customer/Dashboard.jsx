import { useNavigate } from "react-router-dom";
import {
  FiBook,
  FiMap,
  FiCheckCircle,
  FiXCircle,
  FiCreditCard,
  FiGift,
  FiArrowRight,
  FiDownload,
  FiHelpCircle,
  FiNavigation,
  FiBell,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*                                   DATA                                     */
/* -------------------------------------------------------------------------- */

const statsData = [
  {
    title: "Total Bookings",
    value: 15,
    icon: <FiBook size={18} />,
    color: "bg-purple-50 text-purple-600",
    chartColor: "#7C3AED",
    data: [
      { value: 2 },
      { value: 5 },
      { value: 4 },
      { value: 7 },
      { value: 6 },
      { value: 15 },
    ],
  },
  {
    title: "Upcoming Trips",
    value: 2,
    icon: <FiMap size={18} />,
    color: "bg-blue-50 text-blue-600",
    chartColor: "#2563EB",
    data: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 1 },
      { value: 2 },
      { value: 2 },
    ],
  },
  {
    title: "Completed Trips",
    value: 10,
    icon: <FiCheckCircle size={18} />,
    color: "bg-green-50 text-green-600",
    chartColor: "#16A34A",
    data: [
      { value: 1 },
      { value: 3 },
      { value: 5 },
      { value: 7 },
      { value: 8 },
      { value: 10 },
    ],
  },
  {
    title: "Cancelled",
    value: 3,
    icon: <FiXCircle size={18} />,
    color: "bg-red-50 text-red-600",
    chartColor: "#DC2626",
    data: [
      { value: 0 },
      { value: 1 },
      { value: 0 },
      { value: 2 },
      { value: 1 },
      { value: 3 },
    ],
  },
  {
    title: "Wallet Balance",
    value: "₹2,450",
    icon: <FiCreditCard size={18} />,
    color: "bg-yellow-50 text-yellow-600",
    chartColor: "#CA8A04",
    data: [
      { value: 300 },
      { value: 600 },
      { value: 900 },
      { value: 1200 },
      { value: 1800 },
      { value: 2450 },
    ],
  },
  {
    title: "Reward Points",
    value: 380,
    icon: <FiGift size={18} />,
    color: "bg-pink-50 text-pink-600",
    chartColor: "#DB2777",
    data: [
      { value: 50 },
      { value: 90 },
      { value: 120 },
      { value: 220 },
      { value: 300 },
      { value: 380 },
    ],
  },
];

const recentBookings = [
  {
    id: "BK101",
    route: "Delhi → Jaipur",
    date: "25 May 2026",
    amount: "₹850",
    status: "Confirmed",
  },
  {
    id: "BK102",
    route: "Delhi → Chandigarh",
    date: "28 May 2026",
    amount: "₹1200",
    status: "Completed",
  },
  {
    id: "BK103",
    route: "Delhi → Agra",
    date: "30 May 2026",
    amount: "₹650",
    status: "Cancelled",
  },
];

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function UserDashboard() {
  const navigate = useNavigate();

  const name = "Passenger";

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {greeting}, {name} 👋
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
                  {item.value}
                </h2>
              </div>

              <div className={`p-2.5 rounded-xl ${item.color}`}>
                {item.icon}
              </div>

            </div>

            {/* Chart */}

            <div className="h-16 mt-2">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart data={item.data}>

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={item.chartColor}
                    fill={item.chartColor}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />

                </AreaChart>

              </ResponsiveContainer>

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

            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              Confirmed
            </span>

          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-6">

            <div className="space-y-3">

              <div>

                <p className="text-gray-400 text-sm">
                  Route
                </p>

                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Delhi
                  <FiArrowRight />
                  Jaipur
                </h3>

              </div>

              <div className="grid grid-cols-2 gap-5 text-sm">

                <div>
                  <p className="text-gray-400">Journey Date</p>
                  <p className="font-semibold text-gray-700">
                    25 May 2026
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">Departure</p>
                  <p className="font-semibold text-gray-700">
                    06:30 PM
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">Seats</p>
                  <p className="font-semibold text-gray-700">
                    A1, A2
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">PNR</p>
                  <p className="font-semibold text-gray-700">
                    APS123456
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
                label: "Track Bus",
                icon: <FiNavigation />,
                path: null,
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
                className={`flex items-center justify-between p-4 rounded-xl border border-gray-100 transition
                ${
                  item.path
                    ? "hover:border-orange-200 hover:bg-orange-50 cursor-pointer"
                    : "opacity-50"
                }`}
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
                Booking ID
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
                  {booking.id}
                </td>

                <td className="py-4 text-gray-600">
                  {booking.route}
                </td>

                <td className="py-4 text-gray-600">
                  {booking.date}
                </td>

                <td className="py-4 text-gray-600">
                  {booking.amount}
                </td>

                <td className="py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      booking.status === "Confirmed"
                        ? "bg-blue-100 text-blue-700"
                        : booking.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {booking.status}
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

          </tbody>

        </table>

      </div>

    </div>
  );
}