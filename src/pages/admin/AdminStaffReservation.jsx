import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { stationApi } from "../../api/station";
import { searchAvailableSchedules, getScheduleSeats } from "../../api/schedule";
import { usersApi } from "../../api/users";
import { adminReservationApi } from "../../api/adminReservation";

const MAX_SEATS = 6;

// Backend Gender enum: male, female, other, prefer_not_to_say
const GENDERS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other" },
];

const today = () => new Date().toISOString().slice(0, 10);

// Shared look (same as the Users / Roles / Bus Types pages)
const cardCls   = "bg-white rounded-2xl border border-gray-200 shadow-sm p-5";
const labelCls  = "block text-xs font-semibold text-gray-500 mb-1.5";
const inputCls  =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectCls = inputCls + " appearance-auto cursor-pointer";
const primaryBtn =
  "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold " +
  "transition-colors disabled:opacity-50";

export default function AdminStaffReservation() {
  useEffect(() => {
    document.title = "Staff Reservation | APSTS Admin Portal";
  }, []);

  // Journey
  const [stations, setStations] = useState([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(today);
  const [schedules, setSchedules] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Seats
  const [schedule, setSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selected, setSelected] = useState([]);   // seat objects
  const [details, setDetails] = useState({});     // seat.id -> {name, age, gender}

  // Beneficiary
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState([]);
  const [findingUser, setFindingUser] = useState(false);
  const [beneficiary, setBeneficiary] = useState(null);

  // Submit
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    stationApi.getActiveStations()
      .then((r) => setStations(r.data?.data ?? r.data ?? []))
      .catch(() => toast.error("Failed to load stations"));
  }, []);

  // ── Beneficiary search ───────────────────────────────────────────────────
  const findUser = async () => {
    if (q.trim().length < 3) return toast.error("Type at least 3 characters");
    setFindingUser(true);
    try {
      const r = await usersApi.search(q.trim());
      const list = r.data?.data ?? r.data ?? [];
      setMatches(Array.isArray(list) ? list : []);
      if (!list.length) toast("No users found", { icon: "ℹ️" });
    } catch {
      toast.error("User search failed");
    } finally {
      setFindingUser(false);
    }
  };

  // ── Journey search ───────────────────────────────────────────────────────
  const searchBuses = async () => {
    if (!fromId || !toId || fromId === toId) {
      return toast.error("Pick two different stations");
    }
    setSearching(true);
    setSchedule(null);
    setSeats([]);
    setSelected([]);
    setDetails({});
    try {
      const r = await searchAvailableSchedules(Number(fromId), Number(toId), date);
      const d = r.data?.data ?? r.data ?? [];
      setSchedules(Array.isArray(d) ? d : []);
      setSearched(true);
    } catch {
      toast.error("Failed to search buses");
    } finally {
      setSearching(false);
    }
  };

  const pickSchedule = async (s) => {
    setSchedule(s);
    setSelected([]);
    setDetails({});
    setLoadingSeats(true);
    try {
      const r = await getScheduleSeats(s.scheduleId, s.fromStopSequence, s.toStopSequence);
      setSeats(r.data?.data ?? r.data ?? []);
    } catch {
      toast.error("Failed to load seats");
    } finally {
      setLoadingSeats(false);
    }
  };

  // ── Seats ────────────────────────────────────────────────────────────────
  const toggleSeat = (seat) => {
    if (selected.some((x) => x.id === seat.id)) {
      setSelected(selected.filter((x) => x.id !== seat.id));
    } else if (selected.length >= MAX_SEATS) {
      toast.error(`Only ${MAX_SEATS} seats can be booked at once`, { id: "max-seats" });
    } else {
      setSelected([...selected, seat]);
    }
  };

  const setDetail = (seatId, patch) =>
    setDetails((prev) => ({ ...prev, [seatId]: { ...(prev[seatId] ?? {}), ...patch } }));

  // ── Submit ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!schedule) return toast.error("Select a bus first");
    if (!selected.length) return toast.error("Select at least one seat");
    for (const seat of selected) {
      const d = details[seat.id];
      if (!d?.name?.trim() || !d?.age || !d?.gender) {
        return toast.error(`Fill name, age and gender for seat ${seat.seatLabel}`);
      }
    }
    if (reason.trim().length < 5) return toast.error("Enter the reason for this reservation");

    setBusy(true);
    try {
      const res = await adminReservationApi.create({
        beneficiaryUserId: beneficiary?.id ?? null,
        reason: reason.trim(),
        booking: {
          scheduleId: schedule.scheduleId,
          fromStationId: Number(fromId),
          toStationId: Number(toId),
          // REQUIRED by the backend (@NotNull on CreateBookingRequest.bookingSource)
          bookingSource: "ADMIN_RESERVATION",
          passengers: selected.map((seat) => {
            const d = details[seat.id];
            return {
              passengerName: d.name.trim(),
              passengerAge: Number(d.age),
              passengerGender: d.gender,
              seatId: seat.seatId ?? seat.id,
              concessionType: "NONE",
            };
          }),
        },
      });
      setResult(res.data?.data ?? res.data);
      toast.success("Reservation confirmed (₹0)");
    } catch (err) {
      const data = err?.response?.data;
      const fieldErrors = data?.errors
        ? Object.values(data.errors).join(", ")
        : null;
      toast.error(fieldErrors || data?.message || "Reservation failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setSchedule(null);
    setSchedules([]);
    setSearched(false);
    setSeats([]);
    setSelected([]);
    setDetails({});
    setReason("");
    setBeneficiary(null);
    setMatches([]);
    setQ("");
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className={`${cardCls} text-center space-y-3`}>
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold text-gray-900">Reservation confirmed</h2>
          <p className="text-sm text-gray-600">
            PNR: <span className="font-mono font-bold text-gray-900">{result.pnr}</span>
            {" · "}Amount paid: <b>₹0</b>
          </p>
          <button onClick={reset} className={primaryBtn}>New reservation</button>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Reservation</h1>
        <p className="text-sm text-gray-700 mt-0.5">
          Reserve seats with zero payment. Admin only — every reservation is audited.
        </p>
      </div>

      {/* 1. Beneficiary */}
      <section className={cardCls}>
        <h2 className="font-semibold text-gray-800 mb-3">1. Reserve for (optional)</h2>
        <p className="text-xs text-gray-500 mb-3">
          Leave empty to reserve in your own name.
        </p>

        {beneficiary ? (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200
            rounded-xl px-4 py-2.5 text-sm">
            <span className="text-blue-800">
              <b>{beneficiary.phoneNumber}</b>
              {beneficiary.email ? ` · ${beneficiary.email}` : ""}
            </span>
            <button
              onClick={() => setBeneficiary(null)}
              className="text-xs font-semibold text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && findUser()}
                placeholder="Search by phone / email"
                className={inputCls}
              />
              <button onClick={findUser} disabled={findingUser} className={primaryBtn}>
                {findingUser ? "…" : "Search"}
              </button>
            </div>
            {matches.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100
                overflow-hidden max-h-56 overflow-y-auto">
                {matches.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setBeneficiary(u); setMatches([]); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700
                      hover:bg-gray-50"
                  >
                    <b>{u.phoneNumber}</b>
                    {u.email ? <span className="text-gray-500"> · {u.email}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* 2. Journey */}
      <section className={cardCls}>
        <h2 className="font-semibold text-gray-800 mb-3">2. Journey</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className={labelCls}>From</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={selectCls}>
              <option value="">From station</option>
              {stations
                .filter((s) => String(s.id) !== String(toId))
                .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>To</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className={selectCls}>
              <option value="">To station</option>
              {stations
                .filter((s) => String(s.id) !== String(fromId))
                .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date" value={date} min={today()}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <button onClick={searchBuses} disabled={searching} className={primaryBtn}>
            {searching ? "Searching…" : "Search buses"}
          </button>
        </div>

        {searched && schedules.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">No buses found for this route and date.</p>
        )}

        {schedules.length > 0 && (
          <div className="mt-4 space-y-2">
            {schedules.map((s) => (
              <button
                key={s.scheduleId}
                onClick={() => pickSchedule(s)}
                className={`w-full text-left border rounded-xl px-4 py-3 flex items-center
                  justify-between transition-colors
                  ${schedule?.scheduleId === s.scheduleId
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"}`}
              >
                <div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {s.busRegistration}{s.busTypeName ? ` · ${s.busTypeName}` : ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.routeName} · departs {s.boardingTime}
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50
                  border border-emerald-200 px-2 py-0.5 rounded-full">
                  Fare waived
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. Seats */}
      {schedule && (
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">3. Pick seats</h2>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border
              border-blue-200 px-2.5 py-1 rounded-full">
              {selected.length} / {MAX_SEATS}
            </span>
          </div>

          {loadingSeats ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent
                rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-5">
                {seats.map((seat) => {
                  const taken = seat.seatStatus !== "available";
                  const on = selected.some((x) => x.id === seat.id);
                  return (
                    <button
                      key={seat.id}
                      disabled={taken}
                      onClick={() => toggleSeat(seat)}
                      className={`rounded-lg py-2 text-sm font-semibold border
                        ${taken
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                          : on
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}
                    >
                      {seat.seatLabel}
                    </button>
                  );
                })}
              </div>

              {selected.length > 0 && (
                <div className="space-y-3">
                  {selected.map((seat) => {
                    const d = details[seat.id] ?? {};
                    return (
                      <div key={seat.id}
                        className="grid grid-cols-1 sm:grid-cols-[4rem_1fr_6rem_9rem] gap-3 items-end
                          border border-gray-100 rounded-xl p-3 bg-gray-50/60">
                        <div className="text-sm font-bold text-gray-800">
                          Seat {seat.seatLabel}
                        </div>
                        <div>
                          <label className={labelCls}>Passenger name</label>
                          <input
                            value={d.name ?? ""}
                            onChange={(e) => setDetail(seat.id, { name: e.target.value })}
                            className={inputCls}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Age</label>
                          <input
                            type="number" min={0} max={120}
                            value={d.age ?? ""}
                            onChange={(e) => setDetail(seat.id, { age: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Gender</label>
                          <select
                            value={d.gender ?? ""}
                            onChange={(e) => setDetail(seat.id, { gender: e.target.value })}
                            className={selectCls}
                          >
                            <option value="" disabled>Select</option>
                            {GENDERS.map((g) => (
                              <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* 4. Reason + confirm */}
      <section className={cardCls}>
        <h2 className="font-semibold text-gray-800 mb-3">4. Reason (recorded in audit log)</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. Inspection team travel, official duty"
          className={inputCls}
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">{reason.length}/500</span>
          <button
            onClick={submit}
            disabled={busy || !schedule || selected.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl
              text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {busy ? "Reserving…" : "Confirm reservation — ₹0"}
          </button>
        </div>
      </section>
    </div>
  );
}