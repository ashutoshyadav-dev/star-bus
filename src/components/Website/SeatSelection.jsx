// =============================================================================
// SeatSelection.jsx
// Public route (/home/seat-selection) — accessible from both home page and
// the logged-in dashboard. Auth state is handled inline:
//   • Guest  → sees Login button in navbar + LoginGateModal on seat click
//   • Logged-in passenger → sees name + logout button in navbar
//
// PAYMENT FLOW (SBI ePay 2.0):
//   Unlike Razorpay, SBI ePay has no in-page checkout modal. Paying means the
//   whole browser navigates AWAY to a bank-hosted page, then gets redirected
//   BACK by our own backend (GET /payments/callback) to this same route with
//   `?bookingId=...&paymentStatus=success|failed` appended.
//   Because the page fully reloads, all React state is lost in between — so
//   right before redirecting we snapshot booking/seats/contact into
//   sessionStorage, and restore it on mount if we detect a returning payment.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams }              from "react-router-dom";
import { useAuth }                                   from "../../context/AuthContext";
import toast                                         from "react-hot-toast";
import { QRCodeCanvas }                              from "qrcode.react";
import jsPDF                                         from "jspdf";
import html2canvas                                   from "html2canvas";

import sideBg                                        from "../../assets/side-bg.jpeg";
import logo                                          from "../../assets/logo.png";

import { getScheduleSeats, lockSeatForJourney, getScheduleById } from "../../api/schedule";
import api                                           from "../../api/client";
import { bookingApi, paymentApi }                    from "../../api/booking";
import { ProgressBar }                               from "./BusList";

import { FiUser, FiLogOut } from "react-icons/fi";

// =============================================================================
// CONSTANTS
// =============================================================================

const SEAT_LOCK_MINUTES = 10;

// This build always runs in a browser — the backend needs this to know
// which client to redirect back to after SBI ePay's hosted payment page.
const PAYMENT_SOURCE = "WEB";

// sessionStorage key prefix used to snapshot page state before redirecting
// the browser away to SBI ePay's hosted payment page, and to restore it when
// the bank redirects back. NOTE: no gateway key/method-map constants are
// needed anymore — SBI ePay needs no client-side SDK or public key at all.
const PAYMENT_SESSION_PREFIX = "apsts_pending_payment_";

// Seat fill colours for the seat map legend and SVG rendering
const SEAT_COLORS = {
  selected:  "#3b82f6",
  ladies:    "#a855f7",
  booked:    "#6b7280",
  locked:    "#f97316",
  hold:      "#f97316",
  available: "white",
};

// =============================================================================
// PURE HELPERS
// =============================================================================

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hour   = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

/* ── Session snapshot helpers ──
   Used to survive the full-page redirect to/from SBI ePay's hosted page. ── */
function savePaymentSession(bookingId, snapshot) {
  try {
    sessionStorage.setItem(
      PAYMENT_SESSION_PREFIX + bookingId,
      JSON.stringify(snapshot)
    );
  } catch (e) {
    console.error("Failed to save payment session snapshot", e);
  }
}

function loadPaymentSession(bookingId) {
  try {
    const raw = sessionStorage.getItem(PAYMENT_SESSION_PREFIX + bookingId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to read payment session snapshot", e);
    return null;
  }
}

function clearPaymentSession(bookingId) {
  sessionStorage.removeItem(PAYMENT_SESSION_PREFIX + bookingId);
}

// =============================================================================
// SMALL SHARED UI COMPONENTS
// =============================================================================

/* ── Spinner ── */
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/* ── Seat SVG icon — renders one seat cell on the seat map ── new update*/
function SeatIcon({ label, displayType, onClick }) {
  const fill = SEAT_COLORS[displayType] || "white";

  return (
    <button
      onClick={onClick}
      className="cursor-pointer hover:scale-105 transition-transform"
    >
      <svg width="42" height="52" viewBox="0 0 42 52">

        {/* Seat body */}
        <rect
          x="8"
          y="6"
          width="26"
          height="30"
          rx="3"
          fill={fill}
          stroke="#444"
          strokeWidth="1.5"
        />

        {/* left arm */}
        <rect x="3" y="8" width="5" height="22" rx="2" fill="#fff" stroke="#666" />

        {/* right arm */}
        <rect x="34" y="8" width="5" height="22" rx="2" fill="#fff" stroke="#666" />

        {/* bottom cushion */}
        <rect x="10" y="33" width="22" height="6" rx="2" fill="#fff" stroke="#666" />

        {/* seat number */}
        <text
          x="21"
          y="24"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#222"
        >
          {label}
        </text>
      </svg>
    </button>
  );
}

/* ── Contextual top navbar ──
   Shows passenger info + logout when logged in; Login button when guest.
   Replaces the public Navbar since this page is mounted outside UserLayout. ── */
function SeatNavbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-between
      px-6 py-2 bg-gradient-to-r from-[#163F2D] via-[#081935] to-[#163F2D]
      text-white shadow-lg h-14">

      {/* Left — logo + title */}
      <div
        onClick={() => navigate("/home")}
        className="flex items-center gap-3 cursor-pointer"
      >
        <img src={logo} alt="APSTS"
          className="w-8 h-8 rounded-full object-cover border border-white/30" />
        <div className="leading-tight hidden sm:block">
          <p className="text-sm font-semibold">
            Arunachal Pradesh State Transport
          </p>
          <p className="text-[10px] text-gray-300">Online Bus Booking</p>
        </div>
      </div>

      {/* Right — auth-aware actions */}
      {user ? (
        // Logged-in: show passenger name and logout
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5
            rounded-full text-sm">
            <FiUser />
            <span className="hidden sm:block">
              {user.name ?? user.phone ?? "Passenger"}
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full
              bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 transition"
          >
            <FiLogOut />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      ) : (
        // Guest: prompt to login
        <button
          onClick={() => navigate("/home/login")}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm
            font-medium bg-orange-500 hover:bg-orange-600 transition"
        >
          <FiUser size={14} />
          Login / Register
        </button>
      )}
    </div>
  );
}

