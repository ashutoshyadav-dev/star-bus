import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { FiArrowLeft, FiArrowRight, FiUser, FiClock } from "react-icons/fi";
import { getMyDutyDetails } from "../../api/schedule";
import Spinner from "../../components/common/Spinner";

const isoDate = (d) => {
  if (!d) return "";
  if (Array.isArray(d)) return d.map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-");
  return String(d).slice(0, 10);
};
const fmtDate = (d) => {
  const [y, m, day] = isoDate(d).split("-").map(Number);
  if (!y) return "—";
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
};
const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = Array.isArray(t) ? t : String(t).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800 text-sm">{value ?? "—"}</p>
    </div>
  );
}

export default function DriverDutyDetails() {
  const { dutyId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery(
    ["my-duty-details", dutyId],
    () => getMyDutyDetails(dutyId),
    { retry: false }
  );
  const d = data?.data?.data ?? data?.data;

  if (isLoading) return <div className="p-10 flex justify-center"><Spinner /></div>;
  if (isError || !d) {
    return (
      <div className="p-6">
        <button onClick={() => navigate("/driver/duty")} className="text-sm text-blue-700 flex items-center gap-1">
          <FiArrowLeft /> Back to My Duty
        </button>
        <p className="mt-6 text-gray-400">Duty not found.</p>
      </div>
    );
  }

  const duty = d.duty;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => navigate("/driver/duty")} className="text-sm text-blue-700 flex items-center gap-1 mb-4">
        <FiArrowLeft /> Back to My Duty
      </button>

      <div className="max-w-2xl space-y-5">
        {/* Trip header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            {duty.origin} <FiArrowRight className="text-orange-500" /> {duty.destination}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {fmtDate(duty.journeyDate)} · departs {fmtTime(duty.departureTime)}
          </div>
          {d.delayMinutes > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              <FiClock /> Delayed by {d.delayMinutes} min
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 mt-4 pt-4">
            <Info label="Service" value={duty.routeNumber} />
            <Info label="Bus No." value={duty.busRegistrationNumber} />
            <Info label="Your role" value={String(duty.dutyRole).replace("_", " ")} />
            <Info label="Seats booked" value={`${d.bookedSeats} / ${d.totalSeats ?? "—"}`} />
          </div>
        </div>

        {/* Crew */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Crew</h3>
          <div className="grid grid-cols-2 gap-4">
            {[["Driver", d.driverName], ["Conductor", d.conductorName]].map(([label, name]) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiUser />
                </div>
                <Info label={label} value={name ?? "Not assigned yet"} />
              </div>
            ))}
          </div>
          {d.otherCrew?.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">{d.otherCrew.join(" · ")}</p>
          )}
        </div>

        {/* Stops */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Route & timings</h3>
          {d.stops?.length ? (
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {d.stops.map((s, i) => (
                <li key={s.sequence ?? i} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-gray-800">{s.stationName}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {i === 0 ? fmtTime(s.departureTime) : fmtTime(s.arrivalTime)}
                      {s.dayOffset > 0 ? ` (+${s.dayOffset}d)` : ""}
                    </span>
                  </div>
                  {s.haltMinutes > 0 && (
                    <div className="text-[11px] text-gray-400">Halt {s.haltMinutes} min</div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400">No stops configured for this route.</p>
          )}
        </div>
      </div>
    </div>
  );
}