// import banner from "../../assets/banner.png";
// import busImg from "../../assets/Valley.png";
// import { useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import Breadcrumb from "../Website/Breadcrumb";


// function BusService() {
//   useEffect(() => {
//     document.title = "Bus Routes | APSTS Portal";
//   }, []);
//   const location = useLocation();
//   const busName = location.state?.bus || "Electric Bus";

//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);

// const [showRoute, setShowRoute] = useState(false);
// const [selectedRoute, setSelectedRoute] = useState(null);
//   const itemsPerPage = 5;

//  const timetable = [
//   {
//     from: "PASIGHAT",
//     to: "ROING",
//     time: "06:00 AM",
//     stops: [
//       { place: "PASIGHAT", time: "06:00 AM" },
//       { place: "ITANAGAR", time: "07:30 AM" },
//       { place: "NAHARLAGUN", time: "08:30 AM" },
//       { place: "ROING", time: "10:00 AM" },
//     ],
//   },
//   {
//     from: "RUKSIN",
//     to: "PASIGHAT",
//     time: "08:00 AM",
//     stops: [
//       { place: "RUKSIN", time: "08:00 AM" },
//       { place: "NIRJULI", time: "09:00 AM" },
//       { place: "ITANAGAR", time: "10:00 AM" },
//       { place: "PASIGHAT", time: "11:30 AM" },
//     ],
//   },
// ];

//   // 🔍 SEARCH
//   const filteredData = timetable.filter((item) =>
//     item.from.toLowerCase().includes(search.toLowerCase()) ||
//     item.to.toLowerCase().includes(search.toLowerCase())
//   );

//   // 📄 PAGINATION
//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);

//   const paginatedData = filteredData.slice(
//     (page - 1) * itemsPerPage,
//     page * itemsPerPage
//   );

//   return (
//     <div className="w-full bg-[#f5f7fa]">

//       {/* HERO */}
//       <div className="relative h-[250px] flex items-center px-10 pt-20 text-white">
//         <div
//           className="absolute inset-0 bg-center bg-cover"
//           style={{ backgroundImage: `url(${banner})` }}
//         ></div>

//         <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>

//         <div className="relative z-10">
//           <h1 className="text-4xl font-bold">
//             {busName} <span className="text-green-400">Services</span>
//           </h1>
//           <p className="text-gray-200">Explore routes and timetable</p>
//         </div>
//       </div>

//       {/* ✅ BREADCRUMB (same like OurHistory) */}
//       <Breadcrumb title={`${busName} Services`} />

//       {/* MAIN */}
//       <div className="p-8">

//         {/* TOP CARD */}
//         <div className="flex items-center gap-6 p-6 bg-white shadow rounded-2xl">
//           <img src={busImg} alt="" className="w-40 h-40 rounded-full" />

//           <div>
//             <h2 className="text-xl font-bold text-blue-700">
//               {busName} Services
//             </h2>
//             <p className="text-gray-500">{busName}</p>
//           </div>
//         </div>

//         {/* TABLE */}
//         <div className="p-6 mt-8 bg-white shadow rounded-2xl">

//           {/* TOP BAR */}
//           <div className="flex items-center justify-between mb-4">

//             {/* PRINT */}
//             <button
//               onClick={() => window.print()}
//               className="px-3 py-1 border rounded"
//             >
//               Print
//             </button>

//             {/* SEARCH */}
//             <input
//               type="text"
//               placeholder="Search..."
//               value={search}
//               onChange={(e) => {
//                 setSearch(e.target.value);
//                 setPage(1);
//               }}
//               className="px-3 py-1 border rounded"
//             />

//           </div>

//           {/* TABLE */}
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2">#</th>
//                 <th className="p-2">From</th>
//                 <th className="p-2">To</th>
//                 <th className="p-2">Time</th>
//                 <th className="p-2">Booking</th>
//                 <th className="p-2">Route</th>
//               </tr>
//             </thead>

//             <tbody>
//               {paginatedData.map((item, index) => (
//                 <tr key={index} className="text-center border-b hover:bg-gray-50">
//                   <td className="p-2">{index + 1}</td>
//                   <td className="p-2">{item.from}</td>
//                   <td className="p-2">{item.to}</td>
//                   <td className="p-2">{item.time}</td>

//                   <td className="p-2 font-semibold text-green-600">YES</td>

//                   <td className="p-2">
//            <button
//   onClick={() => {
//     setSelectedRoute(item);
//     setShowRoute(true);
//   }}
//   className="px-2 py-1 text-white bg-orange-500 rounded"
// >
//   →
// </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* PAGINATION */}
//           <div className="flex justify-between mt-4 text-sm">
//             <p>
//               Showing {paginatedData.length} of {filteredData.length}
//             </p>

//             <div className="flex gap-2">
//               <button
//                 disabled={page === 1}
//                 onClick={() => setPage(page - 1)}
//               >
//                 Prev
//               </button>

