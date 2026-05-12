import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function BusStop() {
  const [stops] = useState([
    { id: 101, route: "Delhi - Jaipur", stop: "Kashmiri Gate", sequence: 1, lat: "28.66", long: "77.23", status: "Active" },
    { id: 102, route: "Delhi - Jaipur", stop: "Manesar", sequence: 2, lat: "28.36", long: "76.94", status: "Inactive" },
    { id: 103, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
    { id: 104, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
    { id: 105, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
    { id: 106, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
    { id: 107, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
    { id: 108, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
    { id: 109, route: "Delhi - Agra", stop: "Mathura", sequence: 3, lat: "27.49", long: "77.67", status: "Active" },
  ]);

  const [search, setSearch] = useState("");

  const filteredStops = stops.filter(
    (item) =>
      item.stop.toLowerCase().includes(search.toLowerCase()) ||
      item.route.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-gray-100 overflow-x-hidden m-0 p-0">
      {/* HEADER */}
      <div className="w-full bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
            alt="bus-logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Bus Stop Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage all bus stops details
            </p>
          </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition">
          <Plus size={18} />
          Add Stop
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-full">
          {/* TITLE */}
          <h2 className="text-lg font-semibold text-gray-700 mb-5">
            Stop Management Details
          </h2>

          {/* FILTER */}
          <div className="flex flex-wrap gap-4 mb-5">
            <select
              className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg w-56 outline-none focus:ring-2 focus:ring-blue-300"
              defaultValue=""
            >
              <option value="" disabled>
                Select Route
              </option>
              <option>Delhi - Jaipur</option>
              <option>Delhi - Agra</option>
              <option>Delhi - Chandigarh</option>
            </select>

            <input
              type="text"
              placeholder="Search stop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 bg-white text-gray-700 placeholder-gray-400 px-4 py-2 rounded-lg flex-1 min-w-[250px] outline-none focus:ring-2 focus:ring-blue-300"
            />

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 transition">
              <Search size={18} />
              Search
            </button>
          </div>

          <div className="w-full rounded-2xl border border-gray-200 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-gray-700 uppercase text-xs">
                    {[
                      "Stop ID",
                      "Route",
                      "Stop Name",
                      "Sequence",
                      "Latitude",
                      "Longitude",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left border border-gray-200 font-semibold whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="text-sm text-gray-800">
                  {filteredStops.map((item) => (
                    <tr
                      key={item.id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition"
                    >
                      <td className="px-4 py-3 border border-gray-200">{item.id}</td>
                      <td className="px-4 py-3 border border-gray-200 font-medium">
                        {item.route}
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-blue-600 font-medium hover:underline cursor-pointer">
                        {item.stop}
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        {item.sequence}
                      </td>
                      <td className="px-4 py-3 border border-gray-200">{item.lat}</td>
                      <td className="px-4 py-3 border border-gray-200">{item.long}</td>
                      <td className="px-4 py-3 border border-gray-200">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                            }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        <div className="flex gap-2">
                          <button className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition">
                            <Pencil size={18} />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-4 text-sm text-gray-600">
            <p>
              Showing 1 to {filteredStops.length} of {stops.length} entries
            </p>

            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Previous
              </button>

              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                1
              </button>

              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                2
              </button>

              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}