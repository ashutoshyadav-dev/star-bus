import { useAuth } from "../../context/AuthContext";
import { useQuery } from "react-query";
import { usersApi } from "../../api/users";
import { refundApi } from "../../api/booking";
import logo from "../../assets/logo.png";
import {
  Users, Ticket, CreditCard, RotateCcw,
  TrendingUp, Bus, MapPin, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const barData = [
  { name: "Jan", value: 120 },{ name: "Feb", value: 180 },{ name: "Mar", value: 150 },
  { name: "Apr", value: 280 },{ name: "May", value: 220 },{ name: "Jun", value: 310 },
];
const pieData = [
  { name: "Booked", value: 65 },
  { name: "Cancelled", value: 20 },
  { name: "Pending", value: 15 },
];
const PIE_COLORS = ["#22c55e", "#f97316", "#3b82f6"];

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

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: usersData }   = useQuery("dash-users",   () => usersApi.getAll({ size: 1 }));
  const { data: refundsData } = useQuery("dash-refunds", () => refundApi.getPending());

  const totalUsers     = usersData?.data?.data?.totalElements  ?? "—";
  const pendingRefunds = refundsData?.data?.data?.length        ?? "—";

  return (
    <div className="text-gray-800 space-y-6">
      {/* Welcome strip */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#0c1f2c] to-[#163F2D] rounded-2xl p-5 text-white shadow">
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

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TopCard title="Bookings Today"  value="128"          color="border-blue-500"   icon={Ticket} />
        <TopCard title="Today's Revenue" value="₹85,420"      color="border-green-500"  icon={TrendingUp} />
        <TopCard title="Total Users"     value={totalUsers}   color="border-purple-500" icon={Users} />
        <TopCard title="Pending Refunds" value={pendingRefunds} color="border-orange-500" icon={RotateCcw} />
      </div>

      {/* Middle: live tracking + sales chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Bus size={16} className="text-green-600" /> Live Bus Tracking
          </h3>
          <div className="h-56 rounded-xl overflow-hidden relative bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1577086664693-894d8405334a?w=800"
              className="w-full h-full object-cover brightness-90"
              alt="map"
            />
            <div className="absolute top-8  left-12 text-2xl animate-bounce">🚌</div>
            <div className="absolute top-16 right-16 text-2xl animate-pulse">🚌</div>
            <div className="absolute bottom-10 left-20 text-2xl animate-bounce">🚌</div>
            <div className="absolute bottom-16 right-10 text-2xl animate-pulse">🚌</div>
          </div>
        </div>

        {/* Sales Overview */}
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Sales Overview</h3>
              <p className="text-xs text-gray-400">Monthly revenue</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
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

      {/* Bottom: recent bookings + pie */}
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
                <th className="pb-2 font-medium">Passenger</th>
                <th className="pb-2 font-medium">Route</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { pnr: "APS12456", name: "Rahul Sharma",  route: "Itanagar → Guwahati", status: "Confirmed", color: "text-green-600" },
                { pnr: "APS13457", name: "Anita Verma",   route: "Naharlagun → Tezpur", status: "Pending",   color: "text-orange-500" },
                { pnr: "APS13458", name: "David Taki",    route: "Itanagar → Ziro",     status: "Confirmed", color: "text-green-600" },
                { pnr: "APS13459", name: "Priya Galo",    route: "Pasighat → Itanagar", status: "Cancelled", color: "text-red-500" },
              ].map((r) => (
                <tr key={r.pnr} className="hover:bg-gray-50">
                  <td className="py-2.5 font-mono text-xs">{r.pnr}</td>
                  <td className="py-2.5">{r.name}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{r.route}</td>
                  <td className={`py-2.5 font-semibold text-xs ${r.color}`}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold mb-4">Booking Stats</h3>
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={75} innerRadius={40}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm w-full">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: PIE_COLORS[i] }} />
                    {d.name}
                  </div>
                  <span className="font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
