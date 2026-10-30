import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import toast from "react-hot-toast";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertTriangle, BadgeIndianRupee, Bus, CheckCircle2, Download, MessageSquareWarning,
  RefreshCw, Ticket, TrendingUp, Users, Wallet, XCircle,
} from "lucide-react";
import { hodApi } from "../../api/hod";

const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const num = (n) => new Intl.NumberFormat("en-IN").format(Number(n) || 0);
const pct = (n) => `${Number(n) || 0}%`;
const pretty = (s) => (s ? String(s).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—");
const iso = (d) => format(d, "yyyy-MM-dd");

const PALETTE = ["#0F3D2E", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b"];
const PRESETS = [
  { label: "7 days", days: 6 },
  { label: "30 days", days: 29 },
  { label: "90 days", days: 89 },
];

const REPORTS = [
  { type: "revenue",    label: "Daily revenue" },
  { type: "routes",     label: "Route performance" },
  { type: "depots",     label: "Depot-wise revenue" },
  { type: "refunds",    label: "Cancellations & refunds" },
  { type: "grievances", label: "Grievance register" },
];

function Kpi({ label, value, icon: Icon, tone = "slate", sub }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ text = "No data for this period" }) => (
  <div className="flex h-40 items-center justify-center text-sm text-slate-400">{text}</div>
);

const PRIORITY_STYLE = {
  urgent: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function HodDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState({ from: iso(subDays(new Date(), 29)), to: iso(new Date()) });
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    document.title = "HOD Dashboard | APSTS";
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    ["hod-summary", range.from, range.to],
    () => hodApi.getSummary(range.from, range.to),
    { keepPreviousData: true, staleTime: 60_000 }
  );
  const d = data?.data?.data;
  const k = d?.kpis ?? {};
  const ops = d?.operations ?? {};
  const g = d?.grievances ?? {};

  const applyPreset = (days) => setRange({ from: iso(subDays(new Date(), days)), to: iso(new Date()) });

  const download = async (type) => {
    setDownloading(type);
    try {
      await hodApi.downloadReport(type, range.from, range.to);
    } catch {
      toast.error("Could not download the report");
    } finally {
      setDownloading(null);
    }
  };

  // Items the HOD should look at first, most severe first
  const attention = useMemo(() => {
    if (!d) return [];
    const items = [
      { n: g.slaBreached, text: "grievances past their SLA deadline", tone: "red", to: "/admin/grievance" },
      { n: g.escalated, text: "escalated grievances", tone: "red", to: "/admin/grievance" },
      { n: g.urgentOpen, text: "urgent / high priority grievances still open", tone: "amber", to: "/admin/grievance" },
      { n: g.unassigned, text: "grievances not assigned to anyone", tone: "amber", to: "/admin/grievance" },
      { n: ops.upcomingTripsWithoutDuty, text: "trips in the next 3 days without a duty assigned", tone: "amber" },
      { n: ops.busesBreakdown, text: "buses on breakdown", tone: "red" },
      { n: k.refundsPending, text: "refunds pending or processing", tone: "amber" },
      { n: ops.fitnessExpiring30d, text: "bus fitness certificates expiring within 30 days", tone: "amber" },
      { n: ops.insuranceExpiring30d, text: "bus insurance policies expiring within 30 days", tone: "amber" },
    ];
    return items.filter((i) => Number(i.n) > 0);
  }, [d, g, ops, k]);

  const trend = (d?.revenueTrend ?? []).map((r) => ({ ...r, revenue: Number(r.revenue), label: String(r.date).slice(5) }));
  const routes = d?.topRoutes ?? [];
  const depots = (d?.depotRevenue ?? []).map((r) => ({ ...r, revenue: Number(r.revenue) }));
  const bookingStatus = (d?.bookingStatus ?? []).map((r) => ({ name: pretty(r.status), value: Number(r.count) }));
  const byCategory = (g.byCategory ?? []).map((r) => ({ name: pretty(r.label), count: Number(r.count) }));
  const byPriority = (g.byPriority ?? []).map((r) => ({ name: pretty(r.label), value: Number(r.count) }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Head of Department Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Revenue, operations and grievances for {range.from} to {range.to}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50"
              >
                {p.label}
              </button>
            ))}
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
              aria-label="From date"
            />
            <input
              type="date"
              value={range.to}
              min={range.from}
              max={iso(new Date())}
              onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
              aria-label="To date"
            />
            <button
              onClick={() => refetch()}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#0F3D2E] px-3 text-sm font-medium text-white hover:bg-[#0c2e22]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-slate-400">Loading dashboard…</p>}
        {isError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Could not load the dashboard. Try refreshing.</p>
        )}

        {d && (
          <>
            {/* Needs attention */}
            <Panel title="Needs your attention">
              {attention.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Nothing is overdue right now.
                </p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {attention.map((a) => {
                    const row = (
                      <div
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                          a.tone === "red" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"
                        } ${a.to ? "cursor-pointer hover:brightness-95" : ""}`}
                        onClick={a.to ? () => navigate(a.to) : undefined}
                      >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>{num(a.n)}</strong> {a.text}
                        </span>
                      </div>
                    );
                    return <li key={a.text}>{row}</li>;
                  })}
                </ul>
              )}
            </Panel>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Revenue" value={inr(k.revenue)} icon={BadgeIndianRupee} tone="green" sub="Successful payments" />
              <Kpi label="Confirmed bookings" value={num(k.confirmedBookings)} icon={Ticket} tone="blue" sub={`${num(k.passengersCarried)} passengers`} />
              <Kpi label="Avg seat occupancy" value={pct(k.avgOccupancyPercent)} icon={Bus} tone="slate" sub="Across non-cancelled trips" />
              <Kpi label="Payment success rate" value={pct(k.paymentSuccessRate)} icon={TrendingUp} tone="green" />
              <Kpi label="Cancelled bookings" value={num(k.cancelledBookings)} icon={XCircle} tone="amber" />
              <Kpi label="Refunds issued" value={inr(k.refundsIssued)} icon={Wallet} tone="slate" sub={`${num(k.refundsPending)} pending`} />
              <Kpi label="Open grievances" value={num(g.open)} icon={MessageSquareWarning} tone={Number(g.slaBreached) > 0 ? "red" : "amber"} sub={`${num(g.slaBreached)} past SLA`} />
              <Kpi label="Avg resolution time" value={`${Number(g.avgResolutionHours) || 0} h`} icon={Users} tone="blue" sub={`Satisfaction ${Number(g.avgSatisfaction) || 0} / 5`} />
            </div>

            {/* Revenue + booking status */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Revenue trend" className="lg:col-span-2">
                {trend.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F3D2E" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0F3D2E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                      <Tooltip formatter={(v) => inr(v)} />
                      <Area type="monotone" dataKey="revenue" stroke="#0F3D2E" fill="url(#rev)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <Panel title="Bookings by status">
                {bookingStatus.length === 0 ? <Empty /> : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={bookingStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                          {bookingStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {bookingStatus.map((s, i) => (
                        <li key={s.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                            {s.name}
                          </span>
                          <span className="font-medium">{num(s.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Panel>
            </div>

            {/* Routes + depots */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Top routes by revenue" className="lg:col-span-2">
                {routes.length === 0 ? <Empty /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                          <th className="py-2 pr-3">Route</th>
                          <th className="py-2 pr-3 text-right">Trips</th>
                          <th className="py-2 pr-3 text-right">Seats sold</th>
                          <th className="py-2 pr-3 text-right">Occupancy</th>
                          <th className="py-2 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map((r) => (
                          <tr key={r.route} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 pr-3">
                              <p className="font-medium text-slate-700">{r.route}</p>
                              <p className="text-xs text-slate-400">{r.name}</p>
                            </td>
                            <td className="py-2 pr-3 text-right">{num(r.trips)}</td>
                            <td className="py-2 pr-3 text-right">{num(r.seatsSold)}</td>
                            <td className="py-2 pr-3 text-right">{pct(r.occupancyPercent)}</td>
                            <td className="py-2 text-right font-medium">{inr(r.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <Panel title="Revenue by depot">
                {depots.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={Math.max(160, depots.length * 38)}>
                    <BarChart data={depots} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                      <YAxis type="category" dataKey="code" tick={{ fontSize: 11 }} width={50} />
                      <Tooltip formatter={(v) => inr(v)} labelFormatter={(l) => depots.find((x) => x.code === l)?.depot ?? l} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </div>

            {/* Operations */}
            <Panel title="Operations & fleet">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Trips scheduled", ops.tripsScheduled],
                  ["Trips cancelled", ops.tripsCancelled],
                  ["Trips delayed", ops.tripsDelayed],
                  ["Avg delay (min)", ops.avgDelayMinutes],
                  ["Buses active", ops.busesActive],
                  ["In maintenance", ops.busesInMaintenance],
                  ["On breakdown", ops.busesBreakdown],
                  ["Trips w/o duty (3 days)", ops.upcomingTripsWithoutDuty],
                ].map(([label, v]) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-lg font-semibold text-slate-800">{num(v)}</p>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Grievances */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Grievances by category" className="lg:col-span-2">
                {byCategory.length === 0 ? <Empty text="No grievances in this period" /> : (
                  <ResponsiveContainer width="100%" height={Math.max(180, byCategory.length * 34)}>
                    <BarChart data={byCategory} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <Panel title="By priority">
                {byPriority.length === 0 ? <Empty text="No grievances in this period" /> : (
                  <ul className="space-y-2">
                    {byPriority.map((p) => (
                      <li key={p.name} className="flex items-center justify-between text-sm">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[p.name.toLowerCase()] ?? PRIORITY_STYLE.low}`}>
                          {p.name}
                        </span>
                        <span className="font-semibold text-slate-700">{num(p.value)}</span>
                      </li>
                    ))}
                    <li className="border-t pt-2 text-xs text-slate-400">
                      Filed {num(g.filedInRange)} · Resolved {num(g.resolvedInRange)}
                    </li>
                  </ul>
                )}
              </Panel>
            </div>

            <Panel
              title="Grievances that need action"
              action={
                <button onClick={() => navigate("/admin/grievance")} className="text-sm font-medium text-blue-600 hover:underline">
                  Open grievance desk →
                </button>
              }
            >
              {(g.needsAttention ?? []).length === 0 ? (
                <Empty text="No open grievances" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2 pr-3">Ticket</th>
                        <th className="py-2 pr-3">Subject</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Priority</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.needsAttention.map((t) => (
                        <tr key={t.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-3 font-mono text-xs">{t.ticketNumber}</td>
                          <td className="max-w-xs truncate py-2 pr-3 text-slate-700">{t.subject}</td>
                          <td className="py-2 pr-3 text-slate-500">{pretty(t.category)}</td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.low}`}>
                              {pretty(t.priority)}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-slate-500">{pretty(t.status)}</td>
                          <td className="py-2">
                            {t.slaBreached ? (
                              <span className="text-xs font-semibold text-red-600">Breached</span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {t.slaDeadlineAt ? format(new Date(t.slaDeadlineAt), "dd MMM, HH:mm") : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            {/* Reports */}
            <Panel title="Download reports (CSV)">
              <div className="flex flex-wrap gap-3">
                {REPORTS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => download(r.type)}
                    disabled={downloading === r.type}
                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading === r.type ? "Preparing…" : r.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">Reports cover {range.from} to {range.to}.</p>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}
