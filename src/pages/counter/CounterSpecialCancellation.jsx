import { useConfirm } from "../../components/common/ConfirmDialog";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import { dutyRosterApi } from "../../api/dutyRoster";
import { specialCancellationApi } from "../../api/specialCancellation";

const unwrap = (res) => res?.data?.data ?? res?.data ?? [];

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
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = Array.isArray(t) ? t : String(t).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const REASONS = [
  ["BREAKDOWN", "Bus breakdown"],
  ["ACCIDENT", "Accident"],
  ["ROAD_BLOCKED", "Road blocked / landslide"],
  ["WEATHER", "Bad weather"],
  ["STAFF_UNAVAILABLE", "Crew unavailable"],
  ["OTHER", "Other"],
];

const STATUS_STYLE = {
  PENDING:   "bg-amber-100 text-amber-700",
  APPROVED:  "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};
const STATUS_LABEL = {
  PENDING: "Waiting for admin", APPROVED: "Approved: refunds in progress",
  COMPLETED: "Approved", REJECTED: "Rejected", WITHDRAWN: "Withdrawn",
};

export default function CounterSpecialCancellation() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(toLocalISO(new Date()));
  const [routeId, setRouteId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [reasonCategory, setReasonCategory] = useState("BREAKDOWN");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const { data: routes = [] } = useQuery(
    ["duty-routes"],
    () => dutyRosterApi.lookupRoutes().then(unwrap),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: trips = [], isLoading: tripsLoading } = useQuery(
    ["sc-trips", date, routeId],
    () => dutyRosterApi.roster({ from: date, to: date, routeId: routeId || undefined }).then(unwrap)
  );
  const openTrips = trips.filter((t) => !["completed", "cancelled"].includes(t.tripStatus));

  const { data: mine = [], isLoading: mineLoading } = useQuery(
    ["sc-mine"],
    () => specialCancellationApi.mine().then(unwrap),
    { refetchInterval: 20000 }
  );

  const canSend = scheduleId && details.trim().length >= 10 && !sending;

  const submit = async () => {
    setSending(true);
    try {
      await specialCancellationApi.create({ scheduleId, reasonCategory, reasonDetails: details.trim() });
      toast.success("Request sent to admin");
      setScheduleId("");
      setDetails("");
      queryClient.invalidateQueries(["sc-mine"]);
    } catch {
      /* the axios interceptor already toasted the reason */
    } finally {
      setSending(false);
    }
  };

  const withdraw = async (id) => {
    if (!(await confirm({
      title: "Withdraw this request?",
      message: "The special cancellation request will be withdrawn.",
      tone: "warning",
      confirmText: "Withdraw",
    }))) return;
    try {
      await specialCancellationApi.withdraw(id);
      toast.success("Request withdrawn");
      queryClient.invalidateQueries(["sc-mine"]);
    } catch {
      /* interceptor toasts */
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Special Cancellation</h1>
      <p className="text-sm text-gray-500 mb-6">
        Use this when a trip cannot run (breakdown, accident, blocked road). An admin decides the refund
        for every passenger. Nothing is cancelled or refunded until the admin approves.
      </p>

      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
        {/* New request */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-500" /> New request
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="text-xs text-gray-500">
              Journey date
              <input type="date" value={date}
                onChange={(e) => { setDate(e.target.value); setScheduleId(""); }}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
            </label>
            <label className="text-xs text-gray-500">
              Route
              <select value={routeId}
                onChange={(e) => { setRouteId(e.target.value); setScheduleId(""); }}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800">
                <option value="">All routes</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.routeNumber}: {r.origin} to {r.destination}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-gray-500 mb-2">Select the trip</p>
          <div className="border border-gray-200 rounded-lg max-h-56 overflow-auto mb-4">
            {tripsLoading ? (
              <div className="p-4 text-sm text-gray-400">Loading trips…</div>
            ) : openTrips.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No active trips for this selection</div>
            ) : (
              openTrips.map((t) => (
                <label key={t.scheduleId}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                    scheduleId === t.scheduleId ? "bg-amber-50" : ""}`}>
                  <input type="radio" name="trip" checked={scheduleId === t.scheduleId}
                    onChange={() => setScheduleId(t.scheduleId)} />
                  <div className="text-sm">
                    <div className="font-medium text-gray-800 flex items-center gap-1">
                      {t.routeNumber} · {t.origin} <FiArrowRight className="text-orange-500" /> {t.destination}
                    </div>
                    <div className="text-xs text-gray-500">
                      {fmtTime(t.departureTime)} · Bus {t.busRegistrationNumber}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          <label className="text-xs text-gray-500 block mb-3">
            Reason
            <select value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800">
              {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>

          <label className="text-xs text-gray-500 block mb-4">
            What happened (at least 10 characters)
            <textarea rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder="For example: the bus broke down at Seppa, the mechanic says it cannot be repaired today."
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800" />
          </label>

          <button disabled={!canSend} onClick={submit}
            className="w-full bg-amber-600 text-white rounded-lg py-2.5 font-semibold hover:bg-amber-700 disabled:opacity-50">
            {sending ? "Sending…" : "Send to admin"}
          </button>
        </div>

        {/* My requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">My requests</h2>
          {mineLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : mine.length === 0 ? (
            <p className="text-sm text-gray-400">You have not raised any request yet.</p>
          ) : (
            <div className="space-y-3">
              {mine.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-gray-800">
                      {r.routeNumber} · {r.origin} to {r.destination}
                      <div className="text-xs text-gray-500 font-normal">
                        {fmtDate(r.journeyDate)} · {fmtTime(r.departureTime)}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  {r.reviewNote && <p className="text-xs text-gray-500 mt-2">Admin note: {r.reviewNote}</p>}
                  {(r.status === "APPROVED" || r.status === "COMPLETED") && (
                    <p className="text-xs text-gray-500 mt-2">
                      {r.refundsCreated} of {r.totalBookings} bookings processed ·{" "}
                      ₹{Number(r.totalRefundAmount ?? 0).toLocaleString("en-IN")} in refunds.
                      Counter-paid refunds are under <b>Refunds</b>.
                    </p>
                  )}
                  {r.status === "PENDING" && (
                    <button onClick={() => withdraw(r.id)} className="mt-2 text-xs text-red-600 hover:underline">
                      Withdraw
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}