//               {[...Array(totalPages)].map((_, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setPage(i + 1)}
//                   className={page === i + 1 ? "font-bold" : ""}
//                 >
//                   {i + 1}
//                 </button>
//               ))}

//               <button
//                 disabled={page === totalPages}
//                 onClick={() => setPage(page + 1)}
//               >
//                 Next
//               </button>
//             </div>
//           </div>

//         </div>

//       </div>
// {showRoute && selectedRoute && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

//     <div className="w-[420px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6 relative">

//       {/* CLOSE */}
//       <button
//         onClick={() => setShowRoute(false)}
//         className="absolute flex items-center justify-center w-8 h-8 text-white bg-red-500 rounded-full top-3 right-3"
//       >
//         ✕
//       </button>

//       {/* TITLE */}
//       <h2 className="mb-6 text-lg font-semibold text-gray-800">
//         {selectedRoute.from} - {selectedRoute.to}
//       </h2>

//       {/* TIMELINE */}
//       <div className="relative pl-6">

//         {/* LINE */}
//      <div className="relative pl-8">

//   {/* LINE */}
//   <div className="absolute left-[10px] top-0 w-[2px] h-full bg-gray-300"></div>

//   {selectedRoute.stops.map((stop, index) => (
//     <div key={index} className="relative flex items-start mb-8">

//       {/* DOT */}
//       <div className="absolute left-[6px] top-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>

//       {/* TEXT */}
//       <div className="ml-6">
//         <p className="font-semibold text-gray-800">{stop.place}</p>
//         <p className="text-sm text-gray-500">{stop.time}</p>
//       </div>

//     </div>
//   ))}

//   <p className="ml-6 text-xs text-gray-400">approximate time!</p>

// </div>

      

//       </div>

//     </div>

//   </div>
// )}
//     </div>
//   );
// }

// export default BusService;




