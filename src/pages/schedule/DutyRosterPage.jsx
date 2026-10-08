import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import { UserPlus, Repeat, Trash2, FileText, Send, X, Search, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { dutyRosterApi } from "../../api/dutyRoster";
import { tripChartApi, downloadPdf } from "../../api/tripChart";

// ── helpers ────────────────────────────────────────────────────────────────
const unwrap = (res) => res?.data?.data ?? res?.data ?? [];

// Local-date "YYYY-MM-DD" (toISOString alone would give the UTC date, which is
// yesterday in India before 5:30am)
const toLocalISO = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Backend may send "2026-01-13" or [2026,1,13] depending on Jackson config
const isoDate = (d) => {
  if (!d) return "";
  if (Array.isArray(d)) return d.map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-");
  return String(d).slice(0, 10);
};
const fmtDate = (d) => {
  const [y, m, day] = isoDate(d).split("-").map(Number);
  if (!y) return "—";
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = Array.isArray(t) ? t : String(t).split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

// Trips in these states can no longer have their crew changed (server enforces it too)
const LOCKED_STATES = ["completed", "cancelled", "departed", "in_transit"];

// ── staff picker modal ─────────────────────────────────────────────────────
function StaffPickerModal({ row, role, onClose, onDone }) {
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const dateStr = isoDate(row.journeyDate);
  const currentSlot = role === "driver" ? row.driver : row.conductor;

  const { data: staff = [], isLoading } = useQuery(
    ["duty-staff", role, dateStr],
    () => dutyRosterApi.lookupStaff(role, dateStr).then(unwrap)
  );

  const list = staff.filter((s) =>
    `${s.fullName} ${s.employeeCode}`.toLowerCase().includes(q.toLowerCase())
  );

  const choose = async (s) => {
    setSaving(true);
    try {
      if (currentSlot) {
        await dutyRosterApi.reassign(currentSlot.dutyId, s.userId);
        toast.success(`${role} changed to ${s.fullName}`);
      } else {
        await dutyRosterApi.assign({
          scheduleId: row.scheduleId,
          staffUserId: s.userId,
          dutyRole: role,
        });
        toast.success(`${s.fullName} assigned as ${role}`);
      }
      onDone();
    } catch {
      // the axios interceptor already toasted the server message
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 capitalize">
              {currentSlot ? "Change" : "Assign"} {role}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {row.routeNumber} · {row.origin} → {row.destination} · {fmtDate(row.journeyDate)}{" "}
              {fmtTime(row.departureTime)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or employee code"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
            />
          </div>
          {row.tripChartSharedAt && (
            <p className="text-xs text-amber-600 mt-2">
              The trip chart was already shared. Passengers will be notified of this change.
            </p>
          )}
        </div>

        <div className="overflow-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading staff…</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No matching {role}s found</div>
          ) : (
            list.map((s) => {
              const isCurrent = currentSlot?.staffUserId === s.userId;
              return (
                <button
                  key={s.userId}
                  disabled={saving || isCurrent}
                  onClick={() => choose(s)}
                  className="w-full text-left px-5 py-3 border-b border-gray-50 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{s.fullName}</div>
                    <div className="text-xs text-gray-400">{s.employeeCode}</div>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs text-gray-400">Current</span>
                  ) : s.busyOnDate ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Has another trip that day
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Free
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── one crew slot (driver or conductor) ────────────────────────────────────
function SlotCell({ slot, role, row, locked, perms, busy, onPick, onRemove }) {
  if (!slot) {
    return (
      <button
        disabled={locked || !perms.assign}
        onClick={() => onPick(row, role)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <UserPlus size={13} /> Assign {role}
      </button>
    );
  }

  const started = !!slot.checkInAt;
  return (
    <div className="flex items-center gap-2">
      <div>
        <div className="text-sm font-medium text-gray-800">{slot.staffName}</div>
        <div className="text-xs text-gray-400">
          {slot.employeeCode ?? ""}
          {started ? " · on duty" : ""}
        </div>
      </div>
      {started ? (
        <Lock size={13} className="text-gray-300" />
      ) : (
        !locked && (
          <>
            {perms.reassign && (
              <button
                title="Change"
                disabled={busy}
                onClick={() => onPick(row, role)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                <Repeat size={14} />
              </button>
            )}
            {perms.unassign && (
              <button
                title="Remove"
                disabled={busy}
                onClick={() => onRemove(slot, role)}
                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
        )
      )}
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function DutyRosterPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const perms = {
    assign: hasPermission("dutyAssignment:assign"),
    reassign: hasPermission("dutyAssignment:reassign"),
    unassign: hasPermission("dutyAssignment:unassign"),
    chart: hasPermission("tripChart:view"),
    share: hasPermission("tripChart:share"),
  };

  const [from, setFrom] = useState(toLocalISO(new Date()));
  const [to, setTo] = useState(toLocalISO(new Date()));
  const [routeId, setRouteId] = useState("");
  const [filter, setFilter] = useState("all"); // all | unassigned | complete
  const [picker, setPicker] = useState(null);  // { row, role }
  const [busyId, setBusyId] = useState(null);

  const { data: routes = [] } = useQuery(
    ["duty-routes"],
    () => dutyRosterApi.lookupRoutes().then(unwrap),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: rows = [], isLoading, isFetching } = useQuery(
    ["duty-roster", from, to, routeId],
    () => dutyRosterApi.roster({ from, to, routeId: routeId || undefined }).then(unwrap),
    { keepPreviousData: true }
  );

  const visible = useMemo(
    () =>
      rows.filter((r) =>
        filter === "all" ? true
        : filter === "unassigned" ? !r.driver || !r.conductor
        : r.driver && r.conductor
      ),
    [rows, filter]
  );

  const unassignedCount = rows.filter((r) => !r.driver || !r.conductor).length;
  const refresh = () => queryClient.invalidateQueries(["duty-roster"]);

  const handleRemove = async (slot, role) => {
    if (!window.confirm(`Remove ${slot.staffName} as ${role} from this trip?`)) return;
    setBusyId(slot.dutyId);
    try {
      await dutyRosterApi.unassign(slot.dutyId);
      toast.success("Duty removed");
      refresh();
    } catch {
      /* interceptor toasts */
    } finally {
      setBusyId(null);
    }
  };

  const handleShare = async (row) => {
    const again = row.tripChartSharedAt ? "again " : "";
    if (!window.confirm(`Send the trip chart ${again}to all passengers of this trip?`)) return;
    setBusyId(row.scheduleId);
    try {
      const res = await tripChartApi.share(row.scheduleId);
      toast.success(res.data?.message ?? "Trip chart shared");
      refresh();
    } catch {
      /* interceptor toasts */
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (row) => {
    setBusyId(row.scheduleId);
    try {
      await downloadPdf(
        tripChartApi.fullPdfPath(row.scheduleId),
        `trip-chart-${row.routeNumber}-${isoDate(row.journeyDate)}.pdf`
      );
    } catch {
      /* interceptor toasts */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header + filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Duty Roster</h1>
              <p className="text-sm text-gray-500">
                Assign a driver and conductor to each trip, then share the trip chart with passengers.
              </p>
            </div>
            {unassignedCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {unassignedCount} trip{unassignedCount > 1 ? "s" : ""} need crew
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <label className="text-xs text-gray-500">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  if (e.target.value > to) setTo(e.target.value);
                }}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
              />
            </label>
            <label className="text-xs text-gray-500">
              To
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
              />
            </label>
            <label className="text-xs text-gray-500 col-span-2">
              Route
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
              >
                <option value="">All routes</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.routeNumber} — {r.origin} → {r.destination}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500">
              Show
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
              >
                <option value="all">All trips</option>
                <option value="unassigned">Needs crew</option>
                <option value="complete">Crew complete</option>
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading roster…</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No trips found for this selection</div>
        ) : (
          <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Trip</th>
                  <th className="px-5 py-3">Bus</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Conductor</th>
                  <th className="px-5 py-3">Trip chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((row) => {
                  const locked = LOCKED_STATES.includes(row.tripStatus);
                  const complete = !!row.driver && !!row.conductor;
                  const busy = busyId === row.scheduleId;
                  return (
                    <tr key={row.scheduleId} className="align-top">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-gray-800">
                          {row.routeNumber} · {row.origin} → {row.destination}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {fmtDate(row.journeyDate)} · {fmtTime(row.departureTime)}
                        </div>
                        {locked && (
                          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {row.tripStatus.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        <div>{row.busRegistrationNumber}</div>
                        <div className="text-xs text-gray-400">{row.busTypeName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <SlotCell slot={row.driver} role="driver" row={row} locked={locked}
                          perms={perms} busy={busyId === row.driver?.dutyId}
                          onPick={(r, role) => setPicker({ row: r, role })}
                          onRemove={handleRemove} />
                      </td>
                      <td className="px-5 py-4">
                        <SlotCell slot={row.conductor} role="conductor" row={row} locked={locked}
                          perms={perms} busy={busyId === row.conductor?.dutyId}
                          onPick={(r, role) => setPicker({ row: r, role })}
                          onRemove={handleRemove} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {perms.chart && (
                            <button
                              disabled={busy}
                              onClick={() => handleDownload(row)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                            >
                              <FileText size={13} /> PDF
                            </button>
                          )}
                          {perms.share && (
                            <button
                              disabled={busy || !complete || locked}
                              title={complete ? "" : "Assign driver and conductor first"}
                              onClick={() => handleShare(row)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Send size={13} /> {row.tripChartSharedAt ? "Re-share" : "Share"}
                            </button>
                          )}
                        </div>
                        {row.tripChartSharedAt && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            Shared {new Date(row.tripChartSharedAt).toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {picker && (
        <StaffPickerModal
          row={picker.row}
          role={picker.role}
          onClose={() => setPicker(null)}
          onDone={() => {
            setPicker(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}