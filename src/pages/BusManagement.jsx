import React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

const buses = [
  {
    id: 101,
    number: "MH12AB1234",
    type: "AC Sleeper",
    seats: 40,
    rate: 3.5,
    base: 30,
    status: "Active",
  },
  {
    id: 102,
    number: "DL05XY5678",
    type: "Non-AC Seater",
    seats: 45,
    rate: 2.5,
    base: 30,
    status: "Inactive",
  },
  {
    id: 103,
    number: "KA09CD9876",
    type: "Luxury AC Coach",
    seats: 30,
    rate: 4,
    base: 100,
    status: "Active",
  },
  {
    id: 104,
    number: "TS11EF4321",
    type: "Non-AC Sleeper",
    seats: 50,
    rate: 2.5,
    base: 50,
    status: "Active",
  },
  {
    id: 105,
    number: "WB20GH7654",
    type: "AC Seater",
    seats: 48,
    rate: 5,
    base: 40,
    status: "Inactive",
  },
  {
    id: 106,
    number: "GJ01KL3210",
    type: "Volvo AC Coach",
    seats: 36,
    rate: 5,
    base: 80,
    status: "Active",
  },
];

const BusManagement = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* HEADER */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-md border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
            className="w-10 h-10 object-contain"
            alt="bus logo"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bus Management</h1>
            <p className="text-sm text-gray-500">Manage all buses details</p>
          </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow transition">
          <Plus size={18} />
          Add Bus
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow border p-5">
          {/* TITLE */}
          <h2 className="text-lg font-semibold text-gray-700 mb-5">
            Ticket Management Based on Kilometre
          </h2>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-4 mb-5">
            <select
              className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg w-48 outline-none focus:ring-2 focus:ring-blue-300"
              defaultValue=""
            >
              <option value="" disabled>
                Select Bus Type
              </option>
              <option>AC Sleeper</option>
              <option>Non AC</option>
              <option>Seater</option>
              <option>Sleeper</option>
            </select>

            <select
              className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg w-48 outline-none focus:ring-2 focus:ring-blue-300"
              defaultValue=""
            >
              <option value="" disabled>
                Select Ticket Type
              </option>
              <option>One Way</option>
              <option>Round Trip</option>
              <option>Monthly Pass</option>
            </select>

            <input
              type="text"
              placeholder="Search by Bus Number..."
              className="border border-gray-300 bg-white text-gray-700 placeholder-gray-400 px-4 py-2 rounded-lg flex-1 min-w-[250px] outline-none focus:ring-2 focus:ring-blue-300"
            />

            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition">
              Search
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow border border-blue-100 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1100px]">
              <thead className="bg-blue-50 text-gray-700 uppercase text-xs">
                <tr>
                  {[
                    "Bus ID",
                    "Bus Number",
                    "Bus Type",
                    "Seats",
                    "Rate/Km",
                    "Base Fare",
                    "Total Fare",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left border border-blue-100 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {buses.map((bus) => (
                  <tr
                    key={bus.id}
                    className="hover:bg-blue-50 transition duration-200"
                  >
                    <td className="px-4 py-3 border border-blue-100 text-gray-700">
                      {bus.id}
                    </td>

                    <td className="px-4 py-3 border border-blue-100 font-medium text-blue-600 hover:underline cursor-pointer">
                      {bus.number}
                    </td>

                    <td className="px-4 py-3 border border-blue-100 text-gray-700">
                      {bus.type}
                    </td>

                    <td className="px-4 py-3 border border-blue-100 text-gray-700">
                      {bus.seats}
                    </td>

                    <td className="px-4 py-3 border border-blue-100 text-gray-700">
                      ₹ {bus.rate.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 border border-blue-100 text-gray-700">
                      ₹ {bus.base.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 border border-blue-100 text-gray-700 font-medium">
                      ₹ {(bus.base + bus.rate).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 border border-blue-100">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bus.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {bus.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 border border-blue-100">
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

          {/* FOOTER */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-4 text-sm text-gray-600">
            <p>Showing 1 to 6 of 18 entries</p>

            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                1
              </button>
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                2
              </button>
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                3
              </button>
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusManagement;
