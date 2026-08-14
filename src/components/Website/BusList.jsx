// import { useState, useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import bgroad from "../../assets/bgroad.jpeg";
// import busImg from "../../assets/bus.png";
// import sideBg from "../../assets/side-bg.jpeg";
// import { getRoutesBetweenStations, getStops } from "../../api/route";
// import { searchSchedulesByRoute } from "../../api/schedule";
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

//   const fromStation = stations.find((s) => String(s.id) === fromId);
//   const toStation   = stations.find((s) => String(s.id) === toId);
//   const fromLabel   = fromStation?.name ?? `Station #${fromId}`;
//   const toLabel     = toStation?.name   ?? `Station #${toId}`;

//   useEffect(() => {
//     stationApi.getActiveStations()
//       .then((res) => setStations(res.data?.data ?? []))
//       .catch(() => {});
//   }, []);

//   useEffect(() => {
//     if (!fromId || !toId || !date) {
//       setError("Missing search parameters. Please go back and search again.");
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError("");

//     getRoutesBetweenStations(Number(fromId), Number(toId))
//       .then(async (routeRes) => {
//         const routes = routeRes.data?.data ?? [];
//         if (routes.length === 0) { setSchedules([]); setLoading(false); return; }

//         // For each route, fetch schedules AND route stops in parallel
//         const results = await Promise.allSettled(
//           routes.map(async (route) => {
//             const [schedRes, stopsRes] = await Promise.all([
//               searchSchedulesByRoute(route.id, date),
//               getStops(route.id),
//             ]);
//             const stops     = stopsRes.data?.data ?? stopsRes.data ?? [];
//             const fromStop  = stops.find((s) => s.stationId === Number(fromId));
//             const toStop    = stops.find((s) => s.stationId === Number(toId));

//             return (Array.isArray(schedRes.data) ? schedRes.data : []).map((sch) => ({
//               ...sch,
//               route,
//               fromStop,
//               toStop,
//             }));
//           })
//         );

//         setSchedules(
//           results.filter((r) => r.status === "fulfilled").flatMap((r) => r.value)
//         );
//       })
//       .catch(() => setError("Failed to fetch buses. Please try again."))
//       .finally(() => setLoading(false));
//   }, [fromId, toId, date]);

//   const handleBookNow = (sch) => {
//     // Pass everything SeatSelection needs via URL params
//     const params = new URLSearchParams({
//       scheduleId: sch.id,
//       from:        encodeURIComponent(sch.origin  ?? fromLabel),
//       to:          encodeURIComponent(sch.destination ?? toLabel),
//       fromId:      fromId,
//       toId:        toId,
//       fromStopId:  sch.fromStop?.id ?? "",
//       toStopId:    sch.toStop?.id   ?? "",
//       date:        date,
//       bus:         encodeURIComponent(`${sch.registrationNumber ?? ""}${sch.busTypeName ? " | " + sch.busTypeName : ""}`),
//       departure:   sch.departureTime ?? "",
//       routeId:     sch.routeId ?? "",
//     });
//     navigate(`/ap/seat-selection?${params.toString()}`);
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

//         {/* Filter sidebar */}
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
//             <div key={sch.id} className="flex overflow-hidden border shadow-lg rounded-xl border-white/20 bg-white/10 backdrop-blur-xl">
//               <div className="relative flex-1 p-6">
//                 <div className="absolute inset-0 bg-center bg-cover opacity-20" style={{ backgroundImage: `url(${busImg})` }} />
//                 <div className="relative z-10 flex items-center justify-between">
//                   <div>
//                     <h3 className="text-xl font-semibold text-green-300">
//                       {sch.registrationNumber ?? "—"}{sch.busTypeName ? ` | ${sch.busTypeName}` : ""}
//                     </h3>
//                     <p className="mt-1 text-gray-300 uppercase">
//                       {sch.origin ?? fromLabel} → {sch.destination ?? toLabel}
//                     </p>
//                     {sch.tripStatus && (
//                       <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-green-700/50 text-green-200">
//                         {sch.tripStatus}
//                       </span>
//                     )}
//                   </div>
//                   <div className="text-center">
//                     <p className="text-xl font-semibold">{formatTime(sch.departureTime)}</p>
//                     <div className="w-24 h-[2px] bg-green-400 mx-auto my-1" />
//                     {sch.route?.distanceKm && (
//                       <p className="text-xs text-gray-400">{sch.route.distanceKm} Km</p>
//                     )}
//                   </div>
//                   <div className="text-center">
//                     <p className="text-lg font-semibold">{sch.availableSeats ?? "—"}</p>
//                     <p className="text-xs text-gray-400">Available Seats</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-6 pt-3 mt-6 text-sm text-gray-400 border-t border-white/10">
//                   <span>📍 Boarding & Dropping Points</span>
//                   <span>⭐ Reviews</span>
//                 </div>
//               </div>

