
// import { useState, useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import bgroad from "../../assets/bgroad.jpeg";
// import busImg from "../../assets/bus.png";
// import sideBg from "../../assets/side-bg.jpeg";
// import { searchAvailableSchedules } from "../../api/schedule"; // 
// import { stationApi } from "../../api/station";

// /* ─── helpers ──────────────────────────────────────────────────────────────── */

// function formatTime(t) {
//   if (!t) return "—";
//   const [h, m] = String(t).split(":");
//   const hour = parseInt(h, 10);
//   return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
// }

// function formatDate(d) {
//   if (!d) return "";
//   return new Date(d).toLocaleDateString("en-IN", {
//     day: "2-digit", month: "2-digit", year: "numeric",
//   });
// }

// /* ─── Progress Bar — exported so SeatSelection can reuse ───────────────────── */

// export const BOOKING_STEPS = ["Search", "Seat Selection", "Confirmation", "Payment", "Finish"];

// export function ProgressBar({ currentStep }) {
//   const pct = ((currentStep - 1) / (BOOKING_STEPS.length - 1)) * 100;
//   return (
//     <div className="p-4 mb-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">
//       <div className="relative flex items-center justify-between">
//         <div className="absolute w-full h-[2px] bg-white/20 top-4" />
//         <div
//           className="absolute h-[2px] bg-green-400 top-4 transition-all duration-500"
//           style={{ width: `${pct}%` }}
//         />
//         {BOOKING_STEPS.map((s, i) => (
//           <div key={i} className="z-10 text-center">
//             <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold
//               ${i < currentStep ? "bg-green-400 text-white" : "bg-white/20 text-gray-300"}`}>
//               {i + 1}
//             </div>
//             <p className={`text-xs mt-1 ${i === currentStep - 1 ? "text-green-400" : "text-gray-400"}`}>
//               {s}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ─── BusList ───────────────────────────────────────────────────────────────── */

// function BusList() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();

//   const fromId = searchParams.get("from");
//   const toId   = searchParams.get("to");
//   const date   = searchParams.get("date");

//   const [stations, setStations]   = useState([]);
//   const [schedules, setSchedules] = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [error, setError]         = useState("");

//   // We still fetch stations just to resolve human-readable names for the header
//   const fromStation = stations.find((s) => String(s.id) === fromId);
//   const toStation   = stations.find((s) => String(s.id) === toId);
//   const fromLabel   = fromStation?.name ?? `Station #${fromId}`;
//   const toLabel     = toStation?.name   ?? `Station #${toId}`;

  

//   useEffect(() => {
//     stationApi.getActiveStations()
//       .then((res) => setStations(res.data?.data ?? []))
//       .catch(() => {});
//   }, []);

//   // ── NEW: single API call replaces the old route→schedule→stops chain ──
//   useEffect(() => {
//     if (!fromId || !toId || !date) {
//       setError("Missing search parameters. Please go back and search again.");
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError("");

//     searchAvailableSchedules(Number(fromId), Number(toId), date)
//       .then((res) => {
//         // Backend returns List<ScheduleSearchResponse> directly
//         const data = res.data?.data ?? res.data ?? [];
//         setSchedules(Array.isArray(data) ? data : []);
//       })
//       .catch(() => setError("Failed to fetch buses. Please try again."))
//       .finally(() => setLoading(false));
//   }, [fromId, toId, date]);

//   // ── Navigate to seat selection — map new response fields to URL params ──
//   const handleBookNow = (sch) => {
//     const params = new URLSearchParams({
//       scheduleId:       sch.scheduleId,               // new field name (was sch.id)
//       from:             encodeURIComponent(fromLabel),
//       to:               encodeURIComponent(toLabel),
//       fromId:           fromId,
//       toId:             toId,
//       date:             date,
//       bus:              encodeURIComponent(`${sch.busRegistration ?? ""}${sch.busTypeName ? " | " + sch.busTypeName : ""}`),
//       departure:        sch.boardingTime ?? "",        // new: actual boarding time for this stop
//       routeId:          sch.routeId,
//       routeName:        encodeURIComponent(sch.routeName ?? ""),
//       fromStopSequence: sch.fromStopSequence,         // new: needed for seat inventory segment query
//       toStopSequence:   sch.toStopSequence,           // new: needed for seat inventory segment query
//       fare:             sch.fare ?? 0,                // new: pre-calculated by backend
//     });
//     navigate(`/home/seat-selection?${params.toString()}`);
//   };

