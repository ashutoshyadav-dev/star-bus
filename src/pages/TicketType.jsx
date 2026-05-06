import React, { useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* Dummy Data */
const ticketData = [
  {
    ticket_type_id: 1,
    name: "AC Sleeper",
    description: "Luxury comfort",
    price_rule: "Fixed",
    base_price: 1200,
    category: "Premium",
  },
  {
    ticket_type_id: 2,
    name: "Non-AC Seater",
    description: "Budget travel",
    price_rule: "Dynamic",
    base_price: 500,
    category: "Regular",
  },
  {
    ticket_type_id: 3,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 4,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 5,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 6,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 7,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 8,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 9,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 10,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
  {
    ticket_type_id: 11,
    name: "Semi Sleeper",
    description: "Balanced comfort",
    price_rule: "Fixed",
    base_price: 800,
    category: "Regular",
  },
];

export default function TicketType() {
  const navigate = useNavigate(); // <-- add this

  const [tickets] = useState(ticketData);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const entriesPerPage = 5;

  /* Filter */
  const filteredTickets = tickets.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter ? t.category === categoryFilter : true;

    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filteredTickets.length / entriesPerPage);

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;

  const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          {/* Title + Image */}
          <div className="flex items-center gap-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
              alt="Ticket Icon"
              className="w-12 h-12 object-contain"
            />
            <h2 className="text-2xl font-semibold text-gray-800">
              Tickets Type Management
            </h2>
          </div>

          {/* Navigate Button */}
          <button
            onClick={() => navigate("/app/add-ticket")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Add Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow border border-blue-100">
          <div className="flex items-center border border-blue-200 rounded-lg px-3 py-2 w-72 bg-white focus-within:ring-2 focus-within:ring-blue-400">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search ticket..."
              className="w-full outline-none text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <select
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-400"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Category</option>
            <option value="Regular">Regular</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-blue-50 text-gray-700 uppercase text-xs">
            <tr>
              {[
                "ID",
                "Name",
                "Description",
                "Category",
                "Price Rule",
                "Base Price",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left border border-blue-100"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentTickets.length > 0 ? (
              currentTickets.map((t) => (
                <tr
                  key={t.ticket_type_id}
                  className="hover:bg-blue-50/40 transition"
                >
                  <td className="px-4 py-3 border border-blue-100">
                    {t.ticket_type_id}
                  </td>

                  <td className="px-4 py-3 border border-blue-100 font-medium text-blue-600">
                    {t.name}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {t.description}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {t.category}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {t.price_rule}
                  </td>

                  <td className="px-4 py-3 border border-blue-100 text-green-600 font-semibold">
                    ₹{t.base_price}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    <div className="flex gap-2">
                      <button className="p-2 rounded hover:bg-blue-100 text-blue-600 transition">
                        <Pencil size={18} />
                      </button>

                      <button className="p-2 rounded hover:bg-red-100 text-red-600 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-400">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-blue-100 bg-gray-50">
          <p>
            Showing {indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filteredTickets.length)} of{" "}
            {filteredTickets.length}
          </p>

          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "border border-blue-200 hover:bg-blue-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