//               <div className="w-[220px] bg-gradient-to-b from-green-900/40 to-green-700/40 flex flex-col justify-center items-center p-6">
//                 {/* Fare shown from route stop baseFareFromOrigin if available */}
//                 <p className="text-3xl font-bold">
//                   {sch.fromStop?.baseFareFromOrigin && sch.toStop?.baseFareFromOrigin
//                     ? `₹ ${Math.abs(sch.toStop.baseFareFromOrigin - sch.fromStop.baseFareFromOrigin).toFixed(0)}`
//                     : "—"}
//                 </p>
//                 <p className="text-sm text-gray-300">Per seat</p>
//                 <button
//                   onClick={() => handleBookNow(sch)}
//                   disabled={!sch.isBookingOpen}
//                   className="px-6 py-2 mt-4 font-semibold bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {sch.isBookingOpen ? "Book Now" : "Booking Closed"}
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BusList;


import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bgroad from "../../assets/bgroad.jpeg";
import busImg from "../../assets/bus.png";
import sideBg from "../../assets/side-bg.jpeg";
import { searchAvailableSchedules } from "../../api/schedule"; // 
import { stationApi } from "../../api/station";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/* ─── Progress Bar — exported so SeatSelection can reuse ───────────────────── */

export const BOOKING_STEPS = ["Search", "Seat Selection", "Confirmation", "Payment", "Finish"];