// =============================================================================
// MODALS
// =============================================================================

/* ── Login gate — shown when a guest tries to click a seat ── */
function LoginGateModal({ onClose, onLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[400px] bg-gradient-to-br from-[#0f2027] via-[#203a43]
        to-[#2c5364] p-8 rounded-2xl border border-white/20 text-white
        text-center shadow-2xl">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-green-400 mb-2">
          Login Required
        </h2>
        <p className="text-gray-300 text-sm mb-6">
          You need to be logged in to book a seat.
          Your seat selection will be preserved after login.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white/10 border border-white/20
              hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600
              font-semibold"
          >
            Login / Register
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Abandon booking confirmation — shown when user tries to navigate away
   while a booking exists and seats are locked at step 4 ── */
function AbandonModal({ onStay, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[400px] bg-gradient-to-br from-[#0f2027] via-[#203a43]
        to-[#2c5364] p-8 rounded-2xl border border-white/20 text-white
        text-center shadow-2xl">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-orange-400 mb-2">
          Booking in Progress
        </h2>
        <p className="text-gray-300 text-sm mb-2">
          You have an active booking with seats locked.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          If you leave now, your seats will be released after the lock expires.
          Your PNR will remain and you can retry payment later.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onStay}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700
              font-semibold"
          >
            Stay & Pay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="px-5 py-2 rounded-lg bg-white/10 border border-white/20
              hover:bg-white/20"
          >
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LOCK TIMER
// Counts down from expiresAt to zero. Fires onExpired when it reaches 00:00.
// =============================================================================

function LockTimer({ expiresAt, onExpired }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    const compute = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) {
        setRemaining("00:00");
        onExpired?.();
        return false; // signal: stop the interval
      }
      const m = String(Math.floor(diff / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setRemaining(`${m}:${s}`);
      return true;
    };

    compute(); // run once immediately to avoid blank flash on mount
    const interval = setInterval(() => {
      if (!compute()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (!remaining) return null;

  // Compare numerically — string comparison on "05:00" is unreliable
  const [mm, ss]  = remaining.split(":").map(Number);
  const totalSecs = mm * 60 + ss;
  const isUrgent  = totalSecs < 300; // red warning under 5 minutes

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm
      font-semibold ${
        isUrgent
          ? "bg-red-500/30 text-red-300"
          : "bg-yellow-500/20 text-yellow-300"
      }`}
    >
      ⏱ {remaining}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SeatSelection() {

  const navigate       = useNavigate();
  const [
  searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const ticketRef      = useRef();

  // ── Detect a "returning from SBI ePay" load ─────────────────────────────
  // The backend's /payments/callback redirects the browser back here as:
  //   /home/seat-selection?bookingId=<uuid>&paymentStatus=success|failed
  // (none of the original journey query params survive that hop, which is
  // exactly why we snapshot everything into sessionStorage before leaving).
  const returningBookingId = searchParams.get("bookingId");
  const returningStatus    = searchParams.get("paymentStatus");
  const isReturningPayment = Boolean(returningBookingId && returningStatus);

  // Restored snapshot (only populated when isReturningPayment is true) —
  // read once, synchronously, so the very first render already has the
  // right journey details instead of flashing empty state.
  const restoredSnapshotRef = useRef(
    isReturningPayment ? loadPaymentSession(returningBookingId) : null
  );
  const restored = restoredSnapshotRef.current;

  // ── URL params passed from BusList (or restored from sessionStorage
  //    when returning from the SBI ePay redirect) ─────────────────────────
  const scheduleId = restored?.scheduleId ?? searchParams.get("scheduleId");
  const fromLabel  = restored?.fromLabel  ?? decodeURIComponent(searchParams.get("from")      ?? "");
  const toLabel    = restored?.toLabel    ?? decodeURIComponent(searchParams.get("to")        ?? "");
  const fromId     = restored?.fromId     ?? Number(searchParams.get("fromId")                ?? 0);
  const toId       = restored?.toId       ?? Number(searchParams.get("toId")                  ?? 0);
  const date       = restored?.date       ?? (searchParams.get("date")                        ?? "");
  const busLabel   = restored?.busLabel   ?? decodeURIComponent(searchParams.get("bus")       ?? "");
  const departure  = restored?.departure  ?? (searchParams.get("departure")                    ?? "");

  // ── Booking flow step ────────────────────────────────────────────────────
  // 2 = seat selection + passenger details
  // 3 = contact details
  // 4 = payment
  // 5 = confirmed ticket
  const [step, setStep] = useState(2);

  // ── Seat inventory ───────────────────────────────────────────────────────
  const [seatMap,      setSeatMap]      = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatError,    setSeatError]    = useState("");

  // Stop sequences resolved from route stops — needed for segment seat query
  const [fromStopSeq, setFromStopSeq] = useState(null);
  const [toStopSeq,   setToStopSeq]   = useState(null);

  // ── Passenger selection & details ───────────────────────────────────────
  const [selectedSeats,    setSelectedSeats]    = useState(restored?.selectedSeats ?? []);
  const [passengerDetails, setPassengerDetails] = useState(restored?.passengerDetails ?? {});

  // ── Modal visibility ─────────────────────────────────────────────────────
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [showAbandon,   setShowAbandon]   = useState(false);

  // Stores where the user was trying to go when the abandon modal fired,
  // so we can navigate there if they confirm "Leave Anyway"
  const abandonTargetRef = useRef(null);

  // ── Contact details (step 3) ─────────────────────────────────────────────
  const [contact,    setContact]    = useState(restored?.contact ?? { mobile: "", email: "" });
  const [emailError, setEmailError] = useState("");

  // ── Booking & payment state ──────────────────────────────────────────────
  const [booking,        setBooking]        = useState(restored?.booking ?? null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod,  setPaymentMethod]  = useState("");
  // `initiating` = API call in flight (includes the moment right before the
  // full-page redirect fires — there is no "modal open" state anymore)
  const [initiating,    setInitiating]    = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);

  // Set once we've finished resolving a returning-payment redirect, so the
  // rest of the component's effects (seat fetching etc.) don't fire on top
  // of a booking that's already confirmed/failed.
  const [resolvingReturn, setResolvingReturn] = useState(isReturningPayment);

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalFare = booking?.totalAmountPaid
    ? Number(booking.totalAmountPaid).toFixed(2)
    : "0.00";

  // ==========================================================================
  // SECTION 0 — RESOLVE RETURN FROM SBI EPAY
  // Runs once on mount when the URL carries ?bookingId=&paymentStatus= (i.e.
  // the backend just redirected us back after /payments/callback finished
  // verifying with SBI ePay). We re-fetch the booking from our own API as the
  // source of truth (never trust the query param alone), then land on the
  // right step and clean the URL so a refresh doesn't re-trigger this.
  // ==========================================================================

  useEffect(() => {
    if (!isReturningPayment) return;

    (async () => {
      try {
        const res           = await bookingApi.getById(returningBookingId);
        const freshBooking  = res.data?.data ?? res.data;
        setBooking(freshBooking);

        const confirmed = freshBooking?.bookingStatus === "CONFIRMED"
          || returningStatus === "success";

        if (confirmed) {
          toast.success("Payment successful! Ticket confirmed. 🎉");
          setPaymentFailed(false);
          setLockExpiresAt(null);
          setStep(5);
        } else {
          toast.error(
            `Payment failed or was not completed. PNR: ${freshBooking?.pnr ?? "-"}. ` +
            "You can retry below."
          );
          setPaymentFailed(true);
          setStep(4);
        }
      } catch (err) {
        toast.error("Could not verify your payment. Please check My Bookings or contact support.");
        setPaymentFailed(true);
        setStep(4);
      } finally {
        clearPaymentSession(returningBookingId);
        // Strip bookingId/paymentStatus from the URL without navigating away,
        // so a page refresh doesn't replay this effect.
        const cleaned = new URLSearchParams(searchParams);
        cleaned.delete("bookingId");
        cleaned.delete("paymentStatus");
        setSearchParams(cleaned, { replace: true });
        setResolvingReturn(false);
      }
    })();
    // Intentionally run only once on mount — this is a one-time redirect
    // resolution, not something that should re-run on every param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // SECTION 1 — SEAT INVENTORY
  // Fetch stop sequences from route stops, then load the seat map for the
  // specific from→to segment so availability is correct for partial journeys.
  // Skipped entirely while we're still resolving a returning payment redirect
  // (step will already be 4 or 5, no need to show the seat map underneath).
  // ==========================================================================

  /* ── Resolve stop sequences from route stops ── */
  useEffect(() => {
    if (resolvingReturn) return;
    if (!scheduleId || !fromId || !toId) return;

    getScheduleById(scheduleId)
      .then((res) => {
        const schedule = res.data?.data ?? res.data;
        const routeId  = schedule?.routeId ?? schedule?.route?.id;
        if (!routeId) return;

        api.get(`/admin/routes/${routeId}/stops`).then((r) => {
          const stops = r.data?.data ?? r.data ?? [];
          const from  = stops.find((s) => s.stationId === fromId);
          const to    = stops.find((s) => s.stationId === toId);
          if (from) setFromStopSeq(from.stopSequence);
          if (to)   setToStopSeq(to.stopSequence);
        });
      })
      .catch(() => {});
  }, [resolvingReturn, scheduleId, fromId, toId]);



  const fetchSeats = useCallback(() => {
  console.log("FETCHING SEATS");

  getScheduleSeats(scheduleId, fromStopSeq, toStopSeq)
    .then((res) => {

      console.log("Seat API Full Response:", res);
      console.log("Seat API Data:", res.data);

      const seats =
        Array.isArray(res.data)
          ? res.data
          : (res.data?.data ?? []);

      console.log("Parsed Seats:", seats);

      setSeatMap(seats);
    })
    .catch((err) => {
      console.error("Seat API Error:", err);
      setSeatError("Failed to load seat map.");
    })
    .finally(() => setLoadingSeats(false));

}, [scheduleId, fromStopSeq, toStopSeq]);


useEffect(() => {
  if (resolvingReturn) return;
  console.log("fromStopSeq =", fromStopSeq);
  console.log("toStopSeq =", toStopSeq);

  if (fromStopSeq !== null && toStopSeq !== null) {
    console.log("Calling fetchSeats()");
    fetchSeats();
  }
}, [resolvingReturn, fetchSeats, fromStopSeq, toStopSeq]);
  // ==========================================================================
  // SECTION 2 — SEAT MAP GRID COMPUTATION
  // Builds a 2-D array (rows × cols) from the flat seatMap list so we can
  // render the physical bus layout with an aisle gap in the middle.
  // ==========================================================================

 const maxRow = seatMap.reduce((m, s) => Math.max(m, s.rowNumber ?? 0), 0);
const maxCol = seatMap.reduce((m, s) => Math.max(m, s.colNumber ?? 0), 0);

console.log("========== SEAT DEBUG ==========");
console.log("seatMap:", seatMap);
console.log("seatMap length:", seatMap.length);
console.log("scheduleId:", scheduleId);
console.log("fromStopSeq:", fromStopSeq);
console.log("toStopSeq:", toStopSeq);
console.log("================================");

// Detect the aisle column by finding the col that has no seat in any
// non-last row. This works for 2+2 layouts AND last-row-full layouts.
const colsInNonLastRows = new Set(
  seatMap.filter(s => s.rowNumber < maxRow).map(s => s.colNumber)
);
const aisleAfterCol = (() => {
  for (let c = 2; c < maxCol; c++) {
    if (!colsInNonLastRows.has(c)) return c; // first gap = aisle column
  }
  return Math.floor(maxCol / 2); // fallback
})();

const grid = Array.from({ length: maxRow }, (_, ri) =>
  Array.from({ length: maxCol }, (_, ci) =>
    seatMap.find(
      (s) => s.rowNumber === ri + 1 && s.colNumber === ci + 1
    ) ?? null
  )
);

  /* ── Compute visual display type for one seat ──  new update___*/
 const getDisplayType = (seat) => {
  if (selectedSeats.find((s) => s.id === seat.id)) return "selected";

  const status = (seat.seatStatus ?? "").toLowerCase();

  if (status === "booked") return "booked";
  if (status === "locked" || status === "hold") return "locked";

  if (seat.isDriverSeat) return "driver";   // NEW
  if (seat.isLadiesQuota) return "ladies";

  return "available";
};

  // ==========================================================================
  // SECTION 3 — SEAT SELECTION & PASSENGER DETAILS
  // ==========================================================================

  /* ── Toggle seat in/out of selectedSeats ── */
  const handleSeatClick = useCallback((seat) => {
    if (!user) { setShowLoginGate(true); return; }

    const status = (seat.seatStatus ?? "").toLowerCase();
    if (["booked", "locked", "hold"].includes(status)) return;

    // Functional updater prevents stale-closure issues
    setSelectedSeats((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  }, [user]);

  /* ── Update a single field for one passenger ── */
  const updatePassenger = useCallback((seatId, field, value) =>
    setPassengerDetails((prev) => ({
      ...prev,
      [seatId]: { ...(prev[seatId] ?? {}), [field]: value },
    })),
  []);

  /* ── Validate step 2 and advance to step 3 ── */
  const handleProceedFromSeats = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    for (const seat of selectedSeats) {
      const d = passengerDetails[seat.id] ?? {};
      if (!d.name?.trim()) { toast.error(`Enter name for seat ${seat.seatLabel}`);    return; }
      if (!d.gender)       { toast.error(`Select gender for seat ${seat.seatLabel}`); return; }
      if (!d.age)          { toast.error(`Enter age for seat ${seat.seatLabel}`);     return; }
    }
    setStep(3);
  };

  // ==========================================================================
  // SECTION 4 — CONTACT & EMAIL VALIDATION
  // ==========================================================================

  const emailRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setContact((p) => ({ ...p, email: value }));
    setEmailError(
      value && !emailRegex.test(value.trim())
        ? "Please enter a valid email address"
        : ""
    );
  };

  // ==========================================================================
  // SECTION 5 — CREATE BOOKING (step 3 → 4)
  // POSTs the booking, then locks each selected seat for SEAT_LOCK_MINUTES.
  // If a booking already exists (user went back), we skip creation and jump
  // straight to step 4.
  // ==========================================================================

  const handleCreateBooking = async () => {
    // If booking already created (user navigated back), skip to payment
    if (booking) { setStep(4); return; }

    if (!contact.mobile || contact.mobile.length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!emailRegex.test(contact.email.trim())) {
      toast.error("Enter a valid email address");
      return;
    }

    setBookingLoading(true);
    try {
      const passengers = selectedSeats.map((seat) => {
        const d = passengerDetails[seat.id];
        return {
          passengerName:   d.name,
          passengerAge:    Number(d.age),
          passengerGender: d.gender,
          // seatId = actual BusSeat entity id (not the inventory row id)
          seatId:          seat.seatId ?? seat.id,
          concessionType:  "NONE",
        };
      });

      const res     = await bookingApi.create({
        scheduleId,
        fromStationId: fromId,
        toStationId:   toId,
        passengers,
        bookingSource: "WEB",
      });
      const created = res.data?.data ?? res.data;
      setBooking(created);

      const lockExpiry = new Date(
        Date.now() + SEAT_LOCK_MINUTES * 60 * 1000
      ).toISOString();
      setLockExpiresAt(lockExpiry);

      // Lock all selected seats concurrently; allSettled so one failure
      // doesn't block the rest
      await Promise.allSettled(
        selectedSeats.map((seat) =>
          lockSeatForJourney(
            seat.seatId ?? seat.id,
            scheduleId,
            created.bookingId ?? created.id,
            fromStopSeq,
            toStopSeq,
            lockExpiry
          )
        )
      );

      toast.success("Booking created! Complete payment within 10 minutes.");
      setPaymentFailed(false);
      setStep(4);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ?? "Failed to create booking. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // ==========================================================================
  // SECTION 6 — PAYMENT (step 4)
  // ==========================================================================

  /* ── Handle lock expiry — reset everything and go back to seat map ── */
  const handleLockExpired = useCallback(() => {
    toast.error(
      "Session expired. Seats released. Please start again.",
      { duration: 6000 }
    );
    setBooking(null);
    setSelectedSeats([]);
    setPassengerDetails({});
    setLockExpiresAt(null);
    setPaymentFailed(false);
    setStep(2);
    fetchSeats();
  }, [fetchSeats]);

  /* ── Initiate payment ──
     Handles two cases:
       1. Wallet payment → no gateway involved, direct API call, instant result
       2. Card/UPI/NetBanking → call initiate, snapshot page state into
          sessionStorage, then redirect the WHOLE browser to the transactionUrl
          SBI ePay gave us. There is no modal to open and nothing more to do
          here — the next thing this component sees is a fresh mount when the
          bank redirects back (handled by the SECTION 0 effect above).
     On 402 response → a pending payment already exists; fetch and reuse its
     transactionUrl instead of creating a duplicate order. ── */
  const handleInitiatePayment = async () => {
    if (!paymentMethod) { toast.error("Please select a payment method"); return; }
    if (!booking)       { toast.error("Booking not found.");              return; }
    if (initiating)     return;

    setInitiating(true);
    const bookingId = booking.bookingId ?? booking.id;

    try {
      const res       = await paymentApi.initiate({ bookingId, paymentMethod, source: PAYMENT_SOURCE});
      const initiated = res.data?.data ?? res.data;

      // ── Case 1: wallet payment (instant, no redirect) ──
      if (paymentMethod === "WALLET") {
        toast.success("Payment successful via wallet! 🎉");
        setLockExpiresAt(null);
        setPaymentFailed(false);
        setInitiating(false);
        setStep(5);
        return;
      }

      // ── Case 2: redirect to SBI ePay's hosted payment page ──
      if (!initiated?.transactionUrl) {
        throw new Error("Payment gateway did not return a redirect URL.");
      }

      savePaymentSession(bookingId, {
        booking, selectedSeats, passengerDetails, contact,
        scheduleId, fromLabel, toLabel, fromId, toId, date, busLabel, departure,
      });
      console.log("transactionUrl",initiated?.transactionUrl);
      
      toast.loading("Redirecting to secure payment page…", { duration: 9000 });
      window.location.href = initiated.transactionUrl;
      // Do not reset `initiating` here — we want the button to stay in its
      // loading state for the brief moment before the browser navigates away.

    } catch (err) {
      // 402 = a PENDING payment already exists for this booking;
      // fetch its transactionUrl and redirect using that instead
      if (err?.response?.status === 402) {
        try {
          const existing = await paymentApi.getByBookingId(bookingId);
          const payment  = existing.data?.data ?? existing.data;
          if (payment?.transactionUrl) {
            toast("Resuming your previous payment session.", { icon: "ℹ️" });
            savePaymentSession(bookingId, {
              booking, selectedSeats, passengerDetails, contact,
              scheduleId, fromLabel, toLabel, fromId, toId, date, busLabel, departure,
            });
            window.location.href = payment.transactionUrl;
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      setInitiating(false);
      setPaymentFailed(true);
      toast.error(
        err?.response?.data?.message ??
        err?.message ??
        "Failed to initiate payment. Please try again."
      );
    }
  };

  // ==========================================================================
  // SECTION 7 — NAVIGATION GUARDS
  // ==========================================================================

  /* ── Back navigation ──
     If a booking exists at step 4, intercept and show the abandon modal.
     Otherwise navigate normally. ── */
  const handleBack = (targetStep) => {
    if (booking && step === 4) {
      abandonTargetRef.current = targetStep;
      setShowAbandon(true);
      return;
    }
    if (targetStep === "navigate") {
      navigate(-1);
    } else {
      setStep(targetStep);
    }
  };

  /* ── Abandon modal: user chose "Leave Anyway" ── */
  const handleAbandonLeave = () => {
    setShowAbandon(false);
    const target = abandonTargetRef.current;
    abandonTargetRef.current = null;

    if (target === "navigate" || target == null) {
      navigate(-1);
      return;
    }
    // Navigate back within the flow but keep the existing booking & lock intact
    // so the user can still return and pay within the lock window
    setStep(target);
  };

  /* ── Logout guard — show abandon modal if payment is in progress ── */
  const handleLogout = () => {
    if (booking && step === 4) {
      abandonTargetRef.current = "navigate";
      setShowAbandon(true);
    } else {
      logout();
    }
  };

  // ==========================================================================
  // SECTION 8 — TICKET DOWNLOAD
  // ==========================================================================

  const downloadTicket = async () => {
    try {
      const canvas  = await html2canvas(ticketRef.current, {
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 130);
      pdf.save(`ticket-${booking?.pnr ?? "bus"}.pdf`);
    } catch {
      toast.error("Failed to download ticket. Please try again.");
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // While we're verifying a return from SBI ePay, show a lightweight loading
  // screen instead of the full seat-selection UI (which has nothing useful
  // to show yet — scheduleId/seatMap etc. haven't loaded).
  if (resolvingReturn) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center
        text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
        <Spinner />
        <p className="mt-4 text-gray-300">Confirming your payment…</p>
      </div>
    );
  }

  return (
    // pt-14 offsets the fixed SeatNavbar height
    <div className="w-full min-h-screen text-white bg-gradient-to-br
      from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-20 pb-10">

      {/* ── Fixed contextual navbar ── */}
      <SeatNavbar user={user} onLogout={handleLogout} />

      {/* ── Booking progress bar ── */}
      <div className="mb-6">
        <ProgressBar currentStep={step} />
      </div>

      {/* ── Modals ── */}
      {showLoginGate && (
        <LoginGateModal
          onClose={() => setShowLoginGate(false)}
          onLogin={() => {
            const redirect = encodeURIComponent(
              window.location.pathname + window.location.search
            );
            navigate(`/home/login?redirect=${redirect}`);
          }}
        />
      )}

      {showAbandon && (
        <AbandonModal
          onStay={() => {
            setShowAbandon(false);
            abandonTargetRef.current = null;
          }}
          onLeave={handleAbandonLeave}
        />
      )}

      {/* ── Three-column layout ── */}
      <div className="flex gap-6">

        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL — Journey summary + selected seats + back button
        ════════════════════════════════════════════════════════════════ */}
        <div className="relative w-[240px] shrink-0 rounded-xl overflow-hidden
          border border-white/20">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${sideBg})` }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative z-10 p-5 space-y-3">
            <h3 className="font-semibold text-green-300">Journey Details</h3>

            <div>
              <p className="text-xs text-gray-400">From</p>
              <p className="font-semibold uppercase text-sm">{fromLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">To</p>
              <p className="font-semibold uppercase text-sm">{toLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Service</p>
              <p className="font-semibold text-sm">{busLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date & Time</p>
              <p className="font-semibold text-sm">
                {formatDate(date)} {formatTime(departure)}
              </p>
            </div>

            {/* Show selected seats + PNR + fare once seats are chosen */}
            {selectedSeats.length > 0 && (
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Selected Seats</p>
                  <p className="font-semibold text-green-300 text-sm">
                    {selectedSeats.map((s) => s.seatLabel).join(", ")}
                  </p>
                </div>
                {booking && (
                  <>
                    <div>
                      <p className="text-xs text-gray-400">PNR</p>
                      <p className="font-semibold text-orange-300 tracking-wider text-sm">
                        {booking.pnr}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Fare</p>
                      <p className="font-semibold text-orange-400">₹ {totalFare}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Countdown timer shown only at payment step */}
            {lockExpiresAt && step === 4 && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-1">Time remaining</p>
                <LockTimer expiresAt={lockExpiresAt} onExpired={handleLockExpired} />
              </div>
            )}

            {/* Back button */}
            {step === 2 && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-white/10
                  hover:bg-white/20 text-xs text-gray-300 border border-white/10"
              >
                ← Back
              </button>
            )}
            {step > 2 && step < 5 && (
              <button
                type="button"
                onClick={() => handleBack(step - 1)}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-white/10
                  hover:bg-white/20 text-xs text-gray-300 border border-white/10"
              >
                ← Back
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MIDDLE PANEL — Interactive seat map
        ════════════════════════════════════════════════════════════════ */}
        <div className="w-[400px] shrink-0">
          <div className="relative p-5 border bg-white/10 backdrop-blur-md
            border-white/20 rounded-xl h-full">

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-300">Select Seats</h3>
              <span className="text-yellow-400 text-xl">🛞</span>
            </div>

            {/* Loading state */}
            {loadingSeats && (
              <div className="flex items-center justify-center py-16 text-gray-300">
                <Spinner />
                <span className="ml-2">Loading seat map…</span>
              </div>
            )}

            {/* Error state */}
            {!loadingSeats && seatError && (
              <div className="py-10 text-center">
                <p className="text-red-300 text-sm mb-3">{seatError}</p>
                <button
                  type="button"
                  onClick={fetchSeats}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20
                    text-xs text-gray-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Seat grid */}
            {!loadingSeats && !seatError && (
              <>
                <div className="space-y-2 overflow-auto max-h-[500px] pr-1">
                  {grid.map((row, ri) => (
                    <div key={ri} className="flex items-center gap-1">
                      {row.map((seat, ci) => (
                        <div key={ci} className="flex items-center">
                          {/* Aisle gap — only shown when this row has no seat in the aisle column */}
{ci === aisleAfterCol && row[aisleAfterCol - 1] === null && (
  <div className="w-5" />
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
                      ))}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 text-xs">
                  {[
                    { color: "bg-gray-500",           label: "Booked"    },
                    { color: "bg-orange-500",          label: "Locked"    },
                    { color: "bg-blue-500",            label: "Selected"  },
                    { color: "border border-white/40", label: "Available" },
                    { color: "bg-purple-500",          label: "Ladies"    },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span className="text-gray-300">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Guest prompt */}
                {!user && (
                  <p className="mt-4 text-xs text-orange-300 text-center">
                    <span
                      className="underline cursor-pointer"
                      onClick={() => setShowLoginGate(true)}
                    >
                      Login
                    </span>{" "}
                    to select seats
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL — Step-specific content
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 border bg-white/10 backdrop-blur-md
          border-white/20 rounded-xl p-6 min-h-[400px]">

          {/* ── STEP 2: Passenger Details ── */}
          {step === 2 && (
            selectedSeats.length === 0 ? (
              // Empty state — no seat selected yet
              <div className="flex flex-col items-center justify-center
                h-full gap-3 text-gray-400 py-20">
                <span className="text-5xl">💺</span>
                <p className="text-lg">Click a seat on the map to begin</p>
                {!user && (
                  <p className="text-sm text-orange-300 text-center">
                    You must be logged in.{" "}
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
                <h3 className="font-semibold text-green-300 mb-4">
                  Passenger Details (
                  {selectedSeats.length} seat
                  {selectedSeats.length > 1 ? "s" : ""})
                </h3>

                <div className="overflow-auto">
                  <table className="w-full text-sm border border-white/20">
                    <thead>
                      <tr className="bg-white/10 text-gray-300">
                        <th className="p-2 text-left">Seat</th>
                        <th className="p-2 text-left">Full Name *</th>
                        <th className="p-2 text-left">Gender *</th>
                        <th className="p-2 text-left">Age *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSeats.map((seat) => (
                        <tr key={seat.id} className="border-t border-white/10">
                          <td className="p-2 font-semibold text-green-300">
                            {seat.seatLabel}
                          </td>

                          {/* Name — letters, spaces, hyphens and dots only */}
                          <td className="p-2">
                            <input
                              value={passengerDetails[seat.id]?.name ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(
                                  /[^a-zA-Z\s.-]/g, ""
                                );
                                updatePassenger(seat.id, "name", value);
                              }}
                              placeholder="Full name"
                              className="w-full px-2 py-1 rounded bg-white/10
                                border border-white/20 outline-none text-sm"
                            />
                          </td>

                          {/* Gender */}
                          <td className="p-2">
                            <select
                              value={passengerDetails[seat.id]?.gender ?? ""}
                              onChange={(e) =>
                                updatePassenger(seat.id, "gender", e.target.value)
                              }
                              className="w-full rounded bg-white/20 border
                                border-white/30 text-white text-sm py-1"
                            >
                              <option value=""                  className="text-black bg-white">Select</option>
                              <option value="male"              className="text-black bg-white">Male</option>
                              <option value="female"            className="text-black bg-white">Female</option>
                              <option value="other"             className="text-black bg-white">Other</option>
                              <option value="prefer_not_to_say" className="text-black bg-white">Prefer not to say</option>
                            </select>
                          </td>

                          {/* Age — numeric 1-120 only */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={passengerDetails[seat.id]?.age ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                if (
                                  value === "" ||
                                  (Number(value) >= 1 && Number(value) <= 120)
                                ) {
                                  updatePassenger(seat.id, "age", value);
                                }
                              }}
                              placeholder="Age"
                              className="w-full px-2 py-1 rounded bg-white/10
                                border border-white/20 outline-none text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between mt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedSeats([])}
                    className="px-4 py-2 rounded-lg bg-red-500/80
                      hover:bg-red-600 text-sm"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromSeats}
                    className="px-5 py-2 rounded-lg bg-green-500
                      hover:bg-green-600 font-semibold text-sm"
                  >
                    Continue →
                  </button>
                </div>
              </>
            )
          )}

          {/* ── STEP 3: Contact Details ── */}
          {step === 3 && (
            <>
              <h3 className="font-semibold text-green-300 mb-1">
                Contact Details
              </h3>
              <p className="text-xs text-gray-400 mb-5">
                Your ticket confirmation will be sent here
              </p>

              <div className="space-y-4 max-w-sm">
                {/* Mobile */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Mobile Number *
                  </label>
                  <div className="flex items-center border border-white/20
                    rounded-xl overflow-hidden">
                    <span className="px-3 py-2.5 bg-white/10 text-sm
                      text-gray-300 border-r border-white/20 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={contact.mobile}
                      onChange={(e) =>
                        setContact((p) => ({
                          ...p,
                          mobile: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-transparent text-sm
                        outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={contact.email}
                    onChange={handleEmailChange}
                    className="w-full px-3 py-2.5 border border-white/20
                      rounded-xl bg-white/10 text-sm outline-none"
                  />
                  {emailError && (
                    <p className="text-red-400 text-xs mt-1">{emailError}</p>
                  )}
                </div>
              </div>

              {/* Booking summary */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border
                border-white/10 text-sm space-y-2 max-w-sm">
                <h4 className="text-gray-300 font-medium mb-2">
                  Booking Summary
                </h4>
                {selectedSeats.map((seat) => {
                  const d = passengerDetails[seat.id] ?? {};
                  return (
                    <div key={seat.id} className="flex justify-between text-xs">
                      <span className="text-gray-400">
                        {d.name} ({d.gender}, {d.age} yrs)
                      </span>
                      <span className="text-green-300">Seat {seat.seatLabel}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-white/10
                    hover:bg-white/20 text-sm"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={bookingLoading || !!emailError}
                  className="px-5 py-2 rounded-lg bg-green-500
                    hover:bg-green-600 font-semibold text-sm
                    disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center gap-2"
                >
                  {bookingLoading && <Spinner />}
                  {bookingLoading
                    ? "Creating Booking…"
                    : "Confirm & Proceed to Payment →"}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 4: Payment ── */}
          {step === 4 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-300">
                  Select Payment Method
                </h3>
                {lockExpiresAt && (
                  <LockTimer
                    expiresAt={lockExpiresAt}
                    onExpired={handleLockExpired}
                  />
                )}
              </div>

              {/* Failed / cancelled payment banner */}
              {paymentFailed && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20
                  border border-red-400/40 text-sm text-red-300
                  flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold">Payment failed or cancelled</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Select a payment method and try again. Your booking (PNR:{" "}
                      <span className="font-mono font-semibold">
                        {booking?.pnr}
                      </span>
                      ) is still active.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment method selection cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { key: "UPI",         icon: "📱", label: "UPI",          sub: "GPay, PhonePe, Paytm"    },
                  { key: "CREDIT_CARD", icon: "💳", label: "Credit Card",  sub: "Visa, Mastercard, RuPay" },
                  { key: "DEBIT_CARD",  icon: "🏧", label: "Debit Card",   sub: "All bank debit cards"    },
                  { key: "NET_BANKING", icon: "🏦", label: "Net Banking",  sub: "All major banks"          },
                  { key: "WALLET",      icon: "👛", label: "APSTS Wallet", sub: "Use your wallet balance"  },
                ].map(({ key, icon, label, sub }) => (
                  <div
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`p-4 border rounded-xl cursor-pointer
                      transition-all select-none ${
                        paymentMethod === key
                          ? "bg-green-500/30 border-green-400"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                  >
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-gray-400">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Note: unlike Razorpay, choosing UPI/Card/NetBanking here only
                  sets our own preferred payMode hint sent to SBI ePay's Order
                  Creation API — the bank's own hosted page still lets the
                  customer pick/change the exact method once redirected. */}

              {/* Fare breakdown */}
              {booking && (
                <div className="p-4 rounded-xl bg-white/5 border
                  border-white/10 text-sm space-y-1.5 mb-5">
                  <h4 className="text-gray-300 font-medium mb-2">
                    Fare Breakdown
                  </h4>
                  <div className="flex justify-between text-gray-400">
                    <span>Base Fare</span>
                    <span>₹ {Number(booking.baseFareTotal ?? 0).toFixed(2)}</span>
                  </div>
                  {Number(booking.reservationFeeTotal) > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Reservation Fee</span>
                      <span>₹ {Number(booking.reservationFeeTotal).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(booking.gstAmount) > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>GST</span>
                      <span>₹ {Number(booking.gstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(booking.concessionDiscountTotal) > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Concession Discount</span>
                      <span>- ₹ {Number(booking.concessionDiscountTotal).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-white
                    border-t border-white/10 pt-2 mt-2">
                    <span>Total Amount</span>
                    <span className="text-green-400">₹ {totalFare}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleBack(3)}
                  className="px-4 py-2 rounded-lg bg-white/10
                    hover:bg-white/20 text-sm"
                >
                  ← Back
                </button>

                {/* Pay button — disabled only while API call / redirect is
                    in flight. For gateway methods, a successful click means
                    the browser is about to navigate away entirely. */}
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={initiating}
                  className="px-5 py-2 rounded-lg font-semibold text-sm
                    disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center gap-2 bg-orange-500
                    hover:bg-orange-600 transition-colors"
                >
                  {initiating && <Spinner />}
                  {initiating
                    ? "Redirecting to secure payment page…"
                    : paymentFailed
                      ? `↻ Retry Payment ₹ ${totalFare}`
                      : `Pay ₹ ${totalFare}`}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 5: Confirmed Ticket ── */}
          {step === 5 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xl font-semibold">Booking Confirmed!</span>
              </div>

              {/* Printable / downloadable ticket card */}
              <div
                ref={ticketRef}
                className="w-full max-w-md rounded-2xl overflow-hidden
                  shadow-2xl bg-gradient-to-br from-[#0f2027] via-[#203a43]
                  to-[#2c5364] border border-white/20"
              >
                <div className="py-3 text-center bg-green-500 font-semibold
                  tracking-wide">
                  🎟 APSTS Bus Ticket
                </div>

                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">PNR</span>
                    <span className="font-bold tracking-widest text-orange-300">
                      {booking?.pnr}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route</span>
                    <span className="uppercase text-right">
                      {fromLabel} → {toLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service</span>
                    <span>{busLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span>{formatDate(date)} {formatTime(departure)}</span>
                  </div>

                  {/* Passengers — prefer booking.passengers (server data),
                      fall back to local selectedSeats state ── */}
                  {/* <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-2">Passengers</p>
                    {(booking?.passengers ?? selectedSeats).map((p, i) => {
                      const name   = p.passengerName   ?? passengerDetails[p.id]?.name;
                      const gender = p.passengerGender ?? passengerDetails[p.id]?.gender;
                      const age    = p.passengerAge    ?? passengerDetails[p.id]?.age;
                      const label  = p.seatLabel       ?? selectedSeats[i]?.seatLabel;
                      return (
                        <div key={i} className="flex justify-between text-xs mt-1">
                          <span>{name} ({gender}, {age} yrs)</span>
                          <span className="text-green-300">Seat {label}</span>
                        </div>
                      );
                    })}
                  </div> */}

                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-2">Passengers</p>
                    {(booking?.passengers ?? []).map((p) => (
                      <div key={p.reservationId} className="flex justify-between text-xs mt-1">
                        <span>{p.passengerName} ({p.passengerGender}, {p.passengerAge} yrs)</span>
                        <span className="text-green-300">Seat {p.seatLabel}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between border-t border-white/10 pt-3">
                    <span className="text-gray-400">Total Paid</span>
                    <span className="text-green-400 font-semibold">
                      ₹ {totalFare}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${
                      booking?.bookingStatus === "CONFIRMED"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}>
                      {booking?.bookingStatus}
                    </span>
                  </div>

                  {/* QR code for conductor verification
                  <div className="flex justify-center mt-4">
                    <QRCodeCanvas
                      value={JSON.stringify({
                        pnr:        booking?.pnr,
                        scheduleId,
                        seats:      selectedSeats.map((s) => s.seatLabel),
                        amount:     booking?.totalAmountPaid,
                      })}
                      size={100}
                      bgColor="transparent"
                      fgColor="#ffffff"
                    />
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Show this QR to the conductor for verification
                  </p>*/}
                   {/* QR codes for conductor verification — one per passenger,
                      since each seat is validated/boarded independently */}
                  <div className="border-t border-white/10 pt-3 mt-3">
                    {(booking?.passengers ?? []).map((p) => (
                      <div key={p.reservationId} className="flex flex-col items-center mt-4">
                        <QRCodeCanvas
                          value={p.qrCodeHash}
                          size={100}
                          bgColor="transparent"
                          fgColor="#ffffff"
                        />
                        <p className="text-xs mt-1">
                          {p.passengerName} — Seat {p.seatLabel}
                        </p>
                        {p.reservationStatus === "BOARDED" && (
                          <span className="text-green-400 text-xs mt-0.5">✓ Boarded</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Show your QR to the conductor for verification
                  </p>
                </div>
              </div> 



              {/* Post-booking actions */}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={downloadTicket}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600
                    rounded-lg font-semibold text-sm"
                >
                  ⬇ Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/my-bookings")}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20
                    border border-white/20 rounded-lg text-sm"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          )}

        </div>{/* end RIGHT PANEL */}
      </div>{/* end three-column layout */}
    </div>
  );
}
