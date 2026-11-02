import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiSearch, FiRefreshCw, FiClock, FiCalendar, FiUsers, FiChevronDown,
  FiAlertTriangle, FiX, FiTruck, FiMapPin, FiCheckCircle,
} from "react-icons/fi";
import { getAllSchedules } from "../../api/schedule";
import { stationApi } from "../../api/station";

/* ───────────────────────── helpers ───────────────────────── */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

// "2026-11-18" -> local Date (no UTC shift)
function parseISO(iso) {
  const [y, m, d] = String(iso ?? "").slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
const fmtDate = (iso) =>
  parseISO(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function fmt12(t) {
  if (!t) return "--";
  const [h, m] = String(t).split(":").map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}
const fmtStamp = (v) =>
  !v ? "Not recorded yet" : new Date(v).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });

function departureDate(s) {
  const d = parseISO(s.journeyDate);
  const [h, m] = String(s.departureTime ?? "00:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dayHeading(iso) {
  const t = todayISO();
  const date = parseISO(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  if (iso === t) return { title: "Today", sub: date };
  if (iso === addDays(t, 1)) return { title: "Tomorrow", sub: date };
  return { title: parseISO(iso).toLocaleDateString("en-IN", { weekday: "long" }), sub: parseISO(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) };
}

function leavesIn(dep, now) {
  const ms = dep.getTime() - now;
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 48) return `${h}h ${mins % 60}m`;
  return `${Math.floor(h / 24)} days`;
}

const norm = (s) => String(s ?? "").trim().toLowerCase();

/* trip status -> label + colours (unknown values fall back to a readable label) */
const STATUS = {
  scheduled: { label: "On schedule", cls: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  delayed: { label: "Delayed", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  departed: { label: "On the road", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  in_transit: { label: "On the road", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  running: { label: "On the road", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  arrived: { label: "Completed", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};
function statusOf(s) {
  const key = norm(s.tripStatus);
  if (key === "scheduled" && Number(s.delayMinutes) > 0) return STATUS.delayed;
  return STATUS[key] ?? {
    label: key ? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "Scheduled",
    cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400",
  };
}

/* can this trip still be booked, and if not, why */
function bookability(s, now) {
  const key = norm(s.tripStatus);
  if (key === "cancelled") return { ok: false, why: "Trip cancelled" };
  if (["departed", "in_transit", "running", "completed", "arrived"].includes(key)) return { ok: false, why: "Already departed" };
  if (departureDate(s).getTime() <= now) return { ok: false, why: "Already departed" };
  if (s.bookingClosesAt && new Date(s.bookingClosesAt).getTime() <= now) return { ok: false, why: "Booking closed" };
  if (!s.isBookingOpen) return { ok: false, why: "Booking closed" };
  if (Number(s.availableSeats) <= 0) return { ok: false, why: "Sold out" };
  return { ok: true, why: "" };
}

/* ───────────────────────── small pieces ───────────────────────── */

function SeatMeter({ free, total }) {
  const f = Number(free ?? 0), t = Number(total ?? 0);
  const pct = t > 0 ? Math.round((f / t) * 100) : 0;
  const tone = f === 0 ? "bg-red-500" : pct <= 20 ? "bg-red-400" : pct <= 50 ? "bg-amber-400" : "bg-green-500";
  const text = f === 0 ? "text-red-600" : pct <= 20 ? "text-red-500" : pct <= 50 ? "text-amber-600" : "text-green-700";
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-sm font-semibold ${text}`}>{f === 0 ? "No seats left" : `${f} seats free`}</span>
        <span className="text-xs text-gray-400">of {t}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={f} aria-valuemin={0} aria-valuemax={t}>
        <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {f > 0 && pct <= 20 && <p className="mt-1 text-[11px] text-red-500">Filling fast</p>}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700 break-words">{value}</p>
    </div>
  );
}

function ScheduleCard({ s, now, onBook, bookingDisabledReason }) {
  const [open, setOpen] = useState(false);
  const st = statusOf(s);
  const can = bookability(s, now);
  const dep = departureDate(s);
  const eta = leavesIn(dep, now);
  const delayed = Number(s.delayMinutes) > 0;
  const cancelled = norm(s.tripStatus) === "cancelled";

  return (
    <article className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${cancelled ? "border-red-100" : "border-gray-100"}`}>
      <div className="flex flex-col lg:flex-row">
        {/* departure time */}
        <div className={`lg:w-44 shrink-0 px-5 py-4 flex lg:flex-col lg:justify-center items-center lg:items-start gap-3 lg:gap-1 border-b lg:border-b-0 lg:border-r border-gray-100 ${cancelled ? "bg-red-50/40" : "bg-gradient-to-br from-[#081935] via-[#0F2D2F] to-[#163F2D] text-white"}`}>
          <p className={`text-xs ${cancelled ? "text-red-400" : "text-green-200"}`}>Departs</p>
          <p className={`text-2xl font-semibold tabular-nums leading-none ${cancelled ? "text-red-700 line-through" : ""}`}>{fmt12(s.departureTime)}</p>
          {delayed && !cancelled && <p className="text-xs text-amber-300">+{s.delayMinutes} min delay</p>}
          {eta && !cancelled && can.ok && <p className="ml-auto lg:ml-0 lg:mt-2 text-xs text-orange-300 flex items-center gap-1"><FiClock className="w-3 h-3" /> Leaves in {eta}</p>}
        </div>

        {/* route + bus */}
        <div className="flex-1 px-5 py-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-gray-800">{s.routeName}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
            </span>
            {!can.ok && !cancelled && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{can.why}</span>}
          </div>

          {/* origin ---- destination strip */}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{s.origin}</p>
              <p className="text-[11px] text-gray-400">Origin</p>
            </div>
            <div className="flex-1 flex items-center min-w-[40px]" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-white" />
              <span className="flex-1 border-t-2 border-dashed border-gray-300" />
              <FiTruck className="mx-1.5 text-orange-500" />
              <span className="flex-1 border-t-2 border-dashed border-gray-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-sm font-semibold text-gray-800 truncate">{s.destination}</p>
              <p className="text-[11px] text-gray-400">Destination</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><FiCalendar className="text-gray-400" /> {fmtDate(s.journeyDate)}</span>
            <span className="flex items-center gap-1.5"><FiTruck className="text-gray-400" /> <span className="font-mono font-semibold text-gray-700">{s.registrationNumber}</span></span>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{s.busTypeName}</span>
          </div>

          {cancelled && s.cancellationReason && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
              <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><span className="font-semibold">Why it was cancelled: </span>{s.cancellationReason}</span>
            </div>
          )}
        </div>

        {/* seats + action */}
        <div className="lg:w-60 shrink-0 px-5 py-4 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/60">
          {cancelled ? (
            <p className="text-sm text-gray-500">Seats are not available for this trip.</p>
          ) : (
            <SeatMeter free={s.availableSeats} total={s.totalSeats} />
          )}
          <button
            type="button"
            onClick={() => onBook(s)}
            disabled={!can.ok}
            title={!can.ok ? can.why : bookingDisabledReason}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            {can.ok ? "Book seats" : can.why}
          </button>
        </div>
      </div>

      {/* expandable details */}
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-t border-gray-100 transition-colors"
      >
        {open ? "Hide trip details" : "Show trip details"}
        <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/60 border-t border-gray-100">
          <Detail label="Trip reference" value={String(s.id).slice(0, 8).toUpperCase()} />
          <Detail label="Route" value={s.routeName} />
          <Detail label="Total seats" value={s.totalSeats ?? "--"} />
          <Detail label="Seats free now" value={s.availableSeats ?? "--"} />
          <Detail label="Booking" value={s.isBookingOpen ? "Open" : "Closed"} />
          <Detail label="Booking closes" value={s.bookingClosesAt ? fmtStamp(s.bookingClosesAt) : "Until departure"} />
          <Detail label="Delay" value={delayed ? `${s.delayMinutes} minutes` : "None"} />
          <Detail label="Bus" value={`${s.registrationNumber} (${s.busTypeName})`} />
          <Detail label="Actual departure" value={fmtStamp(s.actualDepartureAt)} />
          <Detail label="Actual arrival" value={fmtStamp(s.actualArrivalAt)} />
        </div>
      )}
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm h-36 animate-pulse flex">
      <div className="w-44 bg-gray-200 rounded-l-2xl" />
      <div className="flex-1 p-5 space-y-3"><div className="h-4 w-1/3 bg-gray-200 rounded" /><div className="h-4 w-2/3 bg-gray-100 rounded" /><div className="h-3 w-1/2 bg-gray-100 rounded" /></div>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

const WHEN = [
  { id: "all", label: "All upcoming" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "Next 7 days" },
];
const PAGE_SIZE = 10;

export default function Schedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [q, setQ] = useState("");
  const [route, setRoute] = useState("");
  const [when, setWhen] = useState("all");
  const [pickedDate, setPickedDate] = useState("");
  const [bookableOnly, setBookableOnly] = useState(false);
  const [sort, setSort] = useState("time");
  const [visible, setVisible] = useState(PAGE_SIZE);

  /* load automatically; refresh quietly every minute and when the tab regains focus */
  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await getAllSchedules(todayISO());
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setSchedules(list);
      setError("");
      setUpdatedAt(new Date());
    } catch {
      if (!silent) setError("We could not load the bus schedules. Check your connection and try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    const poll = setInterval(() => { if (!document.hidden) load(true); }, 60_000);
    const onVis = () => { if (!document.hidden) load(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(poll); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  useEffect(() => { stationApi.getActiveStations().then((r) => setStations(r.data?.data ?? r.data ?? [])).catch(() => {}); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [q, route, when, pickedDate, bookableOnly, sort]);

  const stationIdByName = useMemo(() => {
    const m = {}; stations.forEach((s) => { m[norm(s.name)] = s.id; }); return m;
  }, [stations]);

  const routes = useMemo(() => {
    const m = new Map(); schedules.forEach((s) => m.set(s.routeId, s.routeName));
    return [...m.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  }, [schedules]);

  const filtered = useMemo(() => {
    const t = todayISO();
    const needle = norm(q);
    const list = schedules.filter((s) => {
      if (pickedDate && s.journeyDate !== pickedDate) return false;
      if (!pickedDate) {
        if (when === "today" && s.journeyDate !== t) return false;
        if (when === "tomorrow" && s.journeyDate !== addDays(t, 1)) return false;
        if (when === "week" && !(s.journeyDate >= t && s.journeyDate <= addDays(t, 6))) return false;
      }
      if (route && String(s.routeId) !== String(route)) return false;
      if (bookableOnly && !bookability(s, now).ok) return false;
      if (needle) {
        const hay = norm([s.routeName, s.origin, s.destination, s.registrationNumber, s.busTypeName].join(" "));
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const byTime = (a, b) => departureDate(a) - departureDate(b);
    if (sort === "seats") list.sort((a, b) => Number(b.availableSeats) - Number(a.availableSeats) || byTime(a, b));
    else if (sort === "route") list.sort((a, b) => String(a.routeName).localeCompare(String(b.routeName)) || byTime(a, b));
    else list.sort(byTime);
    return list;
  }, [schedules, q, route, when, pickedDate, bookableOnly, sort, now]);

  const shown = filtered.slice(0, visible);
  const grouped = useMemo(() => {
    if (sort !== "time") return [{ key: "all", heading: null, items: shown }];
    const g = [];
    shown.forEach((s) => {
      const last = g[g.length - 1];
      if (last && last.key === s.journeyDate) last.items.push(s);
      else g.push({ key: s.journeyDate, heading: dayHeading(s.journeyDate), items: [s] });
    });
    return g;
  }, [shown, sort]);

  /* header summary */
  const summary = useMemo(() => {
    const open = schedules.filter((s) => bookability(s, now).ok);
    const next = [...open].sort((a, b) => departureDate(a) - departureDate(b))[0];
    return {
      trips: schedules.length,
      routes: new Set(schedules.map((s) => s.routeId)).size,
      seats: open.reduce((n, s) => n + Number(s.availableSeats || 0), 0),
      next,
    };
  }, [schedules, now]);

  const filtersOn = q || route || when !== "all" || pickedDate || bookableOnly;
  const clearFilters = () => { setQ(""); setRoute(""); setWhen("all"); setPickedDate(""); setBookableOnly(false); };

  const handleBook = (s) => {
    const from = stationIdByName[norm(s.origin)];
    const to = stationIdByName[norm(s.destination)];
    if (!from || !to) {
      toast.error("We could not match this route to a bus stand. Use Book Ticket to search instead.", { id: "no-station" });
      navigate("/user/book-ticket");
      return;
    }
    navigate(`/home/buses?from=${from}&to=${to}&date=${s.journeyDate}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* header */}
      <section className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-sm bg-gradient-to-br from-[#081935] via-[#0F2D2F] to-[#163F2D]">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-orange-500/10" aria-hidden="true" />
        <div className="absolute right-24 -bottom-16 w-44 h-44 rounded-full bg-green-400/10" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div className="max-w-xl">
            <h1 className="text-2xl md:text-3xl font-semibold">Bus schedules</h1>
            <p className="mt-1 text-sm text-green-100/80">Every upcoming trip across Arunachal Pradesh, updated live. Pick a trip and book your seats.</p>
            {summary.next ? (
              <p className="mt-4 text-sm flex items-center gap-2 text-orange-200">
                <FiClock className="shrink-0" />
                Next bus: {summary.next.origin} to {summary.next.destination} at {fmt12(summary.next.departureTime)}
                {leavesIn(departureDate(summary.next), now) ? `, leaves in ${leavesIn(departureDate(summary.next), now)}` : ""}
              </p>
            ) : !loading && <p className="mt-4 text-sm text-green-100/70">No trips are open for booking right now.</p>}
          </div>
          <dl className="flex gap-6 text-sm">
            <div><dt className="text-green-200/70 text-xs">Upcoming trips</dt><dd className="text-xl font-semibold">{summary.trips}</dd></div>
            <div><dt className="text-green-200/70 text-xs">Routes</dt><dd className="text-xl font-semibold">{summary.routes}</dd></div>
            <div><dt className="text-green-200/70 text-xs">Seats open</dt><dd className="text-xl font-semibold">{summary.seats}</dd></div>
          </dl>
        </div>
      </section>

      {/* filters */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-3 text-gray-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by route, place or bus number"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"><FiX /></button>}
          </div>
          <select value={route} onChange={(e) => setRoute(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-orange-400 lg:w-60">
            <option value="">All routes</option>
            {routes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <input
            type="date" value={pickedDate} min={todayISO()}
            onChange={(e) => { setPickedDate(e.target.value); }}
            aria-label="Pick a journey date"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 lg:w-44"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-orange-400 lg:w-48">
            <option value="time">Sort: Departure date</option>
            <option value="seats">Sort: Most seats free</option>
            <option value="route">Sort: Route name</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WHEN.map((w) => {
            const active = !pickedDate && when === w.id;
            return (
              <button key={w.id} onClick={() => { setWhen(w.id); setPickedDate(""); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"}`}>
                {w.label}
              </button>
            );
          })}
          <label className="flex items-center gap-2 ml-1 text-xs text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={bookableOnly} onChange={(e) => setBookableOnly(e.target.checked)} className="accent-orange-500 w-4 h-4" />
            Only trips I can book
          </label>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            {updatedAt && <span>Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>}
            <button onClick={() => load(true)} disabled={refreshing || loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* list */}
      {loading && <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}

      {!loading && error && (
        <div className="bg-white border border-red-100 rounded-2xl p-10 text-center shadow-sm">
          <FiAlertTriangle className="mx-auto w-8 h-8 text-red-400" />
          <p className="mt-3 text-sm text-gray-700">{error}</p>
          <button onClick={() => load(false)} className="mt-4 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold">Try again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <FiMapPin className="mx-auto w-8 h-8 text-gray-300" />
          <p className="mt-3 font-medium text-gray-700">{schedules.length === 0 ? "No upcoming trips are scheduled yet" : "No trips match these filters"}</p>
          <p className="mt-1 text-sm text-gray-500">{schedules.length === 0 ? "New schedules appear here as soon as they are published." : "Try another date or route, or clear the filters."}</p>
          {filtersOn && <button onClick={clearFilters} className="mt-4 px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Clear filters</button>}
        </div>
      )}

      {!loading && !error && grouped.map((g) => (
        <section key={g.key} className="space-y-3">
          {g.heading && (
            <div className="flex items-baseline gap-3 pt-1">
              <h2 className="text-lg font-semibold text-gray-800">{g.heading.title}</h2>
              <span className="text-sm text-gray-500">{g.heading.sub}</span>
              <span className="text-xs text-gray-400">{g.items.length} {g.items.length === 1 ? "trip" : "trips"}</span>
            </div>
          )}
          {g.items.map((s) => <ScheduleCard key={s.id} s={s} now={now} onBook={handleBook} />)}
        </section>
      ))}

      {!loading && !error && filtered.length > visible && (
        <div className="text-center pb-4">
          <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            Show {Math.min(PAGE_SIZE, filtered.length - visible)} more trips ({filtered.length - visible} remaining)
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && filtered.length <= visible && (
        <p className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-4"><FiCheckCircle /> You have seen all {filtered.length} trips</p>
      )}
    </div>
  );
}
