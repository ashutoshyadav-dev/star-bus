import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StatCard from "./StatCard";
import BookingTable from "./BookingTable";
import {
  FiMap, FiBook, FiCheckCircle, FiNavigation,
  FiFileText, FiHelpCircle, FiArrowRight,
} from "react-icons/fi";

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const name      = user?.name ?? user?.phone ?? "Passenger";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {name.split(" ")[0]}!</h2>
        <p className="text-gray-500 mt-1">Here's what's happening with your travel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Bookings"    value="15" icon={<FiBook size={22} />}        color="bg-purple-50 text-purple-600" />
        <StatCard title="Upcoming Trips"    value="2"  icon={<FiMap size={22} />}          color="bg-blue-50 text-blue-600" />
        <StatCard title="Available Routes"  value="25" icon={<FiNavigation size={22} />}   color="bg-yellow-50 text-yellow-600" />
        <StatCard title="Active Buses"      value="12" icon={<FiCheckCircle size={22} />}  color="bg-green-50 text-green-600" />
      </div>

      {/* Main section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Next trip */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-lg mb-5 text-gray-800">Next Upcoming Trip</h3>
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div className="border-l-4 border-green-500 pl-4 space-y-1.5">
              <p className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                Itanagar <FiArrowRight /> Guwahati
              </p>
              <p className="text-sm text-gray-500">Volvo AC Sleeper</p>
              <p className="text-sm text-gray-500">25 May, 2026 • 06:00 PM</p>
              <p className="text-sm text-gray-500">PNR: APS123456</p>
              <p className="text-sm text-gray-500">Seat: A1, A2</p>
            </div>
            <button
              onClick={() => navigate("/user/booking/BK101")}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-medium"
            >
              View Ticket
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-sm">
          <h3 className="font-semibold mb-4 text-lg text-gray-800">Quick Actions</h3>
          <div className="space-y-3 text-gray-600">
            {[
              { icon: <FiFileText />,   label: "Book Ticket",  to: "/user/book-ticket" },
              { icon: <FiBook />,        label: "My Bookings",  to: "/user/my-bookings" },
              { icon: <FiNavigation />,  label: "Track Bus",    to: null },
              { icon: <FiHelpCircle />,  label: "Helpdesk",     to: "/user/helpdesk" },
            ].map(({ icon, label, to }) => (
              <div
                key={label}
                onClick={() => to && navigate(to)}
                className={`flex items-center gap-4 border-b pb-3 transition ${
                  to ? "hover:text-orange-500 cursor-pointer" : "opacity-50"
                }`}
              >
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <BookingTable />
      </div>
    </div>
  );
}
