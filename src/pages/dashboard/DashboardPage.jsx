import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "react-query";
import { dashboardApi } from "../../api/dashboad";
import logo from "../../assets/logo.png";
import toast from "react-hot-toast";
import {
  Users, Ticket, RotateCcw,
  TrendingUp, Bus, Route as RouteIcon, Download, Clock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#ef4444", "#a855f7", "#64748b"];

function TopCard({ title, value, color, icon: Icon }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow border-b-4 ${color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50">
          <Icon size={20} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
}

function statusColor(status) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "text-green-600";
    case "PENDING_PAYMENT":
      return "text-orange-500";
    case "FULLY_CANCELLED":
    case "PARTIALLY_CANCELLED":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery(
    "admin-dashboard-summary",
    () => dashboardApi.getAdminSummary(),
    { refetchInterval: 60000 }
  );

  const summary = data?.data?.data;

  const totalUsers = summary?.totalUsers ?? "—";
  const pendingRefunds = summary?.pendingRefunds ?? "—";
  const bookingsToday = summary?.bookingsToday ?? "—";
  const revenueToday = summary?.revenueToday != null
    ? `₹${Number(summary.revenueToday).toLocaleString("en-IN")}`
    : "—";

  const barData = (summary?.monthlyRevenue ?? []).map((p) => ({
    name: p.label,
    value: Number(p.amount),
  }));

  const pieData = (summary?.bookingStatusBreakdown ?? []).map((s) => ({
    name: s.status.replace(/_/g, " "),
    value: s.count,
  }));

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await dashboardApi.downloadAdminReport();
      toast.success("Report downloaded");
    } catch {
      toast.error("Couldn't generate the report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-gray-800 space-y-6">
      {/* Welcome strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#0c1f2c] to-[#163F2D] rounded-2xl p-5 text-white shadow">
        <div className="flex items-center gap-4">
          <img src={logo} alt="APSTS" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
          <div>
            <h1 className="text-lg font-bold">
              Welcome, {user?.name ?? user?.phone ?? "Admin"}!
            </h1>
            <p className="text-xs text-gray-300">
              Arunachal Pradesh State Transport Services — Admin Dashboard
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition text-white px-4 py-2.5 rounded-xl font-medium text-sm border border-white/20 disabled:opacity-60"
        >
          <Download size={16} />
          {downloading ? "Preparing…" : "Download Report (CSV)"}
        </button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TopCard title="Bookings Today"  value={bookingsToday}  color="border-blue-500"   icon={Ticket} />
        <TopCard title="Today's Revenue" value={revenueToday}   color="border-green-500"  icon={TrendingUp} />
        <TopCard title="Total Users"     value={totalUsers}     color="border-purple-500" icon={Users} />
        <TopCard title="Pending Refunds" value={pendingRefunds} color="border-orange-500" icon={RotateCcw} />
      </div>

      {/* Middle: today's departures + sales chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Departures — replaces the old placeholder live-tracking map */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Bus size={16} className="text-green-600" /> Today's Departures
          </h3>

          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
          ) : !summary?.upcomingDepartures?.length ? (
            <p className="py-10 text-center text-sm text-gray-400">
              No more departures scheduled for today.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {summary.upcomingDepartures.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{d.routeName}</p>
                    <p className="text-xs text-gray-400">
                      {d.busTypeName} · {d.busRegistration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 justify-end text-sm font-semibold text-gray-700">
                      <Clock size={13} className="text-orange-500" /> {d.departureTime}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.availableSeats}/{d.totalSeats} seats left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales Overview */}
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Sales Overview</h3>
              <p className="text-xs text-gray-400">Last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <defs>
                <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="url(#greenBar)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: recent bookings + pie + top routes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Ticket size={16} className="text-blue-500" /> Recent Bookings
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b text-left">
                <th className="pb-2 font-medium">PNR</th>
                <th className="pb-2 font-medium">Route</th>
                <th className="pb-2 font-medium">Journey Date</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(summary?.recentBookings ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-mono text-xs">{r.pnr}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{r.routeName}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{r.journeyDate ?? "—"}</td>
                  <td className={`py-2.5 font-semibold text-xs ${statusColor(r.status)}`}>
                    {r.status?.replace(/_/g, " ")}
                  </td>
                </tr>
              ))}
              {!isLoading && !summary?.recentBookings?.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 text-xs">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold mb-4">Booking Stats</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={75} innerRadius={40}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm w-full">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name}
                    </div>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-gray-400">No booking data yet.</p>
          )}
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <RouteIcon size={16} className="text-purple-500" /> Top Routes
        </h3>
        {summary?.topRoutes?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {summary.topRoutes.map((r, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400">{r.routeNumber}</p>
                <p className="font-medium text-sm text-gray-800">{r.routeName}</p>
                <p className="text-xs text-purple-600 font-semibold mt-1">
                  {r.bookingCount} bookings
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">No route activity yet.</p>
        )}
      </div>
    </div>
  );
}