export function ProgressBar({ currentStep }) {
  const pct = ((currentStep - 1) / (BOOKING_STEPS.length - 1)) * 100;
  return (
    <div className="p-4 mb-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">
      <div className="relative flex items-center justify-between">
        <div className="absolute w-full h-[2px] bg-white/20 top-4" />
        <div
          className="absolute h-[2px] bg-green-400 top-4 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        {BOOKING_STEPS.map((s, i) => (
          <div key={i} className="z-10 text-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold
              ${i < currentStep ? "bg-green-400 text-white" : "bg-white/20 text-gray-300"}`}>
              {i + 1}
            </div>
            <p className={`text-xs mt-1 ${i === currentStep - 1 ? "text-green-400" : "text-gray-400"}`}>
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BusList ───────────────────────────────────────────────────────────────── */

function BusList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromId = searchParams.get("from");
  const toId   = searchParams.get("to");
  const date   = searchParams.get("date");

  const [stations, setStations]   = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // We still fetch stations just to resolve human-readable names for the header
  const fromStation = stations.find((s) => String(s.id) === fromId);
  const toStation   = stations.find((s) => String(s.id) === toId);
  const fromLabel   = fromStation?.name ?? `Station #${fromId}`;
  const toLabel     = toStation?.name   ?? `Station #${toId}`;

  

  useEffect(() => {
    stationApi.getActiveStations()
      .then((res) => setStations(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  // ── NEW: single API call replaces the old route→schedule→stops chain ──
  useEffect(() => {
    if (!fromId || !toId || !date) {
      setError("Missing search parameters. Please go back and search again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    searchAvailableSchedules(Number(fromId), Number(toId), date)
      .then((res) => {
        // Backend returns List<ScheduleSearchResponse> directly
        const data = res.data?.data ?? res.data ?? [];
        setSchedules(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to fetch buses. Please try again."))
      .finally(() => setLoading(false));
  }, [fromId, toId, date]);

  // ── Navigate to seat selection — map new response fields to URL params ──
  const handleBookNow = (sch) => {
    const params = new URLSearchParams({
      scheduleId:       sch.scheduleId,               // new field name (was sch.id)
      from:             encodeURIComponent(fromLabel),
      to:               encodeURIComponent(toLabel),
      fromId:           fromId,
      toId:             toId,
      date:             date,
      bus:              encodeURIComponent(`${sch.busRegistration ?? ""}${sch.busTypeName ? " | " + sch.busTypeName : ""}`),
      departure:        sch.boardingTime ?? "",        // new: actual boarding time for this stop
      routeId:          sch.routeId,
      routeName:        encodeURIComponent(sch.routeName ?? ""),
      fromStopSequence: sch.fromStopSequence,         // new: needed for seat inventory segment query
      toStopSequence:   sch.toStopSequence,           // new: needed for seat inventory segment query
      fare:             sch.fare ?? 0,                // new: pre-calculated by backend
    });
    navigate(`/home/seat-selection?${params.toString()}`);
  };

  return (
    <div
      className="w-full px-10 py-20 text-white bg-center bg-cover"
      style={{ backgroundImage: `linear-gradient(120deg,#021B2B 20%,#0A3C4C 60%,#0F5132 100%),url(${bgroad})` }}
    >
      <ProgressBar currentStep={1} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border shadow-lg bg-white/10 backdrop-blur-xl border-white/20 rounded-xl">
        <h2 className="text-lg font-medium tracking-wide uppercase">
          {fromLabel} → {toLabel}
        </h2>
        <div className="flex items-center gap-4">
          <div className="px-6 py-2 font-semibold rounded-lg bg-green-700/40">{formatDate(date)}</div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 rounded-lg hover:bg-green-700"
          >
            ⟳ Modify Your Search
          </button>
        </div>
      </div>

      <div className="flex gap-6 mt-6">

        {/* Filter sidebar — unchanged */}
        <div className="relative w-[280px] rounded-xl overflow-hidden border border-white/20 shadow-lg">
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${sideBg})` }} />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative z-10 p-5">
            <h3 className="flex justify-between mb-4 text-lg font-semibold text-green-300">Filter <span>⚙️</span></h3>
            <div className="mb-5">
              <p className="mb-2 text-gray-300">Departure Time</p>
              <label className="block mb-1 text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> 4 AM to 8 AM</label>
              <label className="block text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM</label>
            </div>
            <div className="mb-5">
              <p className="mb-2 text-gray-300">Arrival Time</p>
              <label className="block mb-1 text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> Before 4 AM</label>
              <label className="block text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM</label>
            </div>
            <div className="mb-5">
              <p className="mb-2 text-gray-300">Bus Types</p>
              <label className="block text-sm"><input type="checkbox" className="mr-2 accent-green-400" /> Volvo</label>
            </div>
            <div>
              <p className="mb-2 text-gray-300">Fare</p>
              <div className="flex gap-2">
                <select className="px-2 py-1 border rounded bg-white/10 border-white/20"><option>Min</option></select>
                <span>to</span>
                <select className="px-2 py-1 border rounded bg-white/10 border-white/20"><option>Max</option></select>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule cards */}
        <div className="flex-1 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20 text-gray-300">
              <svg className="w-6 h-6 mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Searching for buses…
            </div>
          )}

          {!loading && error && <div className="py-10 text-center text-red-300">{error}</div>}

          {!loading && !error && schedules.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              No buses found for this route on {formatDate(date)}.
            </div>
          )}

          {!loading && !error && schedules.map((sch) => (
            // ── KEY: use sch.scheduleId (new field) instead of sch.id ──
            <div key={sch.scheduleId} className="flex overflow-hidden border shadow-lg rounded-xl border-white/20 bg-white/10 backdrop-blur-xl">
              <div className="relative flex-1 p-6">
                <div className="absolute inset-0 bg-center bg-cover opacity-20" style={{ backgroundImage: `url(${busImg})` }} />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    {/* busRegistration replaces registrationNumber */}
                    <h3 className="text-xl font-semibold text-green-300">
                      {sch.busRegistration ?? "—"}{sch.busTypeName ? ` | ${sch.busTypeName}` : ""}
                    </h3>
                    {/* routeName from new response; fallback to fromLabel→toLabel */}
                    <p className="mt-1 text-gray-300 uppercase">
                      {sch.routeName ?? `${fromLabel} → ${toLabel}`}
                    </p>
                  </div>

                  <div className="text-center">
                    {/* boardingTime = schedule departure + stop offset, pre-calculated */}
                    <p className="text-sm text-gray-400">Boarding</p>
                    <p className="text-xl font-semibold">{formatTime(sch.boardingTime)}</p>
                    <div className="w-24 h-[2px] bg-green-400 mx-auto my-1" />
                    {/* droppingTime = schedule departure + destination stop offset */}
                    <p className="text-sm text-gray-400">Dropping</p>
                    <p className="text-xl font-semibold">{formatTime(sch.droppingTime)}</p>
                  </div>

                  <div className="text-center">
                    {/* availableSeats now reflects only the from→to segment, not full bus */}
                    <p className="text-lg font-semibold">{sch.availableSeats ?? "—"}</p>
                    <p className="text-xs text-gray-400">Seats Available</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sch.journeyDate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 pt-3 mt-6 text-sm text-gray-400 border-t border-white/10">
                  <span>📍 Boarding & Dropping Points</span>
                  <span>⭐ Reviews</span>
                </div>
              </div>

              <div className="w-[220px] bg-gradient-to-b from-green-900/40 to-green-700/40 flex flex-col justify-center items-center p-6">
                {/* fare is pre-calculated by backend (toStop.fare - fromStop.fare) */}
                <p className="text-3xl font-bold">
                  {sch.fare != null
                    ? `₹ ${Number(sch.fare).toFixed(0)}`
                    : "—"}
                </p>
                <p className="text-sm text-gray-300">Per seat</p>
                <button
                 onClick={() => handleBookNow(sch)}
                 disabled={!sch.isBookingOpen}
                 className="px-6 py-2 mt-4 font-semibold bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
               >
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

export default BusList;