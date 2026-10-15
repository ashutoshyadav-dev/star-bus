import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { FiArrowRight, FiLogIn, FiLogOut, FiChevronRight, FiLock } from "react-icons/fi";
import { getMyDutyAssignments, checkInMyDuty, checkOutMyDuty } from "../../api/schedule";
import Spinner from "../../components/common/Spinner";

// ── helpers ────────────────────────────────────────────────────────────────
const toLocalISO = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Backend may send "2026-01-13" or [2026,1,13]
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

const statusOf = (d) => (d.checkOutAt ? "completed" : d.checkInAt ? "on_duty" : "assigned");

const STATUS_STYLE = {
  assigned:  { label: "Assigned",  cls: "bg-blue-100 text-blue-700" },
  on_duty:   { label: "On duty",   cls: "bg-green-100 text-green-700" },
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
};

function DutyCard({ duty, isToday, busy, onCheckIn, onCheckOut, onOpen }) {
  const status = statusOf(duty);
  const badge = STATUS_STYLE[status];
  const cancelled = duty.tripStatus === "cancelled";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            {duty.origin ?? "—"} <FiArrowRight className="text-orange-500" /> {duty.destination ?? "—"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {fmtDate(duty.journeyDate)} · {fmtTime(duty.departureTime)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Service {duty.routeNumber ?? "—"} · Bus {duty.busRegistrationNumber ?? "—"} ·{" "}
            <span className="capitalize">{String(duty.dutyRole).replace("_", " ")}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
          {cancelled && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-600">Trip cancelled</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {status === "assigned" && isToday && !cancelled && (
          <button
            disabled={busy}
            onClick={() => onCheckIn(duty)}
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
          <button
            disabled={busy}
            onClick={() => onCheckOut(duty)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
          >
            <FiLogOut /> End Duty
          </button>
        )}
        <button
          onClick={() => onOpen(duty)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-blue-700 hover:bg-blue-50"
        >
          Trip details <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

function Section({ title, children, count }) {
  if (count === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function DriverDuty() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const { data, isLoading } = useQuery(["my-duties"], () => getMyDutyAssignments());
  const all = data?.data?.data ?? data?.data ?? [];

  const today = toLocalISO(new Date());
  const todays   = all.filter((d) => isoDate(d.journeyDate) === today);
  const upcoming = all.filter((d) => isoDate(d.journeyDate) > today).reverse(); // soonest first
  const past     = all.filter((d) => isoDate(d.journeyDate) < today);

  const refresh = () => queryClient.invalidateQueries(["my-duties"]);

  const act = async (duty, fn, okMsg) => {
    setBusyId(duty.id);
    try {
      await fn(duty.id);
      toast.success(okMsg);
      refresh();
    } catch {
      /* the axios interceptor already toasted the server message */
    } finally {
      setBusyId(null);
    }
  };

  const open = (duty) => navigate(`/driver/duty/${duty.id}`);

  if (isLoading) return <div className="p-10 flex justify-center"><Spinner /></div>;

  const cardProps = (isToday) => ({
    isToday,
    onCheckIn: (d) => act(d, checkInMyDuty, "Duty started. Drive safe!"),
    onCheckOut: (d) => act(d, checkOutMyDuty, "Duty ended"),
    onOpen: open,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">My Duty</h1>
      <p className="text-sm text-gray-500 mb-6">Your assigned trips, with the bus and conductor for each.</p>

      {all.length === 0 && (
        <div className="text-center text-gray-400 py-16">No duty assigned yet</div>
      )}

      <div className="max-w-2xl">
        <Section title="Today" count={todays.length}>
          {todays.map((d) => (
            <DutyCard key={d.id} duty={d} busy={busyId === d.id} {...cardProps(true)} />
          ))}
        </Section>
        <Section title="Upcoming" count={upcoming.length}>
          {upcoming.map((d) => (
            <DutyCard key={d.id} duty={d} busy={busyId === d.id} {...cardProps(false)} />
          ))}
        </Section>
        <Section title="Last 30 days" count={past.length}>
          {past.map((d) => (
            <DutyCard key={d.id} duty={d} busy={busyId === d.id} {...cardProps(false)} />
          ))}
        </Section>
      </div>
    </div>
  );
}