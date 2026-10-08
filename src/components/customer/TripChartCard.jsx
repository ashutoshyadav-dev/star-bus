import React from "react";
import { useQuery } from "react-query";
import { FiDownload, FiUser, FiTruck } from "react-icons/fi";
import { tripChartApi, downloadPdf } from "../../api/tripChart";

const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = Array.isArray(t) ? t : String(t).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = Array.isArray(d) ? d : String(d).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800 text-sm">{value ?? "—"}</p>
    </div>
  );
}

export default function TripChartCard({ bookingId }) {
  const { data, isLoading, isError } = useQuery(
    ["trip-chart", bookingId],
    () => tripChartApi.getMine(bookingId),
    { retry: false, refetchOnWindowFocus: false }
  );
  const chart = data?.data?.data ?? data?.data;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 text-sm text-gray-400">
        Loading trip chart…
      </div>
    );
  }
  if (isError || !chart) return null;

  const handleDownload = async () => {
    try {
      await downloadPdf(tripChartApi.minePdfPath(bookingId), "trip-chart.pdf");
    } catch {
      /* interceptor toasts */
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Trip Chart</h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
        >
          <FiDownload /> Download PDF
        </button>
      </div>

      {chart.crewAssigned ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <FiUser />
            </div>
            <Info label="Driver" value={chart.driverName} />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <FiUser />
            </div>
            <Info label="Conductor" value={chart.conductorName} />
          </div>
        </div>
      ) : (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
          Driver and conductor details will appear here once they are assigned to your trip.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
        <Info label="Service" value={`${chart.serviceCode ?? ""}${chart.busTypeName ? " / " + chart.busTypeName : ""}`} />
        <Info label="Bus No." value={chart.busRegistrationNumber} />
        <Info label="Journey Date" value={fmtDate(chart.journeyDate)} />
        <Info label="Departure" value={fmtTime(chart.departureTime)} />
        <Info label="From" value={chart.source} />
        <Info label="To" value={chart.destination} />
        <Info label="Depot" value={chart.depotName} />
        {chart.otherCrew?.length > 0 && <Info label="Other Crew" value={chart.otherCrew.join(", ")} />}
      </div>

      {chart.seats?.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <FiTruck /> Your seats
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-gray-400">
                <tr>
                  <th className="py-1 pr-4">Seat</th>
                  <th className="py-1 pr-4">Ticket No.</th>
                  <th className="py-1 pr-4">Passenger</th>
                  <th className="py-1 pr-4">Boarding</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {chart.seats.map((s) => (
                  <tr key={s.ticketNo} className="border-t border-gray-50">
                    <td className="py-1.5 pr-4 font-medium">{s.seatLabel}</td>
                    <td className="py-1.5 pr-4 font-mono">{s.ticketNo}</td>
                    <td className="py-1.5 pr-4">{s.passengerName}</td>
                    <td className="py-1.5 pr-4">{s.boardingStation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}