//   return (
//     <div
//       className="w-full px-10 py-20 text-white bg-center bg-cover"
//       style={{ backgroundImage: `linear-gradient(120deg,#021B2B 20%,#0A3C4C 60%,#0F5132 100%),url(${bgroad})` }}
//     >
//       <ProgressBar currentStep={1} />

//       {/* Top bar */}
//       <div className="flex items-center justify-between px-6 py-4 border shadow-lg bg-white/10 backdrop-blur-xl border-white/20 rounded-xl">
//         <h2 className="text-lg font-medium tracking-wide uppercase">
//           {fromLabel} → {toLabel}
//         </h2>
//         <div className="flex items-center gap-4">
//           <div className="px-6 py-2 font-semibold rounded-lg bg-green-700/40">{formatDate(date)}</div>
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 px-5 py-2 bg-green-600 rounded-lg hover:bg-green-700"
//           >
//             ⟳ Modify Your Search
//           </button>
//         </div>
//       </div>

//       <div className="flex gap-6 mt-6">

//         {/* Filter sidebar — unchanged */}
//         <div className="relative w-[280px] rounded-xl overflow-hidden border border-white/20 shadow-lg">
//           <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${sideBg})` }} />
//           <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
//           <div className="relative z-10 p-5">
//             <h3 className="flex justify-between mb-4 text-lg font-semibold text-green-300">Filter <span>⚙️</span></h3>
//             <div className="mb-5">
//               <p className="mb-2 text-gray-300">Departure Time</p>
//               <label className="block mb-1 text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> 4 AM to 8 AM</label>
//               <label className="block text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM</label>
//             </div>
//             <div className="mb-5">
//               <p className="mb-2 text-gray-300">Arrival Time</p>
//               <label className="block mb-1 text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> Before 4 AM</label>
//               <label className="block text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM</label>
//             </div>
//             <div className="mb-5">
//               <p className="mb-2 text-gray-300">Bus Types</p>
//               <label className="block text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> Volvo</label>
//             </div>
//             <div>
//               <p className="mb-2 text-gray-300">Fare</p>
//               <div className="flex gap-2">
//                 <select className="px-2 py-1 border rounded bg-white/10 border-white/20"><option>Min</option></select>
//                 <span>to</span>
//                 <select className="px-2 py-1 border rounded bg-white/10 border-white/20"><option>Max</option></select>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Schedule cards */}
//         <div className="flex-1 space-y-6">
//           {loading && (
//             <div className="flex items-center justify-center py-20 text-gray-300">
//               <svg className="w-6 h-6 mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
//               </svg>
//               Searching for buses…
//             </div>
//           )}

//           {!loading && error && <div className="py-10 text-center text-red-300">{error}</div>}

//           {!loading && !error && schedules.length === 0 && (
//             <div className="py-10 text-center text-gray-400">
//               No buses found for this route on {formatDate(date)}.
//             </div>
//           )}

//           {!loading && !error && schedules.map((sch) => (
//             // ── KEY: use sch.scheduleId (new field) instead of sch.id ──
//             <div key={sch.scheduleId} className="flex overflow-hidden border shadow-lg rounded-xl border-white/20 bg-white/10 backdrop-blur-xl">
//               <div className="relative flex-1 p-6">
//                 <div className="absolute inset-0 bg-center bg-cover opacity-20" style={{ backgroundImage: `url(${busImg})` }} />
//                 <div className="relative z-10 flex items-center justify-between">
//                   <div>
//                     {/* busRegistration replaces registrationNumber */}
//                     <h3 className="text-xl font-semibold text-green-300">
//                       {sch.busRegistration ?? "—"}{sch.busTypeName ? ` | ${sch.busTypeName}` : ""}
//                     </h3>
//                     {/* routeName from new response; fallback to fromLabel→toLabel */}
//                     <p className="mt-1 text-gray-300 uppercase">
//                       {sch.routeName ?? `${fromLabel} → ${toLabel}`}
//                     </p>
//                   </div>

//                   <div className="text-center">
//                     {/* boardingTime = schedule departure + stop offset, pre-calculated */}
//                     <p className="text-sm text-gray-400">Boarding</p>
//                     <p className="text-xl font-semibold">{formatTime(sch.boardingTime)}</p>
//                     <div className="w-24 h-[2px] bg-green-400 mx-auto my-1" />
//                     {/* droppingTime = schedule departure + destination stop offset */}
//                     <p className="text-sm text-gray-400">Dropping</p>
//                     <p className="text-xl font-semibold">{formatTime(sch.droppingTime)}</p>
//                   </div>

