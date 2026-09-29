import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { counterApi } from "../../api/counter";
import { stationApi } from "../../api/station";
import { searchAvailableSchedules, getScheduleSeats, lockSeatForJourney } from "../../api/schedule";
import Spinner from "../../components/common/Spinner";

const SEAT_LOCK_MINUTES = 10;
const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

export default function CounterBookTicket() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=passenger 2=search 3=seats 4=payment 5=done

  // ── Step 1: passenger ──────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [passenger, setPassenger] = useState(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [newName, setNewName] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleLookup = async () => {
    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter phone as +91XXXXXXXXXX");
      return;
    }
    setResolving(true);
    setNeedsRegistration(false);
    try {
      const res = await counterApi.lookupPassenger(phone);
      setPassenger(res.data?.data ?? res.data);
      toast.success("Passenger found");
    } catch (err) {
      if (err?.response?.status === 404) {
        setNeedsRegistration(true);
      } else {
        toast.error(err?.response?.data?.message ?? "Lookup failed");
      }
    } finally {
      setResolving(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!newName.trim()) {
      toast.error("Enter the passenger's name");
      return;
    }
    setResolving(true);
    try {
      const res = await counterApi.quickRegisterPassenger({ phoneNumber: phone, fullName: newName.trim() });
      setPassenger(res.data?.data ?? res.data);
      setNeedsRegistration(false);
      toast.success("Passenger registered");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setResolving(false);
    }
  };

  // ── Step 2: journey search ───────────────────────────────────────────────
  const [stations, setStations] = useState([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedules, setSchedules] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    stationApi.getActiveStations()
      .then((res) => setStations(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load stations"));
  }, []);

  const handleSearchSchedules = async () => {
    if (!fromId || !toId || fromId === toId) {
      toast.error("Pick two different stations");
      return;
    }
    setSearching(true);
    try {
      const res = await searchAvailableSchedules(Number(fromId), Number(toId), date);
      const data = res.data?.data ?? res.data ?? [];
      setSchedules(Array.isArray(data) ? data : []);
      if (data.length === 0) toast("No buses found for this route/date", { icon: "ℹ️" });
    } catch {
      toast.error("Failed to search buses");
    } finally {
      setSearching(false);
    }
  };

  // ── Step 3: seat map + passenger details ─────────────────────────────────
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatDetails, setSeatDetails] = useState({});

  const pickSchedule = async (sch) => {
    setSelectedSchedule(sch);
    setSelectedSeats([]);
    setSeatDetails({});
    setLoadingSeats(true);
    try {
      const res = await getScheduleSeats(sch.scheduleId, sch.fromStopSequence, sch.toStopSequence);
      const seats = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setSeatMap(seats);
      setStep(3);
    } catch {
      toast.error("Failed to load seat map");
    } finally {
      setLoadingSeats(false);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.seatStatus !== "available") return;
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) {
        setSeatDetails((d) => { const n = { ...d }; delete n[seat.id]; return n; });
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= 6) {
        toast.error("Maximum 6 passengers per booking");
        return prev;
      }
      return [...prev, seat];
    });
  };

  const updateSeatDetail = (seatRowId, field, value) => {
    setSeatDetails((prev) => ({
      ...prev,
      [seatRowId]: { ...prev[seatRowId], [field]: value },
    }));
  };

  // ── Step 4: create booking + lock seats ──────────────────────────────────
  const [booking, setBooking] = useState(null);
  const [creatingBooking, setCreatingBooking] = useState(false);

  const handleCreateBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }
    for (const seat of selectedSeats) {
      const d = seatDetails[seat.id];
      if (!d?.name || !d?.age || !d?.gender) {
        toast.error(`Fill in name/age/gender for seat ${seat.seatLabel}`);
        return;
      }
    }

    setCreatingBooking(true);
    try {
      const passengers = selectedSeats.map((seat) => {
        const d = seatDetails[seat.id];
        return {
          passengerName: d.name,
          passengerAge: Number(d.age),
          passengerGender: d.gender,
          seatId: seat.seatId ?? seat.id,
          concessionType: "NONE",
        };
      });

      const res = await counterApi.createBooking({
        passengerUserId: passenger.userId,
        scheduleId: selectedSchedule.scheduleId,
        fromStationId: Number(fromId),
        toStationId: Number(toId),
        passengers,
      });
      const created = res.data?.data ?? res.data;
      setBooking(created);

      const lockExpiry = new Date(Date.now() + SEAT_LOCK_MINUTES * 60 * 1000).toISOString();
      await Promise.allSettled(
        selectedSeats.map((seat) =>
          lockSeatForJourney(
            seat.seatId ?? seat.id,
            selectedSchedule.scheduleId,
            created.bookingId ?? created.id,
            selectedSchedule.fromStopSequence,
            selectedSchedule.toStopSequence,
            lockExpiry,
          ),
        ),
      );

      toast.success("Booking created — collect payment to confirm");
      setStep(4);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to create booking");
    } finally {
      setCreatingBooking(false);
    }
  };

  // ── Step 5: collect payment ───────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState("CASH_COUNTER");
  const [upiRef, setUpiRef] = useState("");
  const [collecting, setCollecting] = useState(false);

  const handleCollectPayment = async () => {
    if (payMethod === "UPI_COUNTER" && !upiRef.trim()) {
      toast.error("Enter the UPI transaction reference");
      return;
    }
    setCollecting(true);
    try {
      await counterApi.collectPayment({
        bookingId: booking.bookingId ?? booking.id,
        paymentMethod: payMethod,
        upiTransactionId: payMethod === "UPI_COUNTER" ? upiRef.trim() : undefined,
      });
      toast.success("Payment recorded — ticket confirmed!");
      setStep(5);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to record payment");
    } finally {
      setCollecting(false);
    }
  };

  const resetAll = () => {
    setStep(1); setPhone(""); setPassenger(null); setNeedsRegistration(false); setNewName("");
    setFromId(""); setToId(""); setSchedules([]); setSelectedSchedule(null);
    setSeatMap([]); setSelectedSeats([]); setSeatDetails({}); setBooking(null);
    setPayMethod("CASH_COUNTER"); setUpiRef("");
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Counter — New Booking</h1>

      {/* STEP 1 — Passenger */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <h2 className="font-semibold text-gray-800 mb-4">1. Passenger</h2>
          <label className="text-sm text-gray-600">Phone number</label>
          <div className="flex gap-2 mt-1 mb-4">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={handleLookup} disabled={resolving}
                    className="bg-blue-600 text-white rounded-lg px-4 font-semibold hover:bg-blue-700 disabled:opacity-50">
              {resolving ? "…" : "Find"}
            </button>
          </div>

          {needsRegistration && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">No account for this number — register the passenger:</p>
              <input
                className="w-full border rounded-lg px-3 py-2 mb-3"
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button onClick={handleQuickRegister} disabled={resolving}
                      className="w-full bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 disabled:opacity-50">
                Register & Continue
              </button>
            </div>
          )}

          {passenger && (
            <div className="border-t pt-4">
              <div className="bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm mb-3">
                {passenger.fullName || "Unnamed"} · {passenger.phoneNumber}
                {passenger.newlyCreated && " (new)"}
              </div>
              <button onClick={() => setStep(2)}
                      className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700">
                Continue to Journey Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Journey search */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">2. Search Buses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <select className="border rounded-lg px-3 py-2" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">From station</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">To station</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" className="border rounded-lg px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
            <button onClick={handleSearchSchedules} disabled={searching}
                    className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 disabled:opacity-50">
              {searching ? "Searching…" : "Search"}
            </button>
          </div>

          <div className="space-y-3">
            {schedules.map((sch) => (
              <div key={sch.scheduleId} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{sch.busRegistration} {sch.busTypeName ? `· ${sch.busTypeName}` : ""}</div>
                  <div className="text-sm text-gray-500">{sch.routeName} · departs {sch.boardingTime}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold text-gray-800">₹{sch.fare}</div>
                  <button onClick={() => pickSchedule(sch)}
                          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700">
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 — Seats + passenger details */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">3. Pick Seats</h2>
          {loadingSeats ? (
            <div className="p-10 flex justify-center"><Spinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-6">
                {seatMap.map((seat) => {
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);
                  const isTaken = seat.seatStatus !== "available";
                  return (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat)}
                      disabled={isTaken}
                      className={`rounded-lg py-2 text-sm font-semibold border ${
                        isTaken ? "bg-gray-100 text-gray-300 cursor-not-allowed" :
                        isSelected ? "bg-blue-600 text-white border-blue-600" :
                        "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {seat.seatLabel}
                    </button>
                  );
                })}
              </div>

              {selectedSeats.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="text-sm font-semibold text-gray-600 self-center">Seat {seat.seatLabel}</div>
                      <input
                        className="border rounded-lg px-3 py-2"
                        placeholder="Passenger name"
                        onChange={(e) => updateSeatDetail(seat.id, "name", e.target.value)}
                      />
                      <input
                        type="number"
                        className="border rounded-lg px-3 py-2"
                        placeholder="Age"
                        onChange={(e) => updateSeatDetail(seat.id, "age", e.target.value)}
                      />
                      <select
                        className="border rounded-lg px-3 py-2 sm:col-start-2"
                        defaultValue=""
                        onChange={(e) => updateSeatDetail(seat.id, "gender", e.target.value)}
                      >
                        <option value="" disabled>Gender</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  ))}
                  <button onClick={handleCreateBooking} disabled={creatingBooking}
                          className="w-full bg-green-600 text-white rounded-lg py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">
                    {creatingBooking ? "Creating…" : `Create Booking (${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 4 — Payment collection */}
      {step === 4 && booking && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <h2 className="font-semibold text-gray-800 mb-1">4. Collect Payment</h2>
          <p className="text-sm text-gray-500 mb-4">PNR {booking.pnr} · Amount due <span className="font-bold text-gray-800">₹{booking.totalAmountPaid}</span></p>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setPayMethod("CASH_COUNTER")}
                    className={`flex-1 rounded-lg py-2 font-semibold border ${payMethod === "CASH_COUNTER" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}>
              Cash
            </button>
            <button onClick={() => setPayMethod("UPI_COUNTER")}
                    className={`flex-1 rounded-lg py-2 font-semibold border ${payMethod === "UPI_COUNTER" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}>
              UPI
            </button>
          </div>

          {payMethod === "UPI_COUNTER" && (
            <input
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="UPI transaction reference (from passenger's payment app)"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
            />
          )}

          <button onClick={handleCollectPayment} disabled={collecting}
                  className="w-full bg-green-600 text-white rounded-lg py-2.5 font-semibold hover:bg-green-700 disabled:opacity-50">
            {collecting ? "Recording…" : `Confirm ${payMethod === "CASH_COUNTER" ? "Cash" : "UPI"} Payment Received`}
          </button>
        </div>
      )}

      {/* STEP 5 — Done */}
      {step === 5 && booking && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="text-green-600 text-4xl mb-3">✓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Ticket Confirmed</h2>
          <p className="text-gray-500 mb-6">PNR <span className="font-bold text-gray-800">{booking.pnr}</span></p>
          <button onClick={resetAll} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700">
            Book Another Ticket
          </button>
        </div>
      )}
    </div>
  );
}