import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import sideBg from "../../assets/side-bg.jpeg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { getScheduleSeats } from "../../api/schedule";
import { ProgressBar } from "./BusList";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/* ─── Seat Icon ─────────────────────────────────────────────────────────────── */

const TYPE_COLORS = {
  selected:  "#3b82f6",
  ladies:    "#a855f7",
  booked:    "#6b7280",
  locked:    "#f97316",
  available: "transparent",
};

function SeatIcon({ label, displayType, onClick }) {
  const fill   = TYPE_COLORS[displayType] ?? "transparent";
  const stroke = displayType === "available" ? "#94a3b8" : fill;
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center ${displayType === "booked" || displayType === "locked" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <svg width="34" height="34" viewBox="0 0 24 24">
        <rect x="6" y="2" width="12" height="5" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <rect x="4" y="7" width="16" height="13" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
      </svg>
      <span className="text-[10px] mt-1 text-white">{label}</span>
    </div>
  );
}

/* ─── Login Gate Modal ──────────────────────────────────────────────────────── */

function LoginGate({ onClose, onLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[420px] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 rounded-2xl border border-white/20 text-white text-center">
        <h2 className="text-xl font-semibold text-green-400 mb-3">Login Required</h2>
        <p className="text-gray-300 text-sm mb-6">
          You need to be logged in to book a seat. Please login or register to continue.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={onLogin}
            className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold"
          >
            Login / Register
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SeatSelection ─────────────────────────────────────────────────────────── */

function SeatSelection() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { user }      = useAuth();
  const ticketRef     = useRef();

  const scheduleId = searchParams.get("scheduleId");
  const fromLabel  = searchParams.get("from")      ?? "—";
  const toLabel    = searchParams.get("to")        ?? "—";
  const date       = searchParams.get("date")      ?? "";
  const busLabel   = searchParams.get("bus")       ?? "—";
  const departure  = searchParams.get("departure") ?? "";

  // UI state
  const [step, setStep]                   = useState(2);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]); // array of inventory seat objects
  const [passengerDetails, setPassengerDetails] = useState({}); // keyed by seat id
  const [contact, setContact]             = useState({ mobile: "", email: "" });

  // Seat inventory from backend
  const [seatMap, setSeatMap]   = useState([]);   // flat list of ScheduleSeatInventoryResponse
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatError, setSeatError]       = useState("");

  /* ── Fetch seat inventory ── */
  useEffect(() => {
    if (!scheduleId) { setSeatError("No schedule selected."); setLoadingSeats(false); return; }
    setLoadingSeats(true);
    getScheduleSeats(scheduleId)
      .then((res) => {
        // response is plain List (no ApiResponse wrapper per controller)
        const seats = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setSeatMap(seats);
      })
      .catch(() => setSeatError("Failed to load seat map. Please try again."))
      .finally(() => setLoadingSeats(false));
  }, [scheduleId]);

  /* ── Seat layout: group by row then col ── */
  const maxCol = seatMap.reduce((m, s) => Math.max(m, s.colNumber ?? 0), 0);
  const maxRow = seatMap.reduce((m, s) => Math.max(m, s.rowNumber ?? 0), 0);

  // Build 2D grid [row][col] → seat | null
  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol }, (_, ci) =>
      seatMap.find((s) => s.rowNumber === ri + 1 && s.colNumber === ci + 1) ?? null
    )
  );

  /* ── Determine display type for a seat ── */
  const getDisplayType = (seat) => {
    if (selectedSeats.find((s) => s.id === seat.id)) return "selected";
    if (seat.seatStatus === "booked" || seat.seatStatus === "BOOKED") return "booked";
    if (seat.seatStatus === "locked" || seat.seatStatus === "LOCKED" ||
        seat.seatStatus === "held"   || seat.seatStatus === "HELD")   return "locked";
    if (seat.isLadiesQuota) return "ladies";
    return "available";
  };

  /* ── Toggle seat selection ── */
  const handleSeatClick = (seat) => {
    const type = getDisplayType(seat);
    if (type === "booked" || type === "locked") return;

    // require login before selecting
    if (!user) { setShowLoginGate(true); return; }

    setSelectedSeats((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  /* ── Passenger detail helpers ── */
  const updatePassenger = (seatId, field, value) =>
    setPassengerDetails((prev) => ({
      ...prev,
      [seatId]: { ...prev[seatId], [field]: value },
    }));

  /* ── Validate step 2 → 3 ── */
  const handleProceedFromSeats = () => {
    if (selectedSeats.length === 0) return;
    for (const seat of selectedSeats) {
      const d = passengerDetails[seat.id] ?? {};
      if (!d.name?.trim() || !d.gender || !d.age) {
        alert(`Please fill in all passenger details for seat ${seat.seatLabel}`);
        return;
      }
    }
    setStep(3);
  };

  /* ── Validate step 3 → 4 ── */
  const handleProceedFromContact = () => {
    if (!contact.mobile || contact.mobile.length < 10) {
      alert("Enter a valid 10-digit mobile number"); return;
    }
    if (!contact.email?.includes("@")) {
      alert("Enter a valid email"); return;
    }
    setStep(4);
  };

  /* ── Download ticket PDF ── */
  const downloadTicket = async () => {
    const canvas  = await html2canvas(ticketRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf     = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 120);
    pdf.save("bus-ticket.pdf");
  };

  const farePerSeat = 780; // replace with sch.fare once passed via param
  const totalFare   = selectedSeats.length * farePerSeat;
  const progressWidth = ((step - 1) / 4) * 100;

  return (
    <div className="w-full text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-10 pb-4">

      {/* Progress Bar — step 2: Seat Selection */}
      <div className="mt-10">
        <ProgressBar currentStep={step} />
      </div>

      {/* Login Gate */}
      {showLoginGate && (
        <LoginGate
          onClose={() => setShowLoginGate(false)}
          onLogin={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
        />
      )}

      <div className="flex gap-6">

        {/* ── LEFT: Journey Info ── */}
        <div className="relative w-[260px] rounded-xl overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${sideBg})` }} />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 p-5">
            <h3 className="mb-4 font-semibold text-green-300">You are booking for</h3>
            <p className="text-sm text-gray-300">Source</p>
            <p className="font-semibold uppercase">{fromLabel}</p>
            <p className="mt-3 text-sm text-gray-300">Destination</p>
            <p className="font-semibold uppercase">{toLabel}</p>
            <p className="mt-3 text-sm text-gray-300">Service</p>
            <p className="font-semibold">{busLabel}</p>
            <p className="mt-3 text-sm text-gray-300">Journey Date</p>
            <p className="font-semibold">{formatDate(date)} {departure ? departure.substring(0, 5) : ""}</p>
            {selectedSeats.length > 0 && (
              <>
                <p className="mt-3 text-sm text-gray-300">Selected Seats</p>
                <p className="font-semibold text-green-300">
                  {selectedSeats.map((s) => s.seatLabel).join(", ")}
                </p>
                <p className="mt-3 text-sm text-gray-300">Total Fare</p>
                <p className="font-semibold text-orange-400">₹ {totalFare}</p>
              </>
            )}
          </div>
        </div>

        {/* ── MIDDLE: Seat Map ── */}
        <div className="flex justify-center w-[420px]">
          <div className="relative p-5 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl w-full">
            <div className="absolute text-xl text-yellow-400 top-2 right-3">🛞</div>

            {loadingSeats && (
              <div className="flex items-center justify-center py-10 text-gray-300">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading seats…
              </div>
            )}

            {!loadingSeats && seatError && (
              <p className="py-10 text-center text-red-300">{seatError}</p>
            )}

            {!loadingSeats && !seatError && (
              <>
                {/* Seat grid — aisle after col 2 (standard 2+2 layout) */}
                <div className="mt-6 space-y-3">
                  {grid.map((row, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      {row.map((seat, ci) => {
                        // insert aisle gap after column 2
                        const aisleAfter = Math.floor(maxCol / 2);
                        return (
                          <div key={ci} className="flex items-center gap-2">
                            {ci === aisleAfter && (
                              <div className="w-6" /> // aisle
                            )}
                            {seat ? (
                              <SeatIcon
                                label={seat.seatLabel}
                                displayType={getDisplayType(seat)}
                                onClick={() => handleSeatClick(seat)}
                              />
                            ) : (
                              <div className="w-[34px]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-between mt-6 gap-2 text-xs">
                  {[
                    { color: "bg-gray-500",   label: "Booked" },
                    { color: "bg-orange-500", label: "Locked" },
                    { color: "bg-blue-500",   label: "Selected" },
                    { color: "border border-white/40", label: "Available" },
                    { color: "bg-purple-500", label: "Ladies" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-4 h-4 rounded ${color}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Step Content ── */}
        <div className="flex-1 p-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">

          {/* STEP 2 — Passenger Details */}
          {step === 2 && (
            selectedSeats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <span className="text-4xl">💺</span>
                <p className="text-lg">Click on a seat to proceed</p>
                {!user && (
                  <p className="text-sm text-orange-300">
                    You must be logged in to select seats.{" "}
                    <span
                      className="underline cursor-pointer"
                      onClick={() => setShowLoginGate(true)}
                    >
                      Login here
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <>
                <h3 className="mb-3 font-semibold text-green-300">Passenger Details</h3>
                <table className="w-full text-sm border border-white/20">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="p-2 text-left">Seat</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Gender</th>
                      <th className="p-2 text-left">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSeats.map((seat) => (
                      <tr key={seat.id} className="border-t border-white/10">
                        <td className="p-2 font-semibold text-green-300">{seat.seatLabel}</td>
                        <td className="p-2">
                          <input
                            value={passengerDetails[seat.id]?.name ?? ""}
                            onChange={(e) => updatePassenger(seat.id, "name", e.target.value)}
                            placeholder="Full name"
                            className="w-full px-2 py-1 border rounded bg-white/10 border-white/20 outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={passengerDetails[seat.id]?.gender ?? ""}
                            onChange={(e) => updatePassenger(seat.id, "gender", e.target.value)}
                            className="w-full text-white border rounded bg-white/20 border-white/30"
                          >
                            <option value="" className="text-black bg-white">Select</option>
                            <option value="Male"   className="text-black bg-white">Male</option>
                            <option value="Female" className="text-black bg-white">Female</option>
                            <option value="Child"  className="text-black bg-white">Child</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={passengerDetails[seat.id]?.age ?? ""}
                            onChange={(e) => updatePassenger(seat.id, "age", e.target.value)}
                            placeholder="Age"
                            className="w-full px-2 py-1 border rounded bg-white/10 border-white/20 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end gap-4 mt-6">
                  <button onClick={() => setSelectedSeats([])} className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600">
                    Clear
                  </button>
                  <button onClick={handleProceedFromSeats} className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600">
                    Proceed →
                  </button>
                </div>
              </>
            )
          )}

          {/* STEP 3 — Contact Details */}
          {step === 3 && (
            <>
              <h3 className="mb-4 font-semibold text-green-300">Contact Details</h3>
              <p className="mb-4 text-sm text-gray-300">
                Enter mobile & email for ticket confirmation
              </p>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center border border-white/20 rounded-xl overflow-hidden">
                  <span className="px-3 py-2.5 bg-white/10 text-sm text-gray-300 border-r border-white/20">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit Mobile Number"
                    value={contact.mobile}
                    onChange={(e) => setContact((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "") }))}
                    className="w-full px-3 py-2.5 bg-transparent text-sm outline-none"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={contact.email}
                  onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                  className="px-3 py-2.5 border border-white/20 rounded-xl bg-white/10 text-sm outline-none"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setStep(2)} className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600">← Back</button>
                <button onClick={handleProceedFromContact} className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600">Proceed →</button>
              </div>
            </>
          )}

          {/* STEP 4 — Payment */}
          {step === 4 && (
            <>
              <h3 className="mb-4 font-semibold text-green-300">Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { key: "Card",        icon: "💳", label: "Card Payment" },
                  { key: "UPI",         icon: "📱", label: "UPI" },
                  { key: "Net Banking", icon: "🏦", label: "Net Banking" },
                ].map(({ key, icon, label }) => (
                  <div
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === key
                        ? "bg-green-500/30 border-green-400"
                        : "bg-white/10 border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {icon} {label}
                  </div>
                ))}
              </div>

              <div className="p-4 mb-4 rounded-lg bg-white/5 border border-white/10 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">Seats</span>
                  <span>{selectedSeats.map((s) => s.seatLabel).join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Fare</span>
                  <span className="text-green-400 font-semibold">₹ {totalFare}</span>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button onClick={() => setStep(3)} className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600">← Back</button>
                <button
                  onClick={() => {
                    if (!paymentMethod) { alert("Please select a payment method"); return; }
                    setStep(5);
                  }}
                  className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold"
                >
                  Pay ₹{totalFare}
                </button>
              </div>
            </>
          )}

          {/* STEP 5 — Ticket */}
          {step === 5 && (
            <div className="text-center">
              <p className="text-green-400 text-lg font-semibold mb-4">🎉 Booking Confirmed!</p>

              <div
                ref={ticketRef}
                className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white border border-white/20"
              >
                <div className="py-3 text-lg font-semibold text-center bg-green-500">
                  🎟 Bus Ticket
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Route</span>
                    <span className="uppercase">{fromLabel} → {toLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Service</span>
                    <span>{busLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Date</span>
                    <span>{formatDate(date)}</span>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-1">Passengers</p>
                    {selectedSeats.map((seat) => (
                      <div key={seat.id} className="flex justify-between mt-1">
                        <span>
                          {passengerDetails[seat.id]?.name ?? "N/A"}{" "}
                          ({passengerDetails[seat.id]?.gender ?? "—"}, {passengerDetails[seat.id]?.age ?? "—"} yrs)
                        </span>
                        <span className="text-green-300">Seat {seat.seatLabel}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Fare</span>
                    <span className="text-green-400 font-semibold">₹ {totalFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Payment</span>
                    <span>{paymentMethod}</span>
                  </div>
                  <div className="flex justify-center mt-4">
                    <QRCodeCanvas
                      value={`Seats:${selectedSeats.map((s) => s.seatLabel).join(",")}|Amount:₹${totalFare}|Route:${fromLabel}-${toLabel}`}
                      size={80}
                    />
                  </div>
                  <p className="text-center text-gray-300">Thank you for booking 🚍</p>
                </div>
              </div>

              <button
                onClick={downloadTicket}
                className="px-5 py-2 mt-6 bg-green-500 hover:bg-green-600 rounded-lg font-semibold"
              >
                Download Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeatSelection;