//                   <div className="text-center">
//                     {/* availableSeats now reflects only the from→to segment, not full bus */}
//                     <p className="text-lg font-semibold">{sch.availableSeats ?? "—"}</p>
//                     <p className="text-xs text-gray-400">Seats Available</p>
//                     <p className="text-xs text-gray-500 mt-1">
//                       {sch.journeyDate}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex gap-6 pt-3 mt-6 text-sm text-gray-400 border-t border-white/10">
//                   <span>📍 Boarding & Dropping Points</span>
//                   <span>⭐ Reviews</span>
//                 </div>
//               </div>

//               <div className="w-[220px] bg-gradient-to-b from-green-900/40 to-green-700/40 flex flex-col justify-center items-center p-6">
//                 {/* fare is pre-calculated by backend (toStop.fare - fromStop.fare) */}
//                 <p className="text-3xl font-bold">
//                   {sch.fare != null
//                     ? `₹ ${Number(sch.fare).toFixed(0)}`
//                     : "—"}
//                 </p>
//                 <p className="text-sm text-gray-300">Per seat</p>
//                 <button
//                  onClick={() => handleBookNow(sch)}
//                  disabled={!sch.isBookingOpen}
//                  className="px-6 py-2 mt-4 font-semibold bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
//                >
//                  {sch.isBookingOpen ? "Book Now" : "Booking Closed"}
//                </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BusList;





import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bgroad from "../../assets/bgroad.jpeg";
import busImg from "../../assets/bus.png";
import sideBg from "../../assets/side-bg.jpeg";
import { searchAvailableSchedules } from "../../api/schedule";
import { stationApi } from "../../api/station";
import { useAuth } from "../../context/AuthContext";
import { classifyRole } from "../../constants/roles";
import { isoToDMY, validateJourneyDate } from "../../utils/dateUtils";
import { formatINR } from "../../utils/money";

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
const minutesOf = (t) => { if (!t) return null; const [h, m] = String(t).split(":"); return parseInt(h, 10) * 60 + parseInt(m, 10); };

