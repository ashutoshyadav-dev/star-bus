import { useState, useEffect } from "react";
import newbanner from "../../assets/newbanner.png";

import bus from "../../assets/gallery/bus.png";
import bus1 from "../../assets/gallery/bus1.png";
import bus2 from "../../assets/gallery/bus2.png";
import bus3 from "../../assets/gallery/bus3.png";

import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { stationApi } from "../../api/station";

function Hero() {
  const navigate = useNavigate();

  // =========================
  // STATIONS
  // =========================
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  // =========================
  // VEHICLE GALLERY
  // =========================
  const galleryImages = [bus, bus1, bus2, bus3];

  const [selectedImage, setSelectedImage] = useState(0);

  const handleNextImage = () => {
    setSelectedImage((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePreviousImage = () => {
    setSelectedImage((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  // =========================
  // DATE
  // =========================
  const today = new Date().toISOString().split("T")[0];

  // =========================
  // SEARCH FORM
  // =========================
  const [form, setForm] = useState({
    date: today,
    fromStationId: "",
    toStationId: "",
  });

  const [error, setError] = useState("");

  // =========================
  // GET ACTIVE STATIONS
  // =========================
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

  // =========================
  // HANDLE FORM CHANGE
  // =========================
  const handleChange = (e) => {
    setError("");

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =========================
  // SEARCH
  // =========================
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
      `/home/buses?from=${fromStationId}&to=${toStationId}&date=${date}`
    );
  };

  const selectClass =
    "w-full min-w-0 text-sm bg-transparent outline-none text-gray-700 cursor-pointer";

  return (
    <div className="relative w-full">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section
        className="
          relative
          w-full
          h-[calc(100svh-65px)]
          min-h-[680px]
          sm:min-h-[700px]
          md:min-h-[650px]
          lg:min-h-[600px]
          overflow-visible
        "
      >

        {/* =====================================================
            BACKGROUND
        ===================================================== */}
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-cover "
          style={{
            backgroundImage: `url(${newbanner})`,
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/20" />

        {/* =====================================================
            DESKTOP GALLERY
        ===================================================== */}
        <div
          className="absolute z-30 flex-col items-center hidden -translate-y-1/2 lg:flex left-4 xl:left-5 top-1/2"
        >

          {/* UP */}
          <button
            type="button"
            onClick={handlePreviousImage}
            className="flex items-center justify-center mb-2 text-lg text-white transition-all duration-300 border rounded-full shadow-lg w-9 h-9 xl:w-10 xl:h-10 xl:mb-3 xl:text-xl bg-black/50 backdrop-blur-md border-white/30 hover:bg-orange-500"
          >
            ↑
          </button>

          {/* THUMBNAILS */}
          <div
            className="flex flex-col gap-2 p-2 border shadow-xl xl:gap-3 rounded-2xl bg-black/30 backdrop-blur-md border-white/20"
          >
            {galleryImages.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`
                  relative
                  flex-shrink-0
                  w-[78px]
                  h-[56px]
                  sm:w-[86px]
                  sm:h-[62px]
                  xl:w-[100px]
                  xl:h-[70px]
                  rounded-xl
                  overflow-hidden
                  border-2
                  transition-all
                  duration-300
                  ${
                    selectedImage === index
                      ? "border-orange-500 scale-105 shadow-lg"
                      : "border-white/40 hover:border-white"
                  }
                `}
              >
                <img
                  src={image}
                  alt={`APSTS Vehicle ${index + 1}`}
                  className="object-cover w-full h-full"
                />

                {selectedImage === index && (
                  <div className="absolute inset-0 bg-orange-500/10" />
                )}
              </button>
            ))}
          </div>

          {/* DOWN */}
          <button
            type="button"
            onClick={handleNextImage}
            className="flex items-center justify-center mt-2 text-lg text-white transition-all duration-300 border rounded-full shadow-lg w-9 h-9 xl:w-10 xl:h-10 xl:mt-3 xl:text-xl bg-black/50 backdrop-blur-md border-white/30 hover:bg-orange-500"
          >
            ↓
          </button>

          {/* COUNT */}
          <div className="mt-2 text-xs font-medium text-white xl:text-sm">
            <span className="text-orange-400">
              {String(selectedImage + 1).padStart(2, "0")}
            </span>

            <span className="mx-1">/</span>

            <span>
              {String(galleryImages.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* =====================================================
            DESKTOP SELECTED BUS
        ===================================================== */}
        <div
          className="
            absolute
            z-10
            hidden
            lg:block
            right-[2%]
            xl:right-[3%]
            bottom-[85px]
            xl:bottom-[100px]
            w-[38%]
            xl:w-[36%]
            max-w-[520px]
            h-[260px]
            xl:h-[290px]
          "
        >
          <img
            src={galleryImages[selectedImage]}
            alt="APSTS Vehicle"
            className="
              w-full
              h-full
              object-contain
              drop-shadow-[0_20px_20px_rgba(0,0,0,0.45)]
              transition-all
              duration-500
            "
          />
        </div>

        {/* =====================================================
            HERO CONTENT
        ===================================================== */}
        <div
          className="
            relative
            z-10
            flex
            flex-col
            items-center
            justify-center
            h-full
            text-white
            text-center
            px-5
            sm:px-8
            md:px-12
            lg:pr-[24%]
            lg:pl-[12%]
            pb-[230px]
            sm:pb-[220px]
            md:pb-[170px]
            lg:pb-[150px]
          "
        >
         <h1
  className="
    max-w-[900px]
    text-2xl
    sm:text-3xl
    md:text-4xl
    lg:text-5xl
    xl:text-5xl
    font-bold
    leading-[1.25]
    drop-shadow-lg
    uppercase
  "
>
  Welcome to Arunachal Pradesh
  <br />
  <span className="inline-block mt-2 sm:mt-3">
    State Transport Services
  </span>
</h1>

          <p
            className="
              mt-3
              sm:mt-4
              max-w-[650px]
              text-sm
              sm:text-base
              md:text-lg
              text-gray-100
              drop-shadow-md
            "
          >
            Book a Bus and discover the beauty of Northeast India
          </p>
        </div>

        {/* =====================================================
            MOBILE / TABLET SELECTED BUS
        ===================================================== */}
        <div
          className="
            absolute
            z-10
            lg:hidden
            right-0
            sm:right-4
            md:right-8
            bottom-[205px]
            sm:bottom-[205px]
            md:bottom-[175px]
            w-[62%]
            sm:w-[52%]
            md:w-[45%]
            h-[170px]
            sm:h-[190px]
            md:h-[200px]
          "
        >
          <img
            src={galleryImages[selectedImage]}
            alt="APSTS Vehicle"
            className="
              w-full
              h-full
              object-contain
              drop-shadow-[0_15px_15px_rgba(0,0,0,0.45)]
              transition-all
              duration-500
            "
          />
        </div>

        {/* =====================================================
            MOBILE / TABLET GALLERY
        ===================================================== */}
        <div
          className="
            absolute
            z-30
            lg:hidden
            left-0
            right-0
            bottom-[115px]
            sm:bottom-[120px]
            md:bottom-[100px]
            flex
            justify-center
            px-3
            sm:px-4
          "
        >
          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              max-w-[96%]
              p-2
              overflow-x-auto
              rounded-xl
              border
              bg-black/30
              backdrop-blur-md
              border-white/20
              shadow-lg
              scrollbar-hide
            "
          >
            {galleryImages.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`
                  flex-shrink-0
                  w-[62px]
                  h-[45px]
                  sm:w-[72px]
                  sm:h-[52px]
                  md:w-[80px]
                  md:h-[56px]
                  rounded-lg
                  overflow-hidden
                  border-2
                  transition-all
                  duration-300
                  ${
                    selectedImage === index
                      ? "border-orange-500 scale-105 shadow-md"
                      : "border-white/40"
                  }
                `}
              >
                <img
                  src={image}
                  alt={`APSTS Vehicle ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================
            SEARCH BAR
            IMPORTANT:
            HALF INSIDE HERO + HALF OUTSIDE
        ===================================================== */}
        <div
          className="
            absolute
            z-40
            left-1/2
            -translate-x-1/2
            bottom-[-38px]
            w-[94%]
            sm:w-[92%]
            md:w-[90%]
            lg:w-[76%]
            xl:w-[76%]
            max-w-[1200px]
          "
        >
          <div
            className="
              relative
              w-full
              rounded-2xl
              border
              border-white/30
              bg-black/40
              backdrop-blur-xl
              shadow-[0_10px_40px_rgba(0,0,0,0.35)]
              p-3
              sm:p-4
              md:p-4
            "
          >

            {/* ERROR */}
            {error && (
              <p
                className="
                  absolute
                  -top-7
                  left-1/2
                  -translate-x-1/2
                  w-max
                  max-w-[90%]
                  text-[10px]
                  sm:text-xs
                  text-red-300
                  font-medium
                "
              >
                {error}
              </p>
            )}

            {/* =================================================
                SEARCH FIELDS
            ================================================= */}
            <div
              className="grid items-end grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3"
            >

              {/* ================= WHEN ================= */}
              <div className="w-full min-w-0">
                <p className="mb-1 px-1 text-[11px] sm:text-xs text-orange-400">
                  When
                </p>

                <div
                  className="
                    flex
                    items-center
                    w-full
                    h-[42px]
                    sm:h-[44px]
                    px-3
                    sm:px-4
                    bg-gray-100
                    rounded-full
                  "
                >
                  <FaCalendarAlt
                    className="mr-2 text-sm text-gray-400 shrink-0"
                  />

                  <input
                    type="date"
                    name="date"
                    min={today}
                    value={form.date}
                    onChange={handleChange}
                    className="w-full min-w-0 text-xs text-gray-700 bg-transparent outline-none sm:text-sm"
                  />
                </div>
              </div>

              {/* ================= FROM ================= */}
              <div className="w-full min-w-0">
                <p className="mb-1 px-1 text-[11px] sm:text-xs text-orange-400">
                  From
                </p>

                <div
                  className="
                    flex
                    items-center
                    w-full
                    h-[42px]
                    sm:h-[44px]
                    px-3
                    sm:px-4
                    bg-gray-100
                    rounded-full
                  "
                >
                  <FaMapMarkerAlt
                    className="mr-2 text-sm text-gray-400 shrink-0"
                  />

                  <select
                    name="fromStationId"
                    value={form.fromStationId}
                    onChange={handleChange}
                    disabled={loadingStations}
                    className={selectClass}
                  >
                    <option value="">
                      {loadingStations
                        ? "Loading..."
                        : "Select origin"}
                    </option>

                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ================= TO ================= */}
              <div className="w-full min-w-0">
                <p className="mb-1 px-1 text-[11px] sm:text-xs text-orange-400">
                  To
                </p>

                <div
                  className="
                    flex
                    items-center
                    w-full
                    h-[42px]
                    sm:h-[44px]
                    px-3
                    sm:px-4
                    bg-gray-100
                    rounded-full
                  "
                >
                  <FaMapMarkerAlt
                    className="mr-2 text-sm text-gray-400 shrink-0"
                  />

                  <select
                    name="toStationId"
                    value={form.toStationId}
                    onChange={handleChange}
                    disabled={loadingStations}
                    className={selectClass}
                  >
                    <option value="">
                      {loadingStations
                        ? "Loading..."
                        : "Select destination"}
                    </option>

                    {stations
                      .filter(
                        (s) =>
                          s.id !== Number(form.fromStationId)
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* ================= SEARCH ================= */}
              <div className="w-full">
                <p className="hidden mb-1 text-xs text-transparent lg:block">
                  Search
                </p>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loadingStations}
                  className="
                    w-full
                    h-[42px]
                    sm:h-[44px]
                    px-6
                    rounded-full
                    bg-orange-500
                    hover:bg-orange-600
                    disabled:opacity-60
                    text-white
                    text-sm
                    font-semibold
                    transition-all
                    duration-200
                    shadow-md
                  "
                >
                  Search
                </button>
              </div>

            </div>
          </div>
        </div>

      </section>
    </div>
  );
}

export default Hero;