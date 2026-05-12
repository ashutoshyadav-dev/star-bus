import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bgroad from "../../assets/bgroad.jpeg";
import busImg from "../../assets/bus.png";
import sideBg from "../../assets/side-bg.jpeg";
import { getRoutesBetweenStations } from "../../api/route";    
import { searchSchedulesByRoute } from "../../api/schedule";   
import { stationApi } from "../../api/station";               

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatTime(timeStr) {
  // timeStr from backend e.g. "06:00:00" or ISO offset string
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ─── BusList ─────────────────────────────────────────────────────────────── */

function BusList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");
  const date = searchParams.get("date");

  // station names for display
  const [stations, setStations] = useState([]);
  const fromStation = stations.find((s) => String(s.id) === fromId);
  const toStation = stations.find((s) => String(s.id) === toId);

  // schedules to display (merged from all matching routes)
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    stationApi.getActiveStations().then((res) => setStations(res.data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!fromId || !toId || !date) {
      setError("Missing search parameters. Please go back and search again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    // 1. find routes between the two stations
    getRoutesBetweenStations(Number(fromId), Number(toId))
      .then(async (routeRes) => {
        const routes = routeRes.data?.data ?? [];

        if (routes.length === 0) {
          setSchedules([]);
          setLoading(false);
          return;
        }

        // 2. for each route, fetch schedules on the given date
        const results = await Promise.allSettled(
          routes.map((route) =>
            searchSchedulesByRoute(route.id, date).then((r) =>
              (r.data ?? []).map((sch) => ({ ...sch, route }))
            )
          )
        );

        const allSchedules = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value);

        setSchedules(allSchedules);
      })
      .catch(() => setError("Failed to fetch buses. Please try again."))
      .finally(() => setLoading(false));
  }, [fromId, toId, date]);

  const fromLabel = fromStation?.name ?? `Station #${fromId}`;
  const toLabel = toStation?.name ?? `Station #${toId}`;

  return (
    <div
      className="w-full px-10 py-20 text-white bg-center bg-cover"
      style={{
        backgroundImage: `
          linear-gradient(120deg, #021B2B 20%, #0A3C4C 60%, #0F5132 100%),
          url(${bgroad})
        `,
      }}
    >
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-6 py-4 border shadow-lg bg-white/10 backdrop-blur-xl border-white/20 rounded-xl">
        <h2 className="text-lg font-medium tracking-wide uppercase">
          {fromLabel} → {toLabel}
        </h2>

        <div className="flex items-center gap-4">
          <div className="px-6 py-2 font-semibold rounded-lg bg-green-700/40">
            {date ? formatDate(date) : "—"}
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 rounded-lg hover:bg-green-700"
          >
            ⟳ Modify Your Search
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex gap-6 mt-6">

        {/* ── FILTER (static UI — wire up as needed) ── */}
        <div className="relative w-[280px] rounded-xl overflow-hidden border border-white/20 shadow-lg">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${sideBg})` }}
          ></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

          <div className="relative z-10 p-5">
            <h3 className="flex justify-between mb-4 text-lg font-semibold text-green-300">
              Filter <span>⚙️</span>
            </h3>

            <div className="mb-5">
              <p className="mb-2 text-gray-300">Departure Time</p>
              <label className="block mb-1 text-sm">
                <input type="checkbox" className="mr-2 accent-green-400" /> 4 AM to 8 AM
              </label>
              <label className="block text-sm">
                <input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM
              </label>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-gray-300">Arrival Time</p>
              <label className="block mb-1 text-sm">
                <input type="checkbox" className="mr-2 accent-green-400" /> Before 4 AM
              </label>
              <label className="block text-sm">
                <input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM
              </label>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-gray-300">Bus Types</p>
              <label className="block text-sm">
                <input type="checkbox" className="mr-2 accent-green-400" /> Volvo
              </label>
            </div>

            <div>
              <p className="mb-2 text-gray-300">Fare</p>
              <div className="flex gap-2">
                <select className="px-2 py-1 border rounded bg-white/10 border-white/20">
                  <option>Min</option>
                </select>
                <span>to</span>
                <select className="px-2 py-1 border rounded bg-white/10 border-white/20">
                  <option>Max</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── BUS LIST ── */}
        <div className="flex-1 space-y-6">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-gray-300">
              <svg className="w-6 h-6 mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Searching for buses…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-10 text-center text-red-300">{error}</div>
          )}

          {/* No results */}
          {!loading && !error && schedules.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              No buses found for this route on {formatDate(date)}.
            </div>
          )}

          {/* Schedule cards */}
          {!loading &&
            !error &&
            schedules.map((sch) => (
              <div
                key={sch.id}
                className="flex overflow-hidden border shadow-lg rounded-xl border-white/20 bg-white/10 backdrop-blur-xl"
              >
                {/* LEFT */}
                <div className="relative flex-1 p-6">
                  {/* bus watermark */}
                  <div
                    className="absolute inset-0 bg-center bg-cover opacity-20"
                    style={{ backgroundImage: `url(${busImg})` }}
                  ></div>

                  <div className="relative z-10 flex items-center justify-between">
                    {/* Bus info */}
                    <div>
                      <h3 className="text-xl font-semibold text-green-300">
                        {sch.bus?.registrationNumber ?? sch.busId ?? "—"}{" "}
                        {sch.bus?.busType?.name ? `| ${sch.bus.busType.name}` : ""}
                      </h3>
                      <p className="mt-1 text-gray-300 uppercase">
                        {fromLabel} → {toLabel}
                      </p>
                      {sch.status && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-green-700/50 text-green-200">
                          {sch.status}
                        </span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-center">
                      <p className="text-xl font-semibold">
                        {formatTime(sch.departureTime)}
                      </p>
                      <div className="w-24 h-[2px] bg-green-400 mx-auto my-1"></div>
                      {sch.route?.distanceKm && (
                        <p className="text-xs text-gray-400">
                          {sch.route.distanceKm} Km
                        </p>
                      )}
                      <p className="mt-1 text-xl font-semibold">
                        {formatTime(sch.arrivalTime)}
                      </p>
                    </div>

                    {/* Seats */}
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {sch.availableSeats ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">Available Seats</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-6 pt-3 mt-6 text-sm text-gray-400 border-t border-white/10">
                    <span>📍 Boarding & Dropping Points</span>
                    <span>⭐ Reviews</span>
                  </div>
                </div>

                {/* RIGHT — price panel */}
                <div className="w-[220px] bg-gradient-to-b from-green-900/40 to-green-700/40 flex flex-col justify-center items-center p-6">
                  <p className="text-3xl font-bold">
                    {sch.fare != null ? `₹ ${sch.fare}` : "—"}
                  </p>
                  <p className="text-sm text-gray-300">Per seat</p>

                  <button
                    onClick={() =>
                      navigate(`/ap/seat-selection?scheduleId=${sch.id}`)
                    }
                    disabled={!sch.bookingOpen}
                    className="px-6 py-2 mt-4 font-semibold bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sch.bookingOpen ? "Book Now" : "Booking Closed"}
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
