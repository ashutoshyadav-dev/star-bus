import React, { useMemo, useState } from "react";
import {
  Search,
  QrCode,
  Download,
  Eye,
  CheckCircle,
  Trash2,
  Copy,
} from "lucide-react";

const qrData = [
  {
    qr_id: "QR-1001",
    ticket_id: 501,
    pnr: "PNR12345",
    status: "Active",
    generated_at: "26 Apr 2026, 10:30 AM",
    last_scanned: "-",
    device: "Mobile App",
  },
  {
    qr_id: "QR-1002",
    ticket_id: 502,
    pnr: "PNR56789",
    status: "Used",
    generated_at: "25 Apr 2026, 02:10 PM",
    last_scanned: "26 Apr 2026, 09:00 AM",
    device: "Operator Device",
  },
  {
    qr_id: "QR-1003",
    ticket_id: 503,
    pnr: "PNR98765",
    status: "Expired",
    generated_at: "22 Apr 2026, 06:20 PM",
    last_scanned: "-",
    device: "Mobile App",
  },
  {
    qr_id: "QR-1004",
    ticket_id: 504,
    pnr: "PNR45678",
    status: "Active",
    generated_at: "26 Apr 2026, 11:45 AM",
    last_scanned: "-",
    device: "Operator Device",
  },
  {
    qr_id: "QR-1005",
    ticket_id: 505,
    pnr: "PNR74125",
    status: "Used",
    generated_at: "24 Apr 2026, 08:15 PM",
    last_scanned: "25 Apr 2026, 07:10 PM",
    device: "Mobile App",
  },
];

export default function QrManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQR, setSelectedQR] = useState(null);

  const rowsPerPage = 5;

  const filteredData = useMemo(() => {
    return qrData.filter((item) => {
      const matchSearch =
        item.pnr.toLowerCase().includes(search.toLowerCase()) ||
        item.qr_id.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter
        ? item.status === statusFilter
        : true;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirst, indexOfLast);

  const badgeColor = (status) => {
    if (status === "Active") return "bg-green-100 text-green-700";
    if (status === "Used") return "bg-blue-100 text-blue-700";
    return "bg-red-100 text-red-700";
  };

  const copyPNR = (pnr) => {
    navigator.clipboard.writeText(pnr);
    alert("PNR Copied");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl shadow border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
            <QrCode size={30} className="text-blue-600" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              QR Management
            </h2>
            <p className="text-sm text-gray-500">
              Generate & Manage Ticket QR Codes
            </p>
          </div>
        </div>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition">
          + Generate QR
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total QR" value={qrData.length} />
        <StatCard
          title="Active"
          value={qrData.filter((x) => x.status === "Active").length}
        />
        <StatCard
          title="Used"
          value={qrData.filter((x) => x.status === "Used").length}
        />
        <StatCard
          title="Expired"
          value={qrData.filter((x) => x.status === "Expired").length}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow border border-blue-100 mb-6">
        <div className="flex items-center border border-blue-200 rounded-lg px-3 py-2 w-80 bg-white focus-within:ring-2 focus-within:ring-blue-400">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by PNR / QR ID"
            className="w-full outline-none text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-blue-200 rounded-lg px-3 py-2 text-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Status</option>
          <option>Active</option>
          <option>Used</option>
          <option>Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-blue-50 text-gray-700 uppercase text-xs">
            <tr>
              {[
                "QR ID",
                "Ticket ID",
                "PNR",
                "QR Code",
                "Status",
                "Generated at",
                "Last Scan",
                "Device",
                
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
            {currentRows.length > 0 ? (
              currentRows.map((q) => (
                <tr
                  key={q.qr_id}
                  className="hover:bg-blue-50/40 transition"
                >
                  <td className="px-4 py-3 border border-blue-100 font-medium text-blue-600">
                    {q.qr_id}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {q.ticket_id}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    <div className="flex items-center gap-2">
                      {q.pnr}
                      <Copy
                        size={15}
                        onClick={() => copyPNR(q.pnr)}
                        className="cursor-pointer text-gray-400 hover:text-blue-600"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    <button
                      onClick={() => setSelectedQR(q)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition"
                    >
                      <QrCode
                        size={24}
                        className="text-blue-600 hover:scale-110 transition-transform"
                      />
                    </button>
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor(
                        q.status
                      )}`}
                    >
                      {q.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {q.generated_at}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {q.last_scanned}
                  </td>

                  <td className="px-4 py-3 border border-blue-100">
                    {q.device}
                  </td>

                  
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="p-5 text-center text-gray-400"
                >
                  No QR Found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 text-sm border-t border-blue-100 bg-gray-50">
          <p>
            Showing {indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filteredData.length)} of{" "}
            {filteredData.length}
          </p>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[380px] text-center relative">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-red-500"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              QR Preview
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              {selectedQR.qr_id} | {selectedQR.pnr}
            </p>

            <div className="flex justify-center">
              <div className="bg-gray-100 p-8 rounded-2xl border">
                <QrCode size={180} className="text-black" />
              </div>
            </div>

            <button
              onClick={() => setSelectedQR(null)}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow border border-blue-100 p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold mt-2 text-gray-800">{value}</h2>
    </div>
  );
}