import {
  Bus,
  CheckCircle,
  Clock3,
  Eye,
  Lock,
  LockOpen,
  Plus,
  Route,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { format } from "date-fns";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { getAllSchedules, toggleScheduleBooking } from "../../api/schedule";

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-700",
  departed: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function ScheduleManagement() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ENTRIES = 8;

  const { data, isLoading } = useQuery(
    ["schedules"],
    () => getAllSchedules(format(new Date(), "yyyy-MM-dd")),
    {
      staleTime: 30000,
    }
  );

  // const schedules = data?.data ?? [];
  const schedules = data?.data?.data ?? data?.data ?? [];

  const bookingMut = useMutation(
    ({ id, open }) => toggleScheduleBooking(id, open),
    {
      onSuccess: () => {
        toast.success("Booking updated");
        qc.invalidateQueries("schedules");
      },
      onError: () => toast.error("Failed to update booking"),
    }
  );

  const filtered = schedules.filter((s) => {
    const q = search.toLowerCase();

    const matchSearch =
      (s.routeName ?? "").toLowerCase().includes(q) ||
      (s.origin ?? "").toLowerCase().includes(q) ||
      (s.destination ?? "").toLowerCase().includes(q) ||
      (s.registrationNumber ?? "").toLowerCase().includes(q);

    const matchStatus = statusFilter
      ? s.tripStatus === statusFilter
      : true;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / ENTRIES)
  );

  const start = (currentPage - 1) * ENTRIES;

  const current = filtered.slice(start, start + ENTRIES);

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
            className="w-12 h-12"
            alt=""
          />

          <div>
            <h2 className="text-2xl font-semibold">
              Schedule Management 
            </h2>

            <p className="text-sm text-gray-400">
              {schedules.length} schedules
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/admin/schedules/add")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 mb-6">

        <div className="flex items-center border rounded-lg px-3 py-2 w-80">
          <Search size={15} className="text-gray-400 mr-2" />

          <input
            type="text"
            placeholder="Search route, bus, origin..."
            className="w-full outline-none text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="departed">Departed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {isLoading ? (
          <p className="p-8 text-center text-gray-400">
            Loading schedules...
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400">
            No schedules found.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">

                <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                  <tr>
                    {[
                      "Route",
                      "Journey",
                      "Bus",
                      "Date",
                      "Departure",
                      "Seats",
                      "Booking",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">

                  {current.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-blue-50/30 transition"
                    >

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Route size={15} className="text-blue-500" />

                          <div>
                            <p className="font-medium">
                              {s.routeName}
                            </p>

                            <p className="text-xs text-gray-500">
                              {s.origin} → {s.destination}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {s.id.slice(0, 8)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Bus size={15} className="text-gray-500" />
                          <div>
                            <p>{s.registrationNumber}</p>
                            <p className="text-xs text-gray-400">
                              {s.busTypeName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(
                          new Date(s.journeyDate),
                          "dd MMM yyyy"
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock3 size={14} />
                          {s.departureTime}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium">
                          {s.availableSeats}
                        </span>
                        <span className="text-gray-400">
                          /{s.totalSeats}
                        </span>
                      </td>

                      <td className="px-4 py-3">

                        {s.isBookingOpen ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle size={13} />
                            Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                            <XCircle size={13} />
                            Closed
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={s.tripStatus} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-1">

                          <button
                            onClick={() =>
                              navigate(`/admin/schedules/${s.id}`)
                            }
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() =>
                              bookingMut.mutate({
                                id: s.id,
                                open: !s.isBookingOpen,
                              })
                            }
                            className={`p-1.5 rounded ${
                              s.isBookingOpen
                                ? "hover:bg-red-100 text-red-500"
                                : "hover:bg-green-100 text-green-600"
                            }`}
                          >
                            {s.isBookingOpen ? (
                              <Lock size={15} />
                            ) : (
                              <LockOpen size={15} />
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">

              <p className="text-sm text-gray-500">
                Showing {start + 1}–
                {Math.min(start + ENTRIES, filtered.length)} of{" "}
                {filtered.length}
              </p>

              <div className="flex gap-2">

                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((p) => p - 1)
                  }
                  className="px-3 py-1 border rounded disabled:opacity-40"
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
                        : "border"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => p + 1)
                  }
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}