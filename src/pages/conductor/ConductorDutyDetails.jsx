import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import {
  FiArrowLeft, FiArrowRight, FiUser, FiClock, FiLogIn, FiLogOut, FiCamera, FiLock,
} from "react-icons/fi";
import { getMyDutyDetails, checkInMyDuty, checkOutMyDuty } from "../../api/schedule";
import Spinner from "../../components/common/Spinner";

// ── helpers ────────────────────────────────────────────────────────────────
const toLocalISO = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

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

const STATUS_STYLE = {
  assigned:  { label: "Assigned",  cls: "bg-blue-100 text-blue-700" },
  on_duty:   { label: "On duty",   cls: "bg-green-100 text-green-700" },
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
};

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800 text-sm">{value ?? "—"}</p>
    </div>
  );
}

export default function ConductorDutyDetails() {
  const { dutyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError } = useQuery(
    ["my-duty-details", dutyId],
    () => getMyDutyDetails(dutyId),
    { retry: false }
  );
  const d = data?.data?.data ?? data?.data;

  const back = () => navigate("/conductor/duty");

  if (isLoading) return <div className="p-10 flex justify-center"><Spinner /></div>;

  if (isError || !d) {
    return (
      <div className="p-6">
        <button onClick={back} className="text-sm text-blue-700 flex items-center gap-1">
          <FiArrowLeft /> Back to My Duty
        </button>
        <p className="mt-6 text-gray-400">Duty not found.</p>
      </div>
    );
  }

  const duty = d.duty;
  const status = duty.checkOutAt ? "completed" : duty.checkInAt ? "on_duty" : "assigned";
  const badge = STATUS_STYLE[status];
  const isToday = isoDate(duty.journeyDate) === toLocalISO(new Date());
  const cancelled = duty.tripStatus === "cancelled";

  const refresh = () => {
    queryClient.invalidateQueries(["my-duty-details", dutyId]);
    queryClient.invalidateQueries(["my-duties"]);
  };

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await checkInMyDuty(duty.id);
      toast.success("Duty started. Loading manifest…");
      navigate(`/conductor/scan/${duty.scheduleId}`);
    } catch {
      /* the axios interceptor already toasted the reason */
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      await checkOutMyDuty(duty.id);
      toast.success("Duty ended");
      refresh();
    } catch {
      /* the axios interceptor already toasted the server message */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={back} className="text-sm text-blue-700 flex items-center gap-1 mb-4">
        <FiArrowLeft /> Back to My Duty
      </button>

      <div className="max-w-2xl space-y-5">
        {/* Trip header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                {duty.origin} <FiArrowRight className="text-orange-500" /> {duty.destination}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {fmtDate(duty.journeyDate)} · departs {fmtTime(duty.departureTime)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
              {cancelled && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-600">Trip cancelled</span>
              )}
            </div>
          </div>

          {d.delayMinutes > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              <FiClock /> Delayed by {d.delayMinutes} min
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 mt-4 pt-4">
            <Info label="Service" value={duty.routeNumber} />
            <Info label="Bus No." value={duty.busRegistrationNumber} />
            <Info label="Your role" value={String(duty.dutyRole).replace("_", " ")} />
            <Info label="Seats booked" value={`${d.bookedSeats} / ${d.totalSeats ?? "—"}`} />
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {status === "assigned" && isToday && !cancelled && (
              <button
                disabled={busy}
                onClick={handleCheckIn}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                <FiLogIn /> Start Duty
              </button>
            )}
            {status === "assigned" && !isToday && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <FiLock /> Start Duty opens on the journey day
              </span>
            )}
            {status === "on_duty" && (
              <>
                <button
                  onClick={() => navigate(`/conductor/scan/${duty.scheduleId}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  <FiCamera /> Continue Scanning
                </button>
                <button
                  disabled={busy}
                  onClick={handleCheckOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
                >
                  <FiLogOut /> End Duty
                </button>
              </>
            )}
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