import banner from "../../assets/banner.png";
import busImg from "../../assets/Valley.png";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Breadcrumb from "../Website/Breadcrumb";
import Navbar from "../Website/Navbar";
import { stationApi } from "../../api/station";
import { timetableApi } from "../../api/timetable";
import toast from "react-hot-toast";

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function BusService() {
  const location = useLocation();
  const busName = location.state?.bus || null;

  const [stations, setStations] = useState([]);
  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [serviceType, setServiceType] = useState("");

  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const [showRoute, setShowRoute] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);

  // ── Load active stations for the From/To dropdowns ─────────────────────
  useEffect(() => {
    stationApi
      .getActiveStations()
      .then((res) => setStations(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Couldn't load stations. Please refresh."))
      .finally(() => setStationsLoading(false));
  }, []);

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!fromStationId || !toStationId) {
      toast.error("Please choose both a From and To station");
      return;
    }
    if (fromStationId === toStationId) {
      toast.error("From and To stations can't be the same");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setPage(1);
    try {
      const res = await timetableApi.search(
        fromStationId,
        toStationId,
        date,
        serviceType || undefined
      );
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openRoute = async (item) => {
    setSelectedRoute(item);
    setShowRoute(true);
    setRouteDetail(null);
    setRouteLoading(true);
    try {
      const res = await timetableApi.getScheduleRoute(item.scheduleId);
      setRouteDetail(res.data);
    } catch {
      toast.error("Couldn't load the route for this bus.");
    } finally {
      setRouteLoading(false);
    }
  };

  // 🔍 Filter current results by from/to/route text
  const filteredData = useMemo(
    () =>
      results.filter(
        (item) =>
          item.fromStationName?.toLowerCase().includes(search.toLowerCase()) ||
          item.toStationName?.toLowerCase().includes(search.toLowerCase()) ||
          item.routeName?.toLowerCase().includes(search.toLowerCase())
      ),
    [results, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="w-full bg-[#f5f7fa]">
      <Navbar />
      {/* HERO */}
      <div className="relative h-[250px] flex items-center px-10 pt-20 text-white">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold">
            {busName ? <>{busName} </> : "Bus Routes & "}
            <span className="text-green-400">
              {busName ? "Services" : "Timetable"}
            </span>
          </h1>
          <p className="text-gray-200">Search live routes, timings and fares</p>
        </div>
      </div>

      <Breadcrumb title="Bus Routes & Timetable" />

      {/* MAIN */}
      <div className="p-8">
        {/* TOP CARD */}
        <div className="flex items-center gap-6 p-6 bg-white shadow rounded-2xl">
          <img src={busImg} alt="" className="w-40 h-40 rounded-full object-cover" />

          <div>
            <h2 className="text-xl font-bold text-blue-700">Find Your Bus</h2>
            <p className="text-gray-500">
              Choose your stations and travel date to see live schedules
            </p>
          </div>
        </div>

        {/* SEARCH FORM */}
        <form
          onSubmit={runSearch}
          className="grid grid-cols-1 gap-4 p-6 mt-8 bg-white shadow rounded-2xl md:grid-cols-5"
        >
          <div className="md:col-span-1">
            <label className="block mb-1 text-xs font-medium text-gray-500">
              From
            </label>
            <select
              value={fromStationId}
              onChange={(e) => setFromStationId(e.target.value)}
              disabled={stationsLoading}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
            >
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block mb-1 text-xs font-medium text-gray-500">
              To
            </label>
            <select
              value={toStationId}
              onChange={(e) => setToStationId(e.target.value)}
              disabled={stationsLoading}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
            >
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block mb-1 text-xs font-medium text-gray-500">
              Journey Date
            </label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block mb-1 text-xs font-medium text-gray-500">
              Bus Type
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
            >
              <option value="">All types</option>
              <option value="EXPRESS">Express</option>
              <option value="DELUXE">Deluxe</option>
              <option value="SUPER_LUXURY">Super Luxury</option>
              <option value="ORDINARY">Ordinary</option>
            </select>
          </div>

          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white transition bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search Buses"}
            </button>
          </div>
        </form>

        {/* RESULTS */}
        <div className="p-6 mt-8 bg-white shadow rounded-2xl">
          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.print()}
              className="px-3 py-1 border rounded"
            >
              Print
            </button>

            <input
              type="text"
              placeholder="Filter results…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1 border rounded"
            />
          </div>

          {!hasSearched ? (
            <p className="py-10 text-center text-gray-400">
              Choose your From / To stations and a date, then hit{" "}
              <span className="font-medium">Search Buses</span> to see live
              schedules.
            </p>
          ) : loading ? (
            <p className="py-10 text-center text-gray-400">Loading buses…</p>
          ) : filteredData.length === 0 ? (
            <p className="py-10 text-center text-gray-400">
              No buses found for this route on {date}. Try another date.
            </p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Route</th>
                    <th className="p-2">From</th>
                    <th className="p-2">To</th>
                    <th className="p-2">Departure</th>
                    <th className="p-2">Bus Type</th>
                    <th className="p-2">Fare</th>
                    <th className="p-2">Seats</th>
                    <th className="p-2">Booking</th>
                    <th className="p-2">Route</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={item.scheduleId}
                      className="text-center border-b hover:bg-gray-50"
                    >
                      <td className="p-2">
                        {(page - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-2 font-medium">{item.routeName}</td>
                      <td className="p-2">{item.fromStationName}</td>
                      <td className="p-2">{item.toStationName}</td>
                      <td className="p-2">{item.boardingTime}</td>
                      <td className="p-2">{item.busTypeName}</td>
                      <td className="p-2">₹{item.fare}</td>
                      <td className="p-2">{item.availableSeats}</td>
                      <td
                        className={`p-2 font-semibold ${
                          item.onlineBookingAvailable
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {item.onlineBookingAvailable ? "YES" : "CLOSED"}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => openRoute(item)}
                          className="px-2 py-1 text-white bg-orange-500 rounded"
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <div className="flex justify-between mt-4 text-sm">
                <p>
                  Showing {paginatedData.length} of {filteredData.length}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Prev
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={page === i + 1 ? "font-bold text-orange-600" : ""}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SHOW ROUTE MODAL — now with real per-station arrival/departure times */}
      {showRoute && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[440px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setShowRoute(false)}
              className="absolute flex items-center justify-center w-8 h-8 text-white bg-red-500 rounded-full top-3 right-3"
            >
              ✕
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-800">
              {selectedRoute.fromStationName} → {selectedRoute.toStationName}
            </h2>
            <p className="mb-6 text-xs text-gray-400">
              {selectedRoute.routeName} · {selectedRoute.busTypeName}
            </p>

            {routeLoading ? (
              <p className="py-10 text-center text-gray-400">
                Loading route…
              </p>
            ) : !routeDetail ? (
              <p className="py-10 text-center text-gray-400">
                Route unavailable for this schedule.
              </p>
            ) : (
              <div className="relative pl-8">
                <div className="absolute left-[10px] top-0 w-[2px] h-full bg-gray-300"></div>

                {routeDetail.stops.map((stop) => (
                  <div
                    key={stop.stopSequence}
                    className="relative flex items-start mb-8"
                  >
                    <div className="absolute left-[6px] top-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>

                    <div className="ml-6">
                      <p className="font-semibold text-gray-800">
                        {stop.stationName}
                        {stop.nextDay && (
                          <span className="ml-1 text-[10px] font-medium text-orange-500">
                            +1 day
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Arrives {stop.arrivalTime}
                        {stop.arrivalTime !== stop.departureTime && (
                          <> · Departs {stop.departureTime}</>
                        )}
                      </p>
                      {stop.distanceFromOriginKm != null && (
                        <p className="text-xs text-gray-400">
                          {stop.distanceFromOriginKm} km from origin
                          {stop.haltDurationMin
                            ? ` · ${stop.haltDurationMin} min halt`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <p className="ml-6 text-xs text-gray-400">
                  Times shown are scheduled — actual arrival may vary.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BusService;