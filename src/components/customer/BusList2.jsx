import { useNavigate } from "react-router-dom";
import bgroad from "../../assets/bgroad.jpeg";
import busImg from "../../assets/bus2.png";
import sideBg from "../../assets/side-bg.jpeg";

function BusList() {
  const navigate = useNavigate();

  return (
    <div
      className="w-full min-h-screen px-10 py-6 text-white bg-center bg-cover"
     
      style={{
        backgroundImage: `
          linear-gradient(120deg, #021B2B 20%, #0A3C4C 60%, #0F5132 100%),
          url(${bgroad})
        `,
      }}
    >
      {/* 🔝 TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border shadow-lg bg-white/10 backdrop-blur-xl border-white/20 rounded-xl">

        <h2 className="text-lg font-medium tracking-wide">
          ITANAGAR (ARUNACHAL PRADESH) → GUWAHATI (ASSAM)
        </h2>

        <div className="flex items-center gap-4">
          <div className="px-6 py-2 font-semibold rounded-lg bg-green-700/40">
            &lt; 27/04/2026 &gt;
          </div>

          <button className="flex items-center gap-2 px-5 py-2 bg-green-600 rounded-lg hover:bg-green-700">
            ⟳ Modify Your Search
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex gap-6 mt-6">

        {/* 🔹 FILTER */}
       <div className="relative w-[280px] rounded-xl overflow-hidden border border-white/20 shadow-lg">

  {/* BACKGROUND IMAGE */}
  <div
    className="absolute inset-0 bg-center bg-cover"
    style={{ backgroundImage: `url(${sideBg})` }}
  ></div>

  {/* DARK OVERLAY (LIGHT BLUR) */}
  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

  {/* CONTENT */}
  <div className="relative z-10 p-5">

    <h3 className="flex justify-between mb-4 text-lg font-semibold text-green-300">
      Filter <span>⚙️</span>
    </h3>

    {/* Departure */}
    <div className="mb-5">
      <p className="mb-2 text-gray-300">Departure Time</p>
      <label className="block mb-1 text-sm">
        <input type="checkbox" className="mr-2 accent-green-400" /> 4 AM to 8 AM
      </label>
      <label className="block text-sm">
        <input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM
      </label>
    </div>

    {/* Arrival */}
    <div className="mb-5">
      <p className="mb-2 text-gray-300">Arrival Time</p>
      <label className="block mb-1 text-sm">
        <input type="checkbox" className="mr-2 accent-green-400" /> Before 4 AM
      </label>
      <label className="block text-sm">
        <input type="checkbox" className="mr-2 accent-green-400" /> 4 PM to 8 PM
      </label>
    </div>

    {/* Bus Type */}
    <div className="mb-5">
      <p className="mb-2 text-gray-300">Bus Types</p>
      <label className="block text-sm">
        <input type="checkbox" className="mr-2 accent-green-400" /> Volvo
      </label>
    </div>

    {/* Fare */}
    <div>
      <p className="mb-2 text-gray-300">Fare</p>
      <div className="flex gap-2">
        <select className="px-2 py-1 border rounded bg-white/10 border-white/20">
          <option>Min</option>
        </select>
        <span>to</span>
        <select className="px-2 py-1 border rounded bg-white/10 border-white/20">
          <option>780</option>
        </select>
      </div>
    </div>

  </div>
</div>

        {/* 🔹 BUS LIST */}
        <div className="flex-1 space-y-6">

          {[1, 2].map((item, index) => (
            <div
              key={index}
              className="flex overflow-hidden border shadow-lg rounded-xl border-white/20 bg-white/10 backdrop-blur-xl"
            >

              {/* LEFT CONTENT */}
              <div className="relative flex-1 p-6">

                {/* BUS IMAGE */}
                <div
                  className="absolute inset-0 bg-center bg-cover opacity-20"
                  style={{ backgroundImage: `url(${busImg})` }}
                ></div>

                <div className="relative z-10 flex items-center justify-between">

                  {/* BUS INFO */}
                  <div>
                    <h3 className="text-xl font-semibold text-green-300">
                      {index === 0 ? "146F147" : "144F143"} | Volvo
                    </h3>
                    <p className="mt-1 text-gray-300">
                      ITANAGAR - to - GUWAHATI
                    </p>
                  </div>

                  {/* TIME */}
                  <div className="text-center">
                    <p className="text-xl font-semibold">
                      {index === 0 ? "06:00 AM" : "06:00 PM"}
                    </p>

                    <div className="w-24 h-[2px] bg-green-400 mx-auto my-1"></div>

                    <p className="text-xs text-gray-400">Total 390 Km</p>

                    <p className="mt-1 text-xl font-semibold">
                      {index === 0 ? "04:30 PM" : "04:00 AM"}
                    </p>
                  </div>

                  {/* SEATS */}
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {index === 0 ? 33 : 37}
                    </p>
                    <p className="text-xs text-gray-400">
                      Available Seats
                    </p>
                  </div>

                </div>

                {/* FOOTER */}
                <div className="flex gap-6 pt-3 mt-6 text-sm text-gray-400 border-t border-white/10">
                  <span>📍 Boarding & Dropping Points</span>
                  <span>⭐ Reviews</span>
                </div>
              </div>

              {/* RIGHT PRICE PANEL */}
              <div className="w-[220px] bg-gradient-to-b from-green-900/40 to-green-700/40 flex flex-col justify-center items-center p-6">

                <p className="text-3xl font-bold">₹ 780</p>
                <p className="text-sm text-gray-300">Per seat</p>

                <button
                  onClick={() => navigate("/seat-selection")}
                  className="px-6 py-2 mt-4 font-semibold bg-orange-500 rounded-lg hover:bg-orange-600"
                >
                  Book Now
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