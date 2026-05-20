import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";

import bgroad from "../../assets/bgroad.jpeg";
import { stationApi } from "../../api/station";

export default function BookTicket() {
  const navigate = useNavigate();

  /* ─────────────────────────────────────────────
     STATES
  ───────────────────────────────────────────── */

  const today = new Date().toISOString().split("T")[0];

  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [form, setForm] = useState({
    fromStationId: "",
    toStationId: "",
    date: today,
  });

  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  /* ─────────────────────────────────────────────
     FETCH STATIONS
  ───────────────────────────────────────────── */

  useEffect(() => {
    stationApi
      .getActiveStations()
      .then((res) => {
        setStations(res.data?.data ?? []);
      })
      .catch(() => {
        setStations([]);
      })
      .finally(() => {
        setLoadingStations(false);
      });
  }, []);

  /* ─────────────────────────────────────────────
     HANDLE INPUT CHANGE
  ───────────────────────────────────────────── */

  const handleChange = (e) => {
    setError("");

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ─────────────────────────────────────────────
     HANDLE SEARCH
  ───────────────────────────────────────────── */

  const handleSearch = () => {
    const { fromStationId, toStationId, date } = form;

    if (!fromStationId || !toStationId || !date) {
      setError("Please fill all fields");
      return;
    }

    if (fromStationId === toStationId) {
      setError("Origin and destination cannot be same");
      return;
    }

    setSearching(true);

    navigate(
      `/ap/buses?from=${fromStationId}&to=${toStationId}&date=${date}`
    );
    setTimeout(() => setSearching(false), 500);
  };

  /* ─────────────────────────────────────────────
     JSX
  ───────────────────────────────────────────── */

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(
            120deg,
            rgba(2,27,43,0.92) 20%,
            rgba(10,60,76,0.88) 60%,
            rgba(15,81,50,0.90) 100%
          ),
          url(${bgroad})
        `,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-10">

        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

          {/* LEFT CONTENT */}
          <div className="text-white">

            <p className="uppercase tracking-[4px] text-green-400 text-sm mb-3">
              APSTS ONLINE BOOKING
            </p>

            <h1 className="text-5xl font-bold leading-tight mb-5">
              Book Your Bus Journey
              <span className="block text-green-400">
                Fast • Secure • Easy
              </span>
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed max-w-xl">
              Search buses, select seats, make secure payments,
              and download your ticket instantly.
            </p>

            {/* FEATURES */}
            <div className="flex flex-wrap gap-4 mt-8">
              {[
                "Live Seat Selection",
                "Instant Booking",
                "Secure Payment",
                "QR Ticket",
              ].map((item) => (
                <div
                  key={item}
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm"
                >
                  ✨ {item}
                </div>
              ))}
            </div>
          </div>

          {/* SEARCH CARD */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-white">

            {/* HEADER */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-400">
                Search Buses
              </h2>

              <p className="text-gray-300 text-sm mt-2">
                Find buses between your preferred stations
              </p>
            </div>

            {/* FROM */}
            <div className="mb-5">

              <label className="text-sm text-gray-300 mb-2 block">
                From Station
              </label>

              <div className="flex items-center border border-white/20 bg-white/10 rounded-xl px-4 py-3">

                <FiMapPin className="text-green-400 mr-3 text-lg shrink-0" />

                <select
                  name="fromStationId"
                  value={form.fromStationId}
                  onChange={handleChange}
                  disabled={loadingStations}
                  className="w-full bg-transparent outline-none text-white"
                >
                  <option value="" className="text-black">
                    {loadingStations
                      ? "Loading stations..."
                      : "Select Boarding Station"}
                  </option>

                  {stations.map((station) => (
                    <option
                      key={station.id}
                      value={station.id}
                      className="text-black"
                    >
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TO */}
            <div className="mb-5">

              <label className="text-sm text-gray-300 mb-2 block">
                To Station
              </label>

              <div className="flex items-center border border-white/20 bg-white/10 rounded-xl px-4 py-3">

                <FiMapPin className="text-orange-400 mr-3 text-lg shrink-0" />

                <select
                  name="toStationId"
                  value={form.toStationId}
                  onChange={handleChange}
                  disabled={loadingStations}
                  className="w-full bg-transparent outline-none text-white"
                >
                  <option value="" className="text-black">
                    {loadingStations
                      ? "Loading stations..."
                      : "Select Destination Station"}
                  </option>

                  {stations
                    .filter(
                      (station) =>
                        String(station.id) !==
                        String(form.fromStationId)
                    )
                    .map((station) => (
                      <option
                        key={station.id}
                        value={station.id}
                        className="text-black"
                      >
                        {station.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* DATE */}
            <div className="mb-6">

              <label className="text-sm text-gray-300 mb-2 block">
                Journey Date
              </label>

              <div className="flex items-center border border-white/20 bg-white/10 rounded-xl px-4 py-3">

                <FiCalendar className="text-yellow-400 mr-3 text-lg shrink-0" />

                <input
                  type="date"
                  name="date"
                  min={today}
                  value={form.date}
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-white"
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              onClick={handleSearch}
              disabled={loadingStations || searching}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 transition-all duration-300 font-semibold text-lg shadow-lg disabled:opacity-60"
            >
              {searching ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>

                  Searching...
                </>
              ) : (
                <>
                  Search Available Buses
                  <FiArrowRight />
                </>
              )}
            </button>

            {/* FOOTER */}
            <div className="mt-6 pt-5 border-t border-white/10 flex justify-between text-xs text-gray-400">
              <span>✔ Safe Booking</span>
              <span>✔ Live Availability</span>
              <span>✔ Instant Ticket</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}