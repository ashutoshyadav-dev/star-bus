import { useState, useEffect } from "react";
import banner from "../../assets/banner.png";
import whereIcon from "../../assets/searchbg.png";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { stationApi } from "../../api/station"; 

function Hero() {
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    fromStationId: "",
    toStationId: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    stationApi
      .getActiveStations()
      .then((res) => setStations(res.data?.data ?? []))
      .catch(() => setStations([]))
      .finally(() => setLoadingStations(false));
  }, []);

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = () => {
    const { date, fromStationId, toStationId } = form;

    if (!date || !fromStationId || !toStationId) {
      setError("Please fill in all fields.");
      return;
    }

    if (fromStationId === toStationId) {
      setError("Origin and destination cannot be the same.");
      return;
    }

    navigate(
      `/ap/buses?from=${fromStationId}&to=${toStationId}&date=${date}`
    );
  };

  const selectClass =
    "w-full text-sm bg-transparent outline-none text-gray-700 cursor-pointer";

  return (
    <div className="relative w-full">
      {/* HERO */}
      <div className="relative min-h-[100vh] pb-28 overflow-visible">
        {/* Background */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] text-white text-center px-4">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            EXPLORE <br /> ARUNACHAL PRADESH
          </h1>
          <p className="mt-4 text-lg text-gray-200">
            Book a Bus and discover the beauty of Northeast India
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-[95%] md:w-[75%] z-20">
          <div
            className="backdrop-blur-md bg-white/20 border border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-2xl px-6 py-4 flex flex-col md:flex-row items-end gap-4"
            style={{
              backgroundImage: `url(${whereIcon})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* WHEN */}
            <div className="w-full">
              <p className="mb-1 text-xs text-orange-500">When</p>
              <div className="flex items-center bg-gray-100 rounded-full px-4 h-[45px]">
                <FaCalendarAlt className="mr-2 text-gray-400 shrink-0" />
                <input
                  type="date"
                  name="date"
                  min={today}
                  value={form.date}
                  onChange={handleChange}
                  className="w-full text-sm bg-transparent outline-none text-gray-700"
                />
              </div>
            </div>

            {/* FROM */}
            <div className="w-full">
              <p className="mb-1 text-xs text-orange-500">From</p>
              <div className="flex items-center bg-gray-100 rounded-full px-4 h-[45px]">
                <FaMapMarkerAlt className="mr-2 text-gray-400 shrink-0" />
                <select
                  name="fromStationId"
                  value={form.fromStationId}
                  onChange={handleChange}
                  disabled={loadingStations}
                  className={selectClass}
                >
                  <option value="">
                    {loadingStations ? "Loading..." : "Select origin"}
                  </option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TO */}
            <div className="w-full">
              <p className="mb-1 text-xs text-orange-500">To</p>
              <div className="flex items-center bg-gray-100 rounded-full px-4 h-[45px]">
                <FaMapMarkerAlt className="mr-2 text-gray-400 shrink-0" />
                <select
                  name="toStationId"
                  value={form.toStationId}
                  onChange={handleChange}
                  disabled={loadingStations}
                  className={selectClass}
                >
                  <option value="">
                    {loadingStations ? "Loading..." : "Select destination"}
                  </option>
                  {stations
                    .filter((s) => s.id !== Number(form.fromStationId))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* BUTTON + ERROR */}
            <div className="w-full md:w-auto flex flex-col items-center gap-1">
              {error && (
                <p className="text-xs text-red-300 whitespace-nowrap">{error}</p>
              )}
              <button
                onClick={handleSearch}
                disabled={loadingStations}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-8 h-[45px] rounded-full text-sm font-semibold w-full md:w-auto"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SPACE */}
      <div className="h-28"></div>
    </div>
  );
}

export default Hero;
