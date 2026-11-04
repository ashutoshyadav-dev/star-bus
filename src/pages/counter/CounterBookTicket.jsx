import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { counterApi } from "../../api/counter";
import { stationApi } from "../../api/station";
import { searchAvailableSchedules, getScheduleSeats } from "../../api/schedule";
import { bookingApi, paymentApi } from "../../api/booking";
import api from "../../api/client";
import Spinner from "../../components/common/Spinner";
import FormField, { inputCls } from "../../components/common/FormField";
import StationSelect from "../../components/common/StationSelect";
import DateField from "../../components/common/DateField";
import SeatLayout from "../../components/common/SeatLayout";
import useSeatHold from "../../hooks/useSeatHold";
import { validators, filters, blockNumberKeys, validateAll } from "../../utils/validators";
import { todayISO, addDaysISO, validateJourneyDate, MAX_ADVANCE_DAYS, isoToDMY } from "../../utils/dateUtils";
import { formatINR } from "../../utils/money";

const GENDERS = [["male", "Male"], ["female", "Female"], ["other", "Other"]];
const MAX_SEATS = 6;

export default function CounterBookTicket() {
  const [step, setStep] = useState(1); // 1 passenger · 2 search · 3 seats · 4 payment · 5 done

  // ── Step 1: passenger ────────────────────────────────────────────────
  const [phoneDigits, setPhoneDigits] = useState("");
  const [passenger, setPassenger] = useState(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [resolving, setResolving] = useState(false);
  const lookupSeq = useRef(0);                         // ignore answers of an older number
  const phone = `+91${phoneDigits}`;

  const onPhoneChange = (raw) => {
    const d = filters.digits(raw, 10);
    setPhoneDigits(d);
    setPassenger(null);                                // ← previous customer is cleared immediately
    setNeedsRegistration(false); setNewName(""); setNameError("");
    setPhoneError(d.length === 10 ? validators.mobile(d) : "");
  };

  const handleLookup = async () => {
    const err = validators.mobile(phoneDigits);
    setPhoneError(err);
    if (err) return;
    const seq = ++lookupSeq.current;
    setResolving(true); setNeedsRegistration(false); setPassenger(null);
    try {
      const res = await counterApi.lookupPassenger(phone);
      if (seq !== lookupSeq.current) return;           // user already typed another number
      setPassenger(res.data?.data ?? res.data);
    } catch (e) {
      if (seq !== lookupSeq.current) return;
      if (e?.response?.status === 404) setNeedsRegistration(true);
    } finally { if (seq === lookupSeq.current) setResolving(false); }
  };
  useEffect(() => { if (phoneDigits.length === 10 && !validators.mobile(phoneDigits)) handleLookup(); }, [phoneDigits]); // auto-fetch for the NEW number

  const handleQuickRegister = async () => {
    const err = validators.name(newName, "Passenger name");
    setNameError(err);
    if (err) return;
    setResolving(true);
    try {
      const res = await counterApi.quickRegisterPassenger({ phoneNumber: phone, fullName: newName.trim() });
      setPassenger(res.data?.data ?? res.data); setNeedsRegistration(false);
      toast.success("Passenger registered");
    } catch { /* interceptor toasts */ } finally { setResolving(false); }
  };

  // ── Step 2: search ───────────────────────────────────────────────────
  const [stations, setStations] = useState([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [searchErr, setSearchErr] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => { stationApi.getActiveStations().then((r) => setStations(r.data?.data ?? r.data ?? [])).catch(() => toast.error("Failed to load stations")); }, []);

  const handleSearch = async () => {
    const e = !fromId || !toId ? "Select both stations" : fromId === toId ? "Pick two different stations" : validateJourneyDate(date);
    setSearchErr(e);
    if (e) return;
    setSearching(true);
    try {
      const res = await searchAvailableSchedules(Number(fromId), Number(toId), date);
      const data = res.data?.data ?? res.data ?? [];
      setSchedules(Array.isArray(data) ? data : []);
      if (data.length === 0) toast("No buses found for this route/date", { icon: "ℹ️" });
    } catch { /* interceptor toasts */ } finally { setSearching(false); }
  };

  // ── Step 3: seats (server hold) ──────────────────────────────────────
  const [sch, setSch] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selected, setSelected] = useState([]);
  const [details, setDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);

  const fetchSeats = useCallback(() => {
    if (!sch) return;
    getScheduleSeats(sch.scheduleId, sch.fromStopSequence, sch.toStopSequence)
      .then((res) => setSeatMap(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => {});
  }, [sch]);
  const hold = useSeatHold({ scheduleId: sch?.scheduleId, fromId, toId, fetchSeats, enabled: step === 3 });

  const pickSchedule = async (s) => {
    await hold.release();
    setSch(s); setSelected([]); setDetails({}); setErrors({}); setLoadingSeats(true);
    try {
      const res = await getScheduleSeats(s.scheduleId, s.fromStopSequence, s.toStopSequence);
      setSeatMap(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      setStep(3);
    } catch { /* interceptor toasts */ } finally { setLoadingSeats(false); }
  };

  const toggleSeat = async (seat) => {
    const exists = selected.some((s) => s.id === seat.id);
    if (!exists && selected.length >= MAX_SEATS) return toast.error(`Maximum ${MAX_SEATS} passengers per booking`, { id: "max" });
    const prev = selected, next = exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat];
    setSelected(next);
    const r = await hold.sync(next.map((s) => s.seatId ?? s.id));
    if (!r.ok) { setSelected(prev); toast.error(r.conflict ? `Seat ${seat.seatLabel} was just taken.` : r.error, { id: "hold" }); }
  };
  // drop seats another counter/passenger took
  useEffect(() => {
    if (step !== 3 || !selected.length) return;
    const gone = selected.filter((s) => { const c = seatMap.find((m) => m.id === s.id); return !c || c.seatStatus === "booked" || (c.seatStatus === "locked" && !c.heldByMe); });
    if (gone.length) { setSelected((p) => p.filter((s) => !gone.includes(s))); toast.error("A selected seat is no longer available."); }
  }, [seatMap]);   // eslint-disable-line react-hooks/exhaustive-deps

  const setDetail = (id, k, v) => setDetails((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  useEffect(() => {                                    // live fare preview
    if (step !== 3 || !selected.length) { setQuote(null); return; }
    const t = setTimeout(() => {
      bookingApi.quote({ scheduleId: sch.scheduleId, fromStationId: Number(fromId), toStationId: Number(toId), bookingSource: "UTC_COUNTER",
        passengers: selected.map((s) => ({ seatId: s.seatId ?? s.id, passengerName: "Passenger", passengerAge: 30, passengerGender: "male", concessionType: "NONE" })) })
        .then((r) => setQuote(r.data?.data ?? r.data)).catch(() => setQuote(null));
    }, 250);
    return () => clearTimeout(t);
  }, [selected, step]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create booking ───────────────────────────────────────────────────
  const [booking, setBooking] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreateBooking = async () => {
    if (!selected.length) return toast.error("Select at least one seat");
    const errs = {};
    selected.forEach((s) => {
      const d = details[s.id] ?? {};
      const e = { name: validators.name(d.name, "Passenger name"), age: validators.age(d.age), gender: validators.gender(d.gender) };
      if (e.name || e.age || e.gender) errs[s.id] = e;
    });
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please correct the highlighted fields");

    setCreating(true);
    try {
      const res = await counterApi.createBooking({
        passengerUserId: passenger.userId, scheduleId: sch.scheduleId,
        fromStationId: Number(fromId), toStationId: Number(toId), holdId: hold.holdId,
        passengers: selected.map((s) => ({ passengerName: details[s.id].name.trim(), passengerAge: Number(details[s.id].age),
          passengerGender: details[s.id].gender, seatId: s.seatId ?? s.id, concessionType: "NONE" })),
      });
      setBooking(res.data?.data ?? res.data);
      hold.setHoldId(null);
      toast.success("Booking created — collect payment to confirm");
      setStep(4);
    } catch (e) { fetchSeats(); } finally { setCreating(false); }
  };

  // ── Payment ──────────────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState("CASH_COUNTER");
  const [collecting, setCollecting] = useState(false);
  const [gatewayWindow, setGatewayWindow] = useState(null);
  const [polling, setPolling] = useState(false);
  const pollTimerRef = useRef(null);
  const pollDeadlineRef = useRef(null);
  const bid = () => booking.bookingId ?? booking.id;

  const stopPolling = () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); pollTimerRef.current = null; setPolling(false); };
  useEffect(() => stopPolling, []);

  const handleCollectCash = async () => {
    setCollecting(true);
    try { await counterApi.collectPayment({ bookingId: bid(), paymentMethod: "CASH_COUNTER" }); toast.success("Cash recorded — ticket confirmed!"); setStep(5); }
    catch { /* interceptor toasts */ } finally { setCollecting(false); }
  };

  const handleStartOnlinePayment = async () => {
    setCollecting(true);
    try {
      const res = await paymentApi.initiate({ bookingId: bid(), paymentMethod: "PHONEPE" });
      const url = (res.data?.data ?? res.data).transactionUrl;
      if (!url) return toast.error("Gateway did not return a checkout link");
      const win = window.open(url, "phonepe_checkout", "width=480,height=720");
      setGatewayWindow(win); setPolling(true);
      pollDeadlineRef.current = Date.now() + 6 * 60 * 1000;
      pollTimerRef.current = setInterval(async () => {
        if (Date.now() > pollDeadlineRef.current) { stopPolling(); return toast.error("Payment timed out — retry or take cash"); }
        try {
          const p = (await paymentApi.getByBookingId(bid())).data;
          const st = (p?.data ?? p)?.paymentStatus;
          if (st === "SUCCESS") { stopPolling(); win?.close?.(); toast.success("Payment confirmed — ticket confirmed!"); setStep(5); }
          else if (st === "FAILED") { stopPolling(); toast.error("Payment failed — retry or take cash"); }
        } catch { /* keep polling */ }
      }, 3000);
    } catch { /* interceptor toasts */ } finally { setCollecting(false); }
  };

  const openTicket = async () => {
    try {
      const res = await api.get(`/counter/bookings/${bid()}/ticket`, { responseType: "blob" });
      window.open(URL.createObjectURL(new Blob([res.data], { type: "application/pdf" })), "_blank");
    } catch { toast.error("Failed to load ticket"); }
  };

  const resetAll = () => {
    stopPolling(); hold.release();
    setStep(1); setPhoneDigits(""); setPassenger(null); setNeedsRegistration(false); setNewName("");   // ← was setPhone("") → crash
    setFromId(""); setToId(""); setDate(todayISO()); setSchedules([]); setSch(null);
    setSeatMap([]); setSelected([]); setDetails({}); setBooking(null); setPayMethod("CASH_COUNTER"); setGatewayWindow(null);
  };

  const card = "bg-white rounded-xl border border-gray-200 p-6";

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Counter — New Booking</h1>

      {step === 1 && (
        <div className={`${card} max-w-md`}>
          <h2 className="font-semibold text-gray-800 mb-4">1. Passenger</h2>
          <FormField label="Mobile number" required error={phoneError}>
            <div className="flex gap-2">
              <div className="flex flex-1">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-700 select-none">+91</span>
                <input type="tel" inputMode="numeric" maxLength={10} value={phoneDigits} onChange={(e) => onPhoneChange(e.target.value)}
                       placeholder="10-digit mobile number" className={`${inputCls(phoneError)} rounded-l-none`} />
              </div>
              <button onClick={handleLookup} disabled={resolving} className="bg-blue-600 text-white rounded-xl px-4 font-semibold hover:bg-blue-700 disabled:opacity-50">{resolving ? "…" : "Find"}</button>
            </div>
          </FormField>

          {needsRegistration && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-2">No account for this number — register the passenger:</p>
              <FormField label="Full name" required error={nameError}>
                <input className={inputCls(nameError)} placeholder="Full name" value={newName} maxLength={100}
                       onChange={(e) => { setNewName(filters.name(e.target.value, 100)); setNameError(""); }} />
              </FormField>
              <button onClick={handleQuickRegister} disabled={resolving} className="mt-3 w-full bg-green-600 text-white rounded-xl py-2 font-semibold hover:bg-green-700 disabled:opacity-50">Register & Continue</button>
            </div>
          )}

          {passenger && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm mb-3">
                {passenger.fullName || "Unnamed"} · {passenger.phoneNumber}{passenger.newlyCreated && " (new)"}
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white rounded-xl py-2 font-semibold hover:bg-blue-700">Continue to Journey Search</button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className={card}>
          <h2 className="font-semibold text-gray-800 mb-4">2. Search Buses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2 items-end">
            <FormField label="From station" required>
              <div className="border border-gray-300 rounded-xl px-3 py-2 relative"><StationSelect stations={stations} value={fromId} onChange={setFromId} exclude={toId} placeholder="From station" /></div>
            </FormField>
            <FormField label="To station" required>
              <div className="border border-gray-300 rounded-xl px-3 py-2 relative"><StationSelect stations={stations} value={toId} onChange={setToId} exclude={fromId} placeholder="To station" /></div>
            </FormField>
            <FormField label="Journey date" required>
              <div className="border border-gray-300 rounded-xl px-3 py-2 relative">
                <DateField value={date} onChange={setDate} min={todayISO()} max={addDaysISO(todayISO(), MAX_ADVANCE_DAYS)} />
              </div>
            </FormField>
            <button onClick={handleSearch} disabled={searching} className="bg-blue-600 text-white rounded-xl py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50">{searching ? "Searching…" : "Search"}</button>
          </div>
          {searchErr && <p className="text-xs text-red-500 mb-3">{searchErr}</p>}
          <div className="space-y-3 mt-3">
            {schedules.map((s) => (
              <div key={s.scheduleId} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{s.busRegistration} {s.busTypeName ? `· ${s.busTypeName}` : ""}</div>
                  <div className="text-sm text-gray-500">{s.routeName} · {isoToDMY(s.journeyDate)} · departs {s.boardingTime}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold text-gray-800">{formatINR(s.fare)}</div>
                  <button onClick={() => pickSchedule(s)} disabled={!s.isBookingOpen}
                          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {s.isBookingOpen ? "Select" : "Closed"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:underline">← Change passenger</button>
        </div>
      )}

      {step === 3 && (
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">3. Pick Seats</h2>
            {hold.expiresAt && <HoldTimer expiresAt={hold.expiresAt} skewMs={hold.skewMs}
              onExpired={() => { hold.release(); setSelected([]); toast.error("Seat hold expired — select seats again"); fetchSeats(); }} />}
          </div>
          {loadingSeats ? <div className="p-10 flex justify-center"><Spinner /></div> : (
            <>
              <SeatLayout seats={seatMap} selectedIds={selected.map((s) => s.id)} onToggle={toggleSeat} />
              {selected.length > 0 && (
                <div className="space-y-4 border-t pt-4 mt-6">
                  {selected.map((seat) => {
                    const d = details[seat.id] ?? {}, e = errors[seat.id] ?? {};
                    return (
                      <div key={seat.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                        <div className="text-sm font-semibold text-gray-600 pt-7">Seat {seat.seatLabel}</div>
                        <FormField label="Passenger name" required error={e.name}>
                          <input className={inputCls(e.name)} maxLength={100} value={d.name ?? ""} placeholder="Full name"
                                 onChange={(ev) => setDetail(seat.id, "name", filters.name(ev.target.value))} />
                        </FormField>
                        <FormField label="Age" required error={e.age}>
                          <input className={inputCls(e.age)} type="text" inputMode="numeric" maxLength={3} value={d.age ?? ""} placeholder="Age"
                                 onKeyDown={blockNumberKeys} onChange={(ev) => setDetail(seat.id, "age", filters.digits(ev.target.value, 3))} />
                        </FormField>
                        <FormField label="Gender" required error={e.gender}>
                          <select className={inputCls(e.gender)} value={d.gender ?? ""} onChange={(ev) => setDetail(seat.id, "gender", ev.target.value)}>
                            <option value="" disabled>Select</option>{GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </FormField>
                      </div>
                    );
                  })}
                  {quote && <FareBox q={quote} />}
                  <button onClick={handleCreateBooking} disabled={creating || hold.busy}
                          className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">
                    {creating ? "Creating…" : `Create Booking (${selected.length} seat${selected.length > 1 ? "s" : ""})`}
                  </button>
                </div>
              )}
            </>
          )}
          <button onClick={async () => { await hold.release(); setSelected([]); setStep(2); }} className="mt-4 text-sm text-gray-500 hover:underline">← Back to buses</button>
        </div>
      )}

      {step === 4 && booking && (
        <div className={`${card} max-w-md`}>
          <h2 className="font-semibold text-gray-800 mb-1">4. Collect Payment</h2>
          <p className="text-sm text-gray-500 mb-4">PNR {booking.pnr} · Amount due <span className="font-bold text-gray-800">{formatINR(booking.totalAmountPaid)}</span></p>
          <FareBox q={booking} />
          {!polling && (
            <div className="flex gap-2 mb-4">
              {[["CASH_COUNTER", "Cash"], ["PHONEPE", "UPI / Card"]].map(([k, l]) => (
                <button key={k} onClick={() => setPayMethod(k)} className={`flex-1 rounded-lg py-2 font-semibold border ${payMethod === k ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}>{l}</button>
              ))}
            </div>
          )}
          {polling ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">Waiting for the passenger to complete payment…</p>
              <button onClick={() => { stopPolling(); gatewayWindow?.close?.(); }} className="w-full bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-semibold hover:bg-gray-200">Cancel</button>
            </div>
          ) : payMethod === "CASH_COUNTER" ? (
            <button onClick={handleCollectCash} disabled={collecting} className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">{collecting ? "Recording…" : "Confirm Cash Received"}</button>
          ) : (
            <button onClick={handleStartOnlinePayment} disabled={collecting} className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">{collecting ? "Opening PhonePe…" : "Open PhonePe Checkout (QR / UPI / Card)"}</button>
          )}
        </div>
      )}

      {step === 5 && booking && (
        <div className={`${card} max-w-md text-center p-8`}>
          <div className="text-green-600 text-4xl mb-3">✓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Ticket Confirmed</h2>
          <p className="text-gray-500 mb-6">PNR <span className="font-bold text-gray-800">{booking.pnr}</span></p>
          <div className="flex gap-2">
            <button onClick={openTicket} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 font-semibold hover:bg-gray-200">Print Ticket</button>
            <button onClick={resetAll} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700">Book Another Ticket</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FareBox({ q }) {
  const n = (v) => Number(v ?? 0);
  const rows = [["Base fare", n(q.baseFareTotal)], ["Concession discount", -n(q.concessionTotal ?? q.concessionDiscountTotal)],
    ["Reservation fee", n(q.reservationFeeTotal)], ["Convenience fee", n(q.convenienceFee)], ["GST", n(q.gst ?? q.gstAmount)], ["Wallet discount", -n(q.walletDiscount)]]
    .filter(([, v]) => v !== 0);
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-1 mb-4">
      {rows.map(([l, v]) => <div key={l} className="flex justify-between text-gray-600"><span>{l}</span><span>{v < 0 ? "- " : ""}{formatINR(Math.abs(v))}</span></div>)}
      <div className="flex justify-between font-semibold text-gray-900 border-t pt-1"><span>Total</span><span>{formatINR(q.total ?? q.totalAmountPaid)}</span></div>
    </div>
  );
}

function HoldTimer({ expiresAt, skewMs, onExpired }) {
  const [left, setLeft] = useState(null);
  const fired = useRef(false);
  useEffect(() => {
    fired.current = false;
    const tick = () => { const ms = new Date(expiresAt).getTime() - (Date.now() + skewMs); setLeft(Math.max(0, ms)); if (ms <= 0 && !fired.current) { fired.current = true; onExpired(); } };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [expiresAt, skewMs]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (left === null) return null;
  return <span className={`text-sm font-mono px-2 py-1 rounded ${left < 60000 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
    ⏱ {String(Math.floor(left / 60000)).padStart(2, "0")}:{String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}</span>;
}