/* ─── Progress Bar — exported so SeatSelection can reuse ─── */
export const BOOKING_STEPS = ["Search", "Seat Selection", "Confirmation", "Payment", "Finish"];
export function ProgressBar({ currentStep }) {
  const pct = ((currentStep - 1) / (BOOKING_STEPS.length - 1)) * 100;
  return (
    <div className="p-4 mb-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">
      <div className="relative flex items-center justify-between">
        <div className="absolute w-full h-[2px] bg-white/20 top-4" />
        <div className="absolute h-[2px] bg-green-400 top-4 transition-all duration-500" style={{ width: `${pct}%` }} />
        {BOOKING_STEPS.map((s, i) => (
          <div key={i} className="z-10 text-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${i < currentStep ? "bg-green-400 text-white" : "bg-white/20 text-gray-300"}`}>{i + 1}</div>
            <p className={`text-xs mt-1 ${i === currentStep - 1 ? "text-green-400" : "text-gray-400"}`}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── filter definitions (minutes from midnight, [from, to)) ─── */
const DEPARTURE = [
  { id: "d1", label: "Before 4 AM",  from: 0,    to: 240 },
  { id: "d2", label: "4 AM to 8 AM", from: 240,  to: 480 },
  { id: "d3", label: "8 AM to 4 PM", from: 480,  to: 960 },
  { id: "d4", label: "4 PM to 8 PM", from: 960,  to: 1200 },
  { id: "d5", label: "After 8 PM",   from: 1200, to: 1441 },
];
const ARRIVAL = DEPARTURE;

const inAny = (ids, defs, t) => {
  if (ids.length === 0) return true;
  const m = minutesOf(t);
  if (m === null) return false;
  return defs.filter((d) => ids.includes(d.id)).some((d) => m >= d.from && m < d.to);
};

function CheckGroup({ title, options, selected, onToggle }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-gray-300">{title}</p>
      {options.map((o) => (
        <label key={o.id} className="block mb-1 text-sm cursor-pointer">
          <input type="checkbox" className="mr-2 accent-green-400" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export default function BusList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");
  const date = searchParams.get("date");

  const [stations, setStations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [dep, setDep] = useState([]);
  const [arr, setArr] = useState([]);
  const [types, setTypes] = useState([]);
  const [minFare, setMinFare] = useState("");
  const [maxFare, setMaxFare] = useState("");
  const toggle = (setter) => (id) => setter((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const fromLabel = stations.find((s) => String(s.id) === fromId)?.name ?? `Station #${fromId}`;
  const toLabel = stations.find((s) => String(s.id) === toId)?.name ?? `Station #${toId}`;

  useEffect(() => { stationApi.getActiveStations().then((r) => setStations(r.data?.data ?? [])).catch(() => {}); }, []);

  useEffect(() => {
    const dateErr = validateJourneyDate(date);
    if (!fromId || !toId || dateErr) {                       // invalid dates never reach the API
      setError(!fromId || !toId ? "Missing search parameters. Please go back and search again." : `${dateErr}. Please modify your search.`);
      setLoading(false);
      return;
    }
    setLoading(true); setError("");
    searchAvailableSchedules(Number(fromId), Number(toId), date)
      .then((res) => { const d = res.data?.data ?? res.data ?? []; setSchedules(Array.isArray(d) ? d : []); })
      .catch(() => setError("Failed to fetch buses. Please try again."))
      .finally(() => setLoading(false));
  }, [fromId, toId, date]);

  const busTypeOptions = useMemo(() => [...new Set(schedules.map((s) => s.busTypeName).filter(Boolean))], [schedules]);
  const fareOptions = useMemo(() => [...new Set(schedules.map((s) => Math.round(Number(s.fare ?? 0))))].sort((a, b) => a - b), [schedules]);

  const visible = useMemo(() => schedules.filter((s) => {
    const fare = Number(s.fare ?? 0);
    return inAny(dep, DEPARTURE, s.boardingTime)
      && inAny(arr, ARRIVAL, s.droppingTime)
      && (types.length === 0 || types.includes(s.busTypeName))
      && (minFare === "" || fare >= Number(minFare))
      && (maxFare === "" || fare <= Number(maxFare));
  }), [schedules, dep, arr, types, minFare, maxFare]);

  const clearFilters = () => { setDep([]); setArr([]); setTypes([]); setMinFare(""); setMaxFare(""); };
  const filtersOn = dep.length || arr.length || types.length || minFare !== "" || maxFare !== "";

  const handleBookNow = (sch) => {
    const params = new URLSearchParams({
      scheduleId: sch.scheduleId,
      from: encodeURIComponent(fromLabel), to: encodeURIComponent(toLabel),
      fromId, toId, date,
      bus: encodeURIComponent(`${sch.busRegistration ?? ""}${sch.busTypeName ? " | " + sch.busTypeName : ""}`),
      departure: sch.boardingTime ?? "",
      routeId: sch.routeId, routeName: encodeURIComponent(sch.routeName ?? ""),
      fromStopSequence: sch.fromStopSequence, toStopSequence: sch.toStopSequence, fare: sch.fare ?? 0,
    });
   const seatSelectionPath = window.location.pathname.startsWith("/user")
  ? "/user/seat-selection"
  : "/home/seat-selection";

navigate(`${seatSelectionPath}?${params.toString()}`);
  };

  const home = user ? (classifyRole(user?.roles ?? []) === "counter" ? "/counter/dashboard" : "/user/dashboard") : "/home";

  return (
    <div className="w-full px-10 py-8 text-white bg-center bg-cover min-h-screen"
         style={{ backgroundImage: `linear-gradient(120deg,#021B2B 20%,#0A3C4C 60%,#0F5132 100%),url(${bgroad})` }}>
      {user && (   /* slim bar replaces the public navbar for logged-in users */
        <div className="flex items-center justify-between mb-6 text-sm">
          <button onClick={() => navigate(home)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">← Dashboard</button>
          <span className="text-white/70">Arunachal Pradesh State Transport Services</span>
        </div>
      )}
      {!user && <div className="h-14" />}

      <ProgressBar currentStep={1} />

      <div className="flex items-center justify-between px-6 py-4 border shadow-lg bg-white/10 backdrop-blur-xl border-white/20 rounded-xl">
        <h2 className="text-lg font-medium tracking-wide uppercase">{fromLabel} → {toLabel}</h2>
        <div className="flex items-center gap-4">
          <div className="px-6 py-2 font-semibold rounded-lg bg-green-700/40">{isoToDMY(date) || "—"}</div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2 bg-green-600 rounded-lg hover:bg-green-700">⟳ Modify Your Search</button>
        </div>
      </div>

      <div className="flex gap-6 mt-6">
        {/* Filter sidebar – now wired */}
        <div className="relative w-[280px] shrink-0 self-start rounded-xl overflow-hidden border border-white/20 shadow-lg">
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${sideBg})` }} />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative z-10 p-5">
            <h3 className="flex justify-between mb-4 text-lg font-semibold text-green-300">
              Filter {filtersOn ? <button onClick={clearFilters} className="text-xs font-normal underline">Clear</button> : <span>⚙️</span>}
            </h3>
            <CheckGroup title="Departure Time" options={DEPARTURE} selected={dep} onToggle={toggle(setDep)} />
            <CheckGroup title="Arrival Time" options={ARRIVAL} selected={arr} onToggle={toggle(setArr)} />
            {busTypeOptions.length > 0 && (
              <CheckGroup title="Bus Types" options={busTypeOptions.map((t) => ({ id: t, label: t }))} selected={types} onToggle={toggle(setTypes)} />
            )}
            <div>
              <p className="mb-2 text-gray-300">Fare</p>
              <div className="flex items-center gap-2">
                <select value={minFare} onChange={(e) => setMinFare(e.target.value)} className="px-2 py-1 text-white border rounded bg-black/40 border-white/20">
                  <option value="">Min</option>{fareOptions.map((f) => <option key={f} value={f}>₹{f}</option>)}
                </select>
                <span>to</span>
                <select value={maxFare} onChange={(e) => setMaxFare(e.target.value)} className="px-2 py-1 text-white border rounded bg-black/40 border-white/20">
                  <option value="">Max</option>{fareOptions.map((f) => <option key={f} value={f}>₹{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {loading && <div className="py-20 text-center text-gray-300">Searching for buses…</div>}
          {!loading && error && <div className="py-10 text-center text-red-300">{error}</div>}
          {!loading && !error && schedules.length === 0 && (
            <div className="py-10 text-center text-gray-400">No buses found for this route on {isoToDMY(date)}.</div>
          )}
          {!loading && !error && schedules.length > 0 && visible.length === 0 && (
            <div className="py-10 text-center text-gray-300">
              No buses match the selected filters. <button onClick={clearFilters} className="underline">Clear filters</button>
            </div>
          )}
          {!loading && !error && visible.map((sch) => (
            <div key={sch.scheduleId} className="flex overflow-hidden border shadow-lg rounded-xl border-white/20 bg-white/10 backdrop-blur-xl">
              <div className="relative flex-1 p-6">
                <div className="absolute inset-0 bg-center bg-cover opacity-20" style={{ backgroundImage: `url(${busImg})` }} />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-green-300">{sch.busRegistration ?? "—"}{sch.busTypeName ? ` | ${sch.busTypeName}` : ""}</h3>
                    <p className="mt-1 text-gray-300 uppercase">{sch.routeName ?? `${fromLabel} → ${toLabel}`}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Boarding</p>
                    <p className="text-xl font-semibold">{formatTime(sch.boardingTime)}</p>
                    <div className="w-24 h-[2px] bg-green-400 mx-auto my-1" />
                    <p className="text-sm text-gray-400">Dropping</p>
                    <p className="text-xl font-semibold">{formatTime(sch.droppingTime)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{sch.availableSeats ?? "—"}</p>
                    <p className="text-xs text-gray-400">Seats Available</p>
                    <p className="mt-1 text-xs text-gray-500">{isoToDMY(sch.journeyDate)}</p>
                  </div>
                </div>
                <div className="flex gap-6 pt-3 mt-6 text-sm text-gray-400 border-t border-white/10">
                  <span>📍 Boarding & Dropping Points</span><span>⭐ Reviews</span>
                </div>
              </div>
              <div className="w-[220px] bg-gradient-to-b from-green-900/40 to-green-700/40 flex flex-col justify-center items-center p-6">
                <p className="text-3xl font-bold">{sch.fare != null ? formatINR(sch.fare).replace(".00", "") : "—"}</p>
                <p className="text-sm text-gray-300">Per seat</p>
                <button onClick={() => handleBookNow(sch)} disabled={!sch.isBookingOpen}
                        className="px-6 py-2 mt-4 font-semibold bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {sch.isBookingOpen ? "Book Now" : "Booking Closed"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}