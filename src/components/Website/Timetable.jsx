import { useState, useEffect } from "react";
import banner from "../../assets/banner.png";
import Navbar from "../Website/Navbar";
import Breadcrumb from "../Website/Breadcrumb";
import { FaSearch, FaBus, FaClock, FaMapMarkerAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { stationApi } from "../../api/station";
import { cmsApi } from "../../api/cms";

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatTime(t) {
  if (!t) return "—";
  if (typeof t === "string") {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  if (typeof t === "object") {
    const { hour = 0, minute = 0 } = t;
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
  }
  return String(t);
}

// ── RouteModal ────────────────────────────────────────────────────────────────

function RouteModal({ schedule, onClose }) {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    cmsApi.getRouteOfSchedule({ scheduleId: schedule.scheduleId })  // ← was timetableApi.getRouteOfSchedule(schedule.scheduleId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        const stops = data?.routeStops ?? data?.stops ?? data ?? [];
        setStops(Array.isArray(stops) ? stops : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.response?.data?.message ?? "Failed to load route.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [schedule.scheduleId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-bold text-gray-800">
              {schedule.fromStationName} → {schedule.toStationName}
            </h3>
            {schedule.routeNumber && (
              <p className="text-xs text-gray-500 mt-0.5">
                {schedule.routeNumber} | {schedule.busTypeName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading && (
            <p className="text-center text-sm text-gray-400 py-8">Loading route…</p>
          )}
          {!loading && error && (
            <p className="text-center text-sm text-red-500 py-8">{error}</p>
          )}
          {!loading && !error && stops.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              No route information available.
            </p>
          )}
          {!loading && !error && stops.length > 0 && (
            <div className="relative py-2">

              {/* vertical line */}
              <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-gray-200" />

              {stops.map((stop, i) => {
                const isFirst = i === 0;
                const isLast = i === stops.length - 1;

                return (
                  <div key={stop.id ?? i} className="flex gap-3 py-3 relative">

                    {/* solid circle */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shadow-sm
              ${isFirst
                            ? "bg-green-500"
                            : isLast
                              ? "bg-red-500"
                              : "bg-orange-400"
                          }`}
                      />
                    </div>

                    {/* station info */}
                    <div className="flex-1 -mt-1">

                      {/* station name */}
                      <p className="text-sm font-medium text-gray-800 leading-tight">
                        {stop.stationName ?? stop.name ?? "—"}
                      </p>

                      {/* ultra compact timing */}
                      {(stop.arrivalTime || stop.departureTime) && (
                        <p className="text-[11px] text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                          {stop.arrivalTime && (
                            <span className="px-1.5 py-[1px] rounded bg-blue-50 text-blue-600">
                              A {formatTime(stop.arrivalTime)}
                            </span>
                          )}

                          {stop.departureTime && (
                            <span className="px-1.5 py-[1px] rounded bg-green-50 text-green-600">
                              D {formatTime(stop.departureTime)}
                            </span>
                          )}
                        </p>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ScheduleCard ──────────────────────────────────────────────────────────────

function ScheduleCard({ item, onShowRoute }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-bold text-gray-800">
            {item.routeNumber ?? item.routeName}
          </span>
          {item.busTypeName && (
            <span className="text-gray-500 text-sm">| {item.busTypeName}</span>
          )}
          {item.onlineBookingAvailable ? (
            <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Online Booking available
            </span>
          ) : (
            <span className="text-xs text-red-600 font-medium">Booking Closed</span>
          )}
        </div>

        <div className="flex items-start gap-6">
          <div>
            <p className="text-xl font-bold text-gray-800">{formatTime(item.boardingTime)}</p>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
              {item.fromStationName}
            </p>
          </div>
          <div className="flex flex-col items-center pt-2 text-gray-300">
            <FaBus className="text-gray-400 text-sm" />
            <div className="w-16 h-px bg-gray-200 mt-1" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">{formatTime(item.droppingTime)}</p>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
              {item.toStationName}
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 flex-shrink-0">
        <div className="text-right">
          {item.fare != null && (
            <p className="text-xl font-bold text-green-600">₹{item.fare}</p>
          )}
          <p className="text-xs text-gray-500">
            {item.availableSeats} seat{item.availableSeats !== 1 ? "s" : ""} left
          </p>
        </div>
        <button
          onClick={() => onShowRoute(item)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition whitespace-nowrap"
        >
          <FaBus className="text-xs" />
          Show Route
        </button>
      </div>
    </div>
  );
}

// ── Timetable ─────────────────────────────────────────────────────────────────

function Timetable() {
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [formData, setFormData] = useState({
    fromStationId: "",
    toStationId: "",
    date: "",
    serviceType: "",
  });
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [searched, setSearched] = useState(false);
  const [routeModal, setRouteModal] = useState(null);

  useEffect(() => {
    stationApi
      .getActiveStations()
      .then((res) => setStations(res.data?.data ?? []))
      .catch(() => setStations([]))
      .finally(() => setLoadingStations(false));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchTimetable = async () => {
    setLoading(true);
    setSearched(false);
    try {
      const params = {
        fromStationId: Number(formData.fromStationId),
        toStationId: Number(formData.toStationId),
      };
      if (formData.date) params.date = formData.date;
      if (formData.serviceType) params.serviceType = formData.serviceType;

      const res = await cmsApi.search(params);  // ← was timetableApi.search(params)

      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? res.data?.schedules ?? []);

      setSchedules(list);
    } catch (err) {
      console.error("Timetable search error:", err);
      setSchedules([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();


    if (!formData.fromStationId || !formData.toStationId) return;
    if (formData.fromStationId === formData.toStationId) {
      alert("Origin and destination cannot be the same.");
      return;
    }
    fetchTimetable();
  };

  return (
    <div className="w-full bg-[#f5f7fa] min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            Time <span className="text-green-400">Table</span>
          </h1>
          <p className="mt-2 text-gray-200">Search available bus schedules and timings</p>
        </div>
      </div>

      <Breadcrumb title="Timetable" />

      <div className="max-w-5xl px-6 py-12 mx-auto">

        {/* Search form */}
        <div className="p-6 mb-8 bg-white shadow-md rounded-2xl">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                From Station
              </label>
              <select
                name="fromStationId"
                value={formData.fromStationId}
                onChange={handleChange}
                disabled={loadingStations}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              >
                <option value="">{loadingStations ? "Loading…" : "Select Origin"}</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                To Station
              </label>
              <select
                name="toStationId"
                value={formData.toStationId}
                onChange={handleChange}
                disabled={loadingStations}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              >
                <option value="">{loadingStations ? "Loading…" : "Select Destination"}</option>
                {stations
                  .filter((s) => s.id !== Number(formData.fromStationId))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Journey Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Service Type
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">All</option>
                <option value="EXPRESS">Express</option>
                <option value="SUPER_LUXURY">Super Luxury</option>
                <option value="DELUXE">Deluxe</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loadingStations || loading}
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 transition"
              >
                <FaSearch />
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <div className="p-10 text-center bg-white rounded-2xl shadow-md text-gray-500 text-sm">
              Loading schedules…
            </div>
          )}

          {!loading && searched && schedules.length === 0 && (
            <div className="p-10 text-center bg-white rounded-2xl shadow-md">
              <FaBus className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No schedules found for this route.</p>
              <p className="text-gray-400 text-sm mt-1">Try changing the date or station.</p>
            </div>
          )}

          {!loading && schedules.map((item) => (
            <ScheduleCard
              key={item.scheduleId}
              item={item}
              onShowRoute={setRouteModal}
            />
          ))}
        </div>
      </div>

      {/* Route modal */}
      {routeModal && (
        <RouteModal
          schedule={routeModal}
          onClose={() => setRouteModal(null)}
        />
      )}
    </div>
  );
}

export default Timetable;