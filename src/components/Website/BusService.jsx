import banner from "../../assets/banner.png";
import busImg from "../../assets/Valley.png";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import Breadcrumb from "../Website/Breadcrumb";


function BusService() {
  const location = useLocation();
  const busName = location.state?.bus || "Electric Bus";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

const [showRoute, setShowRoute] = useState(false);
const [selectedRoute, setSelectedRoute] = useState(null);
  const itemsPerPage = 5;

 const timetable = [
  {
    from: "PASIGHAT",
    to: "ROING",
    time: "06:00 AM",
    stops: [
      { place: "PASIGHAT", time: "06:00 AM" },
      { place: "ITANAGAR", time: "07:30 AM" },
      { place: "NAHARLAGUN", time: "08:30 AM" },
      { place: "ROING", time: "10:00 AM" },
    ],
  },
  {
    from: "RUKSIN",
    to: "PASIGHAT",
    time: "08:00 AM",
    stops: [
      { place: "RUKSIN", time: "08:00 AM" },
      { place: "NIRJULI", time: "09:00 AM" },
      { place: "ITANAGAR", time: "10:00 AM" },
      { place: "PASIGHAT", time: "11:30 AM" },
    ],
  },
];

  // 🔍 SEARCH
  const filteredData = timetable.filter((item) =>
    item.from.toLowerCase().includes(search.toLowerCase()) ||
    item.to.toLowerCase().includes(search.toLowerCase())
  );

  // 📄 PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="w-full bg-[#f5f7fa]">

      {/* HERO */}
      <div className="relative h-[250px] flex items-center px-10 pt-20 text-white">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold">
            {busName} <span className="text-green-400">Services</span>
          </h1>
          <p className="text-gray-200">Explore routes and timetable</p>
        </div>
      </div>

      {/* ✅ BREADCRUMB (same like OurHistory) */}
      <Breadcrumb title={`${busName} Services`} />

      {/* MAIN */}
      <div className="p-8">

        {/* TOP CARD */}
        <div className="flex items-center gap-6 p-6 bg-white shadow rounded-2xl">
          <img src={busImg} alt="" className="w-40 h-40 rounded-full" />

          <div>
            <h2 className="text-xl font-bold text-blue-700">
              {busName} Services
            </h2>
            <p className="text-gray-500">{busName}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="p-6 mt-8 bg-white shadow rounded-2xl">

          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-4">

            {/* PRINT */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1 border rounded"
            >
              Print
            </button>

            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1 border rounded"
            />

          </div>

          {/* TABLE */}
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">From</th>
                <th className="p-2">To</th>
                <th className="p-2">Time</th>
                <th className="p-2">Booking</th>
                <th className="p-2">Route</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={index} className="text-center border-b hover:bg-gray-50">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{item.from}</td>
                  <td className="p-2">{item.to}</td>
                  <td className="p-2">{item.time}</td>

                  <td className="p-2 font-semibold text-green-600">YES</td>

                  <td className="p-2">
           <button
  onClick={() => {
    setSelectedRoute(item);
    setShowRoute(true);
  }}
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
                  className={page === i + 1 ? "font-bold" : ""}
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

        </div>

      </div>
{showRoute && selectedRoute && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

    <div className="w-[420px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6 relative">

      {/* CLOSE */}
      <button
        onClick={() => setShowRoute(false)}
        className="absolute flex items-center justify-center w-8 h-8 text-white bg-red-500 rounded-full top-3 right-3"
      >
        ✕
      </button>

      {/* TITLE */}
      <h2 className="mb-6 text-lg font-semibold text-gray-800">
        {selectedRoute.from} - {selectedRoute.to}
      </h2>

      {/* TIMELINE */}
      <div className="relative pl-6">

        {/* LINE */}
     <div className="relative pl-8">

  {/* LINE */}
  <div className="absolute left-[10px] top-0 w-[2px] h-full bg-gray-300"></div>

  {selectedRoute.stops.map((stop, index) => (
    <div key={index} className="relative flex items-start mb-8">

      {/* DOT */}
      <div className="absolute left-[6px] top-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>

      {/* TEXT */}
      <div className="ml-6">
        <p className="font-semibold text-gray-800">{stop.place}</p>
        <p className="text-sm text-gray-500">{stop.time}</p>
      </div>

    </div>
  ))}

  <p className="ml-6 text-xs text-gray-400">approximate time!</p>

</div>

      

      </div>

    </div>

  </div>
)}
    </div>
  );
}

export default BusService;