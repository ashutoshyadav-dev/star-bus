import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { stationApi } from "../../api/station";
import { searchAvailableSchedules, getScheduleSeats } from "../../api/schedule";
import { usersApi } from "../../api/users";
import { adminReservationApi } from "../../api/adminReservation";
import FormField, { inputCls as fieldCls } from "../../components/common/FormField";
import StationSelect from "../../components/common/StationSelect";
import DateField from "../../components/common/DateField";
import SeatLayout from "../../components/common/SeatLayout";
import { validators, filters, blockNumberKeys } from "../../utils/validators";
import { todayISO, addDaysISO, validateJourneyDate, MAX_ADVANCE_DAYS } from "../../utils/dateUtils";

const MAX_SEATS = 6;

// Backend Gender enum: male, female, other, prefer_not_to_say
const GENDERS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other" },
];

// Shared look (same as the Users / Roles / Bus Types pages)
const cardCls   = "bg-white rounded-2xl border border-gray-200 shadow-sm p-5";
const inputCls  =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const primaryBtn =
  "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold " +
  "transition-colors disabled:opacity-50";
const pickerBox = "relative border border-gray-200 rounded-xl px-3 py-2 bg-white";

export default function AdminStaffReservation() {
  useEffect(() => {
    document.title = "Staff Reservation | APSTS Admin Portal";
  }, []);

  // Journey
  const [stations, setStations] = useState([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [schedules, setSchedules] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Seats
  const [schedule, setSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selected, setSelected] = useState([]);   // seat objects
  const [details, setDetails] = useState({});     // seat.id -> {name, age, gender}
  const [detailErrors, setDetailErrors] = useState({});

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
      /* interceptor toasts */
    } finally {
      setFindingUser(false);
    }
  };

  // ── Journey search ───────────────────────────────────────────────────────
  const searchBuses = async () => {
    if (!fromId || !toId) return toast.error("Select both stations");
    if (fromId === toId) return toast.error("Pick two different stations");
    const dErr = validateJourneyDate(date);
    if (dErr) return toast.error(dErr);

    setSearching(true);
    setSchedule(null);
    setSeats([]);
    setSelected([]);
    setDetails({});
    setDetailErrors({});
    try {
      const r = await searchAvailableSchedules(Number(fromId), Number(toId), date);
      const d = r.data?.data ?? r.data ?? [];
      setSchedules(Array.isArray(d) ? d : []);
      setSearched(true);
    } catch {
      /* interceptor toasts */
    } finally {
      setSearching(false);
    }
  };

  const pickSchedule = async (s) => {
    setSchedule(s);
    setSelected([]);
    setDetails({});
    setDetailErrors({});
    setLoadingSeats(true);
    try {
      const r = await getScheduleSeats(s.scheduleId, s.fromStopSequence, s.toStopSequence);
      setSeats(Array.isArray(r.data) ? r.data : r.data?.data ?? []);
    } catch {
      /* interceptor toasts */
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

  const setDetail = (seatId, patch) => {
    setDetails((prev) => ({ ...prev, [seatId]: { ...(prev[seatId] ?? {}), ...patch } }));
    setDetailErrors((prev) => (prev[seatId] ? { ...prev, [seatId]: {} } : prev));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!schedule) return toast.error("Select a bus first");
    if (!selected.length) return toast.error("Select at least one seat");

    const errs = {};
    for (const seat of selected) {
      const d = details[seat.id] ?? {};
      const e = {
        name: validators.name(d.name, "Passenger name"),
        age: validators.age(d.age),
        gender: validators.gender(d.gender),
      };
      if (e.name || e.age || e.gender) errs[seat.id] = e;
    }
    setDetailErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please correct the highlighted passenger details");
    if (reason.trim().length < 5) return toast.error("Enter the reason for this reservation (min 5 characters)");

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
    } catch {
      /* interceptor shows the (now field-specific) validation message */
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
    setDetailErrors({});
    setReason("");
    setBeneficiary(null);
    setMatches([]);
    setQ("");
  };

  // ── Print / download the ticket (item 27) ────────────────────────────────
  const openTicket = async (download = false) => {
    try {
      const res = await adminReservationApi.ticket(result.bookingId ?? result.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${result.pnr}.pdf`;
        a.click();
      } else {
        window.open(url, "_blank");
      }
    } catch {
      toast.error("Could not load the ticket");
    }
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
            {" · "}Amount paid: <b>₹0.00</b>
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button onClick={() => openTicket(false)} className={primaryBtn}>🖨 Print ticket</button>
            <button
              onClick={() => openTicket(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ⬇ Download PDF
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              New reservation
            </button>
          </div>
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
        <p className="text-xs text-gray-600 mb-3">Leave empty to reserve in your own name.</p>

        {beneficiary ? (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-blue-800">
              <b>{beneficiary.phoneNumber}</b>
              {beneficiary.email ? ` · ${beneficiary.email}` : ""}
            </span>
            <button onClick={() => setBeneficiary(null)} className="text-xs font-semibold text-red-500 hover:text-red-700">
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
              <div className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden max-h-56 overflow-y-auto">
                {matches.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setBeneficiary(u); setMatches([]); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
          <FormField label="From station" required>
            <div className={pickerBox}>
              <StationSelect stations={stations} value={fromId} onChange={setFromId} exclude={toId} placeholder="From station" />
            </div>
          </FormField>
          <FormField label="To station" required>
            <div className={pickerBox}>
              <StationSelect stations={stations} value={toId} onChange={setToId} exclude={fromId} placeholder="To station" />
            </div>
          </FormField>
          <FormField label="Journey date" required>
            <div className={pickerBox}>
              <DateField value={date} onChange={setDate} min={todayISO()} max={addDaysISO(todayISO(), MAX_ADVANCE_DAYS)} />
            </div>
          </FormField>
          <button onClick={searchBuses} disabled={searching} className={`${primaryBtn} h-[42px]`}>
            {searching ? "Searching…" : "Search buses"}
          </button>
        </div>

        {searched && schedules.length === 0 && (
          <p className="text-sm text-gray-600 mt-4">No buses found for this route and date.</p>
        )}

        {schedules.length > 0 && (
          <div className="mt-4 space-y-2">
            {schedules.map((s) => (
              <button
                key={s.scheduleId}
                onClick={() => pickSchedule(s)}
                className={`w-full text-left border rounded-xl px-4 py-3 flex items-center justify-between transition-colors
                  ${schedule?.scheduleId === s.scheduleId
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"}`}
              >
                <div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {s.busRegistration}{s.busTypeName ? ` · ${s.busTypeName}` : ""}
                  </div>
                  <div className="text-xs text-gray-600">{s.routeName} · departs {s.boardingTime}</div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Fare waived
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. Seats — visual bus layout (item 23) */}
      {schedule && (
        <section className={cardCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">3. Pick seats</h2>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              {selected.length} / {MAX_SEATS}
            </span>
          </div>

          {loadingSeats ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <SeatLayout seats={seats} selectedIds={selected.map((s) => s.id)} onToggle={toggleSeat} />

              {selected.length > 0 && (
                <div className="space-y-3 mt-6">
                  {selected.map((seat) => {
                    const d = details[seat.id] ?? {};
                    const e = detailErrors[seat.id] ?? {};
                    return (
                      <div
                        key={seat.id}
                        className="grid grid-cols-1 sm:grid-cols-[4rem_1fr_7rem_10rem] gap-3 items-start border border-gray-100 rounded-xl p-3 bg-gray-50/60"
                      >
                        <div className="text-sm font-bold text-gray-800 pt-7">Seat {seat.seatLabel}</div>
                        <FormField label="Passenger name" required error={e.name}>
                          <input
                            value={d.name ?? ""}
                            maxLength={100}
                            onChange={(ev) => setDetail(seat.id, { name: filters.name(ev.target.value, 100) })}
                            className={fieldCls(e.name)}
                            placeholder="Full name"
                          />
                        </FormField>
                        <FormField label="Age" required error={e.age}>
                          <input
                            type="text" inputMode="numeric" maxLength={3}
                            value={d.age ?? ""}
                            onKeyDown={blockNumberKeys}
                            onChange={(ev) => setDetail(seat.id, { age: filters.digits(ev.target.value, 3) })}
                            className={fieldCls(e.age)}
                            placeholder="Age"
                          />
                        </FormField>
                        <FormField label="Gender" required error={e.gender}>
                          <select
                            value={d.gender ?? ""}
                            onChange={(ev) => setDetail(seat.id, { gender: ev.target.value })}
                            className={`${fieldCls(e.gender)} cursor-pointer`}
                          >
                            <option value="" disabled>Select</option>
                            {GENDERS.map((g) => (
                              <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                          </select>
                        </FormField>
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
        <FormField label="4. Reason (recorded in audit log)" required>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="e.g. Inspection team travel, official duty"
            className={inputCls}
          />
        </FormField>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">{reason.length}/500</span>
          <button
            onClick={submit}
            disabled={busy || !schedule || selected.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {busy ? "Reserving…" : "Confirm reservation — ₹0"}
          </button>
        </div>
      </section>
    </div>
  );
}
