// =============================================================================
// SeatSelection.jsx
// Public route (/home/seat-selection).
//
// SEAT HOLD (server side):  every seat tap PUTs the full desired seat set to /seat-holds.
//   The database decides who wins; the loser gets 409 and the tap rolls back.
//   The hold id is carried into POST /bookings (holdId) so there is no gap where
//   the seat is free. Timers always use SERVER time (skew learned from serverTime).
//
// REFRESH SAFETY: step, seats, passenger details, contact, holdId and bookingId are
//   saved to sessionStorage (FLOW_KEY) and re-validated on load.
//
// PAYMENT FLOW (SBI ePay / PhonePe hosted page): full-page redirect, so a separate
//   snapshot is saved right before leaving and restored when the gateway sends the
//   browser back with ?bookingId=&paymentStatus=.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";

import sideBg from "../../assets/side-bg.jpeg";
import logo from "../../assets/logo.png";
import useSeatHold from "../../hooks/useSeatHold";
import { seatHoldApi } from "../../api/seatHold";
import { validators, filters, blockNumberKeys } from "../../utils/validators";
import { formatINR } from "../../utils/money";
import { isoToDMY } from "../../utils/dateUtils";
import FareSummary from "../common/FareSummary";

import { getScheduleSeats, getScheduleById } from "../../api/schedule";
import api from "../../api/client";
import { bookingApi, paymentApi } from "../../api/booking";
import { ProgressBar } from "./BusList";

import { FiUser, FiLogOut } from "react-icons/fi";

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_SEATS_PER_BOOKING = 6;
const PAYMENT_SESSION_PREFIX = "apsts_pending_payment_";
const CONTACT_DRAFT_KEY = "apsts_contact_draft";

function loadContactDraft() {
  try {
    const raw = sessionStorage.getItem(CONTACT_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const SEAT_COLORS = {
  selected: "#3b82f6",
  ladies: "#a855f7",
  booked: "#6b7280",
  locked: "#f97316",
  hold: "#f97316",
  driver: "#334155",
  available: "white",
};

// =============================================================================
// PURE HELPERS
// =============================================================================

function formatTime(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function savePaymentSession(bookingId, snapshot) {
  try {
    sessionStorage.setItem(PAYMENT_SESSION_PREFIX + bookingId, JSON.stringify(snapshot));
  } catch (e) {
    console.error("Failed to save payment session snapshot", e);
  }
}

function loadPaymentSession(bookingId) {
  try {
    const raw = sessionStorage.getItem(PAYMENT_SESSION_PREFIX + bookingId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPaymentSession(bookingId) {
  sessionStorage.removeItem(PAYMENT_SESSION_PREFIX + bookingId);
}

// =============================================================================
// SMALL SHARED UI COMPONENTS
// =============================================================================

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function SeatIcon({ label, displayType, onClick }) {
  const fill = SEAT_COLORS[displayType] || "white";
  return (
    <button onClick={onClick} className="cursor-pointer hover:scale-105 transition-transform" aria-label={`Seat ${label}`}>
      <svg width="42" height="52" viewBox="0 0 42 52">
        <rect x="8" y="6" width="26" height="30" rx="3" fill={fill} stroke="#444" strokeWidth="1.5" />
        <rect x="3" y="8" width="5" height="22" rx="2" fill="#fff" stroke="#666" />
        <rect x="34" y="8" width="5" height="22" rx="2" fill="#fff" stroke="#666" />
        <rect x="10" y="33" width="22" height="6" rx="2" fill="#fff" stroke="#666" />
        <text x="21" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#222">{label}</text>
      </svg>
    </button>
  );
}

function SeatNavbar({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-2 bg-gradient-to-r from-[#163F2D] via-[#081935] to-[#163F2D] text-white shadow-lg h-14">
      <div onClick={() => navigate("/home")} className="flex items-center gap-3 cursor-pointer">
        <img src={logo} alt="APSTS" className="w-8 h-8 rounded-full object-cover border border-white/30" />
        <div className="leading-tight hidden sm:block">
          <p className="text-sm font-semibold">Arunachal Pradesh State Transport</p>
          <p className="text-[10px] text-gray-300">Online Bus Booking</p>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
            <FiUser />
            <span className="hidden sm:block">{user.name ?? user.phone ?? "Passenger"}</span>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 transition"
          >
            <FiLogOut />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/home/login")}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-orange-500 hover:bg-orange-600 transition"
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

function LoginGateModal({ onClose, onLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[400px] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 rounded-2xl border border-white/20 text-white text-center shadow-2xl">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-green-400 mb-2">Login Required</h2>
        <p className="text-gray-300 text-sm mb-6">
          You need to be logged in to book a seat. Your seat selection will be preserved after login.
        </p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">
            Cancel
          </button>
          <button type="button" onClick={onLogin} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold">
            Login / Register
          </button>
        </div>
      </div>
    </div>
  );
}

function AbandonModal({ onStay, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[400px] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 rounded-2xl border border-white/20 text-white text-center shadow-2xl">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-orange-400 mb-2">Booking in Progress</h2>
        <p className="text-gray-300 text-sm mb-2">You have an active booking with seats locked.</p>
        <p className="text-gray-400 text-xs mb-6">
          If you leave now, your seats will be released when the timer ends. Your PNR will remain and you can retry payment later.
        </p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={onStay} className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-semibold">
            Stay & Pay
          </button>
          <button type="button" onClick={onLeave} className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20">
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LOCK TIMER — counts down to the SERVER's expiry (skew-corrected)
// =============================================================================

function LockTimer({ expiresAt, skewMs = 0, onExpired }) {
  const [left, setLeft] = useState(null);
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - (Date.now() + skewMs); // server clock, not the PC clock
      setLeft(Math.max(0, ms));
      if (ms <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpired?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, skewMs]); // eslint-disable-line react-hooks/exhaustive-deps
  if (left === null) return null;
  const m = String(Math.floor(left / 60000)).padStart(2, "0");
  const s = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  return (
    <div className={`px-3 py-1 rounded-lg text-sm font-mono font-semibold ${left < 60000 ? "bg-red-500/30 text-red-300" : "bg-white/10 text-green-300"}`}>
      ⏱ Seats held for {m}:{s}
    </div>
  );
}

const FieldError = ({ children }) =>
  children ? <p role="alert" className="text-red-400 text-xs mt-1">{children}</p> : null;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SeatSelection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const ticketRef = useRef();

  // ── Returning from the payment gateway? ──────────────────────────────────
  const returningBookingId = searchParams.get("bookingId");
  const returningStatus = searchParams.get("paymentStatus");
  const isReturningPayment = Boolean(returningBookingId && returningStatus);

  const restoredSnapshotRef = useRef(isReturningPayment ? loadPaymentSession(returningBookingId) : null);
  const restored = restoredSnapshotRef.current;

  // ── Journey params (URL, or the snapshot when returning from the gateway) ──
  const scheduleId = restored?.scheduleId ?? searchParams.get("scheduleId");
  const fromLabel = restored?.fromLabel ?? decodeURIComponent(searchParams.get("from") ?? "");
  const toLabel = restored?.toLabel ?? decodeURIComponent(searchParams.get("to") ?? "");
  const fromId = restored?.fromId ?? Number(searchParams.get("fromId") ?? 0);
  const toId = restored?.toId ?? Number(searchParams.get("toId") ?? 0);
  const date = restored?.date ?? searchParams.get("date") ?? "";
  const busLabel = restored?.busLabel ?? decodeURIComponent(searchParams.get("bus") ?? "");
  const departure = restored?.departure ?? searchParams.get("departure") ?? "";

  // ── Flow persistence (must be declared BEFORE `step`, which reads it) ─────
  const FLOW_KEY = `apsts:flow:${scheduleId}:${fromId}:${toId}`;
  const flowRef = useRef(null);
  if (flowRef.current === null) {
    try {
      flowRef.current = JSON.parse(sessionStorage.getItem(FLOW_KEY) || "null") ?? {};
    } catch {
      flowRef.current = {};
    }
  }

  // 2 = seats + passengers · 3 = contact · 4 = payment · 5 = confirmed
  const [step, setStep] = useState(isReturningPayment ? 2 : Math.min(flowRef.current?.step ?? 2, 4));

  // ── Seat inventory ───────────────────────────────────────────────────────
  const [seatMap, setSeatMap] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatError, setSeatError] = useState("");
  const [fromStopSeq, setFromStopSeq] = useState(null);
  const [toStopSeq, setToStopSeq] = useState(null);

  // ── Passenger selection & details ───────────────────────────────────────
  const [selectedSeats, setSelectedSeats] = useState(restored?.selectedSeats ?? []);
  const [passengerDetails, setPassengerDetails] = useState(restored?.passengerDetails ?? {});
  const [passengerErrors, setPassengerErrors] = useState({});

  // ── Modals ───────────────────────────────────────────────────────────────
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const abandonTargetRef = useRef(null);

  // ── Contact (step 3) ─────────────────────────────────────────────────────
  const [contact, setContact] = useState(restored?.contact ?? loadContactDraft() ?? { mobile: "", email: "" });
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");

  // ── Booking & payment ────────────────────────────────────────────────────
  const [booking, setBooking] = useState(restored?.booking ?? null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);

  const [resumeInfo, setResumeInfo] = useState(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const prefilledRef = useRef(false);
  const [resolvingReturn, setResolvingReturn] = useState(isReturningPayment);

  // ── Live seat hold ───────────────────────────────────────────────────────
  const fetchSeatsRef = useRef(null);
  const holdApi = useSeatHold({
    scheduleId,
    fromId,
    toId,
    enabled: step === 2 && !resolvingReturn && !booking,
    fetchSeats: () => fetchSeatsRef.current?.(),
  });
  const bookingRef = useRef(null);
  bookingRef.current = booking;

  // ── Live fare preview (same server code as the real booking) ─────────────
  const [quote, setQuote] = useState(null);

  const totalFare = Number(booking?.totalAmountPaid ?? 0).toFixed(2);

  // ==========================================================================
  // SECTION 0 — RESOLVE RETURN FROM THE PAYMENT GATEWAY
  // ==========================================================================
  useEffect(() => {
    if (!isReturningPayment) return;

    (async () => {
      try {
        const res = await bookingApi.getById(returningBookingId);
        const freshBooking = res.data?.data ?? res.data;
        setBooking(freshBooking);

        const confirmed = freshBooking?.bookingStatus === "CONFIRMED" || returningStatus === "success";
        const stillPending = !confirmed && returningStatus === "pending";

        if (confirmed) {
          toast.success("Payment successful! Ticket confirmed. 🎉");
          setPaymentFailed(false);
          setLockExpiresAt(null);
          setStep(5);
        } else if (stillPending) {
          toast("Confirming your payment, this can take a minute…", { icon: "⏳" });
          setPaymentFailed(false);
          setStep(4);
        } else {
          toast.error(`Payment failed or was not completed. PNR: ${freshBooking?.pnr ?? "-"}. You can retry below.`);
          setPaymentFailed(true);
          setStep(4);
        }
      } catch {
        toast.error("Could not verify your payment. Please check My Bookings or contact support.");
        setPaymentFailed(true);
        setStep(4);
      } finally {
        clearPaymentSession(returningBookingId);
        flowRestoredRef.current = true;          // the old saved flow (step 4 + old hold) must NOT be restored now
        try { sessionStorage.removeItem(FLOW_KEY); } catch { /* ignore */ }
        const cleaned = new URLSearchParams(searchParams);
        cleaned.delete("bookingId");
        cleaned.delete("paymentStatus");
        const snap = restoredSnapshotRef.current;
        if (snap?.scheduleId && !cleaned.get("scheduleId")) {
          cleaned.set("scheduleId", snap.scheduleId);
          cleaned.set("from", encodeURIComponent(snap.fromLabel ?? ""));
          cleaned.set("to", encodeURIComponent(snap.toLabel ?? ""));
          cleaned.set("fromId", snap.fromId ?? "");
          cleaned.set("toId", snap.toId ?? "");
          cleaned.set("date", snap.date ?? "");
          cleaned.set("bus", encodeURIComponent(snap.busLabel ?? ""));
          cleaned.set("departure", snap.departure ?? "");
        } else if (!cleaned.get("scheduleId") && returningBookingId) {
          try {
            const b = (await bookingApi.getById(returningBookingId)).data;
            const bk = b?.data ?? b;
            if (bk?.scheduleId) {
              cleaned.set("scheduleId", bk.scheduleId);
              cleaned.set("fromId", bk.fromStationId);
              cleaned.set("toId", bk.toStationId);
            }
          } catch {
            /* nothing more we can recover */
          }
        }
        setSearchParams(cleaned, { replace: true });
        setResolvingReturn(false);
      }
    })();
    // one-time redirect resolution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fare preview effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (booking || step === 5 || selectedSeats.length === 0 || !user) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      bookingApi
        .quote({
          scheduleId,
          fromStationId: Number(fromId),
          toStationId: Number(toId),
          bookingSource: "WEB",
          passengers: selectedSeats.map((s) => ({
            seatId: s.seatId ?? s.id,
            passengerName: "Passenger",
            passengerAge: 30,
            passengerGender: "male",
            concessionType: "NONE",
          })),
        })
        .then((r) => setQuote(r.data?.data ?? r.data))
        .catch(() => setQuote(null));
    }, 250); // debounce while the user taps seats
    return () => clearTimeout(t);
  }, [selectedSeats, booking, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // SECTION 1 — SEAT INVENTORY
  // ==========================================================================
  useEffect(() => {
    if (resolvingReturn) return;
    if (!scheduleId || !fromId || !toId) return;

    getScheduleById(scheduleId)
      .then((res) => {
        const schedule = res.data?.data ?? res.data;
        const routeId = schedule?.routeId ?? schedule?.route?.id;
        if (!routeId) return;
        api.get(`/admin/routes/${routeId}/stops`).then((r) => {
          const stops = r.data?.data ?? r.data ?? [];
          const from = stops.find((s) => s.stationId === fromId);
          const to = stops.find((s) => s.stationId === toId);
          if (from) setFromStopSeq(from.stopSequence);
          if (to) setToStopSeq(to.stopSequence);
        });
      })
      .catch(() => {});
  }, [resolvingReturn, scheduleId, fromId, toId]);

  const fetchSeats = useCallback(() => {
    if (fromStopSeq === null || toStopSeq === null) return;
    getScheduleSeats(scheduleId, fromStopSeq, toStopSeq)
      .then((res) => {
        const seats = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setSeatMap(seats);
        setSeatError("");
      })
      .catch(() => setSeatError("Failed to load seat map."))
      .finally(() => setLoadingSeats(false));
  }, [scheduleId, fromStopSeq, toStopSeq]);
  fetchSeatsRef.current = fetchSeats; // the hold hook polls through this ref

  useEffect(() => {
    if (resolvingReturn) return;
    if (fromStopSeq !== null && toStopSeq !== null) fetchSeats();
  }, [resolvingReturn, fetchSeats, fromStopSeq, toStopSeq]);

  // coming back to the seat step: reload so own holds show as "mine"
  useEffect(() => {
    if (resolvingReturn || step !== 2) return;
    if (fromStopSeq !== null && toStopSeq !== null) fetchSeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ── Unpaid booking of this passenger on this journey ── */
  useEffect(() => {
    if (resolvingReturn || !user || !scheduleId) return;
    let cancelled = false;
    bookingApi
      .getResumable({
        scheduleId,
        fromStationId: fromId || undefined,
        toStationId: toId || undefined,
      })
      .then((res) => {
        if (!cancelled) setResumeInfo(res.data?.data ?? null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setResumeChecked(true));
    return () => {
      cancelled = true;
    };
  }, [resolvingReturn, user, scheduleId, fromId, toId]);

  const contactRestoredRef = useRef(false);
  useEffect(() => {
    if (contactRestoredRef.current || !resumeInfo) return;
    contactRestoredRef.current = true;
    if (!contact.mobile && !contact.email && (resumeInfo.contactMobile || resumeInfo.contactEmail)) {
      setContact({ mobile: resumeInfo.contactMobile ?? "", email: resumeInfo.contactEmail ?? "" });
    }
    if (resumeInfo.resumable && resumeInfo.holdExpiresAt && booking) {
      setLockExpiresAt(resumeInfo.holdExpiresAt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeInfo]);

  /* ── Pre-fill seats + details from the unpaid booking ── */
  useEffect(() => {
    if (prefilledRef.current || !resumeChecked || loadingSeats) return;
    if (!resumeInfo?.passengers?.length || seatMap.length === 0) return;
    if (selectedSeats.length > 0) {
      prefilledRef.current = true;
      return;
    }
    const seats = [];
    const details = {};
    for (const p of resumeInfo.passengers) {
      const seat = seatMap.find((s) => (s.seatId ?? s.id) === p.seatId);
      if (!seat) continue;
      const st = (seat.seatStatus ?? "").toLowerCase();
      if (!(st === "available" || seat.heldByMe)) continue;
      seats.push(seat);
      details[seat.id] = {
        name: p.passengerName ?? "",
        gender: p.passengerGender ?? "",
        age: p.passengerAge != null ? String(p.passengerAge) : "",
      };
    }
    prefilledRef.current = true;
    if (seats.length === 0) return;
    setSelectedSeats(seats);
    setPassengerDetails((prev) => ({ ...details, ...prev }));
    toast("We restored your previous seats and passenger details.", { icon: "↩️" });
  }, [resumeChecked, resumeInfo, seatMap, loadingSeats, selectedSeats.length]);

  /* ── Keep the selection honest against the latest seat map ── */
  useEffect(() => {
    if (resolvingReturn || step === 5 || booking || seatMap.length === 0) return;
    if (selectedSeats.length === 0) return;
    let changed = false;
    const kept = [];
    const movedDetails = {};
    for (const sel of selectedSeats) {
      const key = sel.seatId ?? sel.id;
      const cur = seatMap.find((s) => (s.seatId ?? s.id) === key);
      if (!cur) {
        changed = true;
        continue;
      }
      const st = (cur.seatStatus ?? "").toLowerCase();
      const takenByOthers = st === "booked" || ((st === "locked" || st === "hold") && !cur.heldByMe);
      if (takenByOthers) {
        changed = true;
        continue;
      }
      if (cur.id !== sel.id) {
        movedDetails[cur.id] = passengerDetails[sel.id];
        changed = true;
      }
      kept.push(cur);
    }
    if (!changed) return;
    if (kept.length < selectedSeats.length) toast.error("A seat you selected is no longer available.");
    setSelectedSeats(kept);
    if (Object.keys(movedDetails).length) setPassengerDetails((prev) => ({ ...movedDetails, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatMap]);

  // remember contact details for this tab
  useEffect(() => {
    try {
      sessionStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(contact));
    } catch {
      /* not critical */
    }
  }, [contact]);

  // ── Flow persistence: save ───────────────────────────────────────────────
  useEffect(() => {
    if (resolvingReturn) return;
    if (step === 5) {
      sessionStorage.removeItem(FLOW_KEY);
      return;
    }
    const seatIds = selectedSeats.map((s) => s.seatId ?? s.id);
    const detailsBySeatId = {};
    selectedSeats.forEach((s) => {
      detailsBySeatId[s.seatId ?? s.id] = passengerDetails[s.id] ?? {};
    });
    try {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({
          step,
          seatIds,
          detailsBySeatId,
          contact,
          holdId: holdApi.holdId,
          bookingId: booking?.bookingId ?? booking?.id ?? null,
        }),
      );
    } catch {
      /* storage blocked */
    }
  }, [step, selectedSeats, passengerDetails, contact, holdApi.holdId, booking, resolvingReturn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flow persistence: restore once the seat map + resume lookup are ready ──
  const flowRestoredRef = useRef(false);
  useEffect(() => {
    if (flowRestoredRef.current || resolvingReturn || loadingSeats || seatMap.length === 0 || !user || !resumeChecked) return;
    flowRestoredRef.current = true;
    if (isReturningPayment || step === 5 || bookingRef.current) return;   // confirmed / returned from gateway: nothing to restore
    const f = flowRef.current;
    if (!f?.seatIds?.length || (f.step ?? 2) < 3) return;

    (async () => {
      try {
        if (f.bookingId && resumeInfo?.resumable) {
          // booking already created → payment page
          const res = await bookingApi.getById(f.bookingId);
          const b = res.data?.data ?? res.data;
          const seats = seatMap.filter((s) => f.seatIds.includes(s.seatId ?? s.id));
          const details = {};
          seats.forEach((s) => {
            details[s.id] = f.detailsBySeatId?.[s.seatId ?? s.id] ?? {};
          });
          setSelectedSeats(seats);
          setPassengerDetails((p) => ({ ...p, ...details }));
          setContact((c) => (c.mobile || c.email ? c : f.contact ?? c));
          prefilledRef.current = true;
          setBooking(b);
          setLockExpiresAt(resumeInfo.holdExpiresAt);
          setStep(Math.min(f.step, 4));
          return;
        }
        if (f.holdId) {
          // soft hold still valid?
          const r = await seatHoldApi.get(f.holdId);
          const d = r.data?.data ?? r.data;
          holdApi.apply(d);
          const seats = seatMap.filter((s) => d.seatIds.includes(s.seatId ?? s.id));
          if (seats.length !== d.seatIds.length) throw new Error("seats changed");
          const details = {};
          seats.forEach((s) => {
            details[s.id] = f.detailsBySeatId?.[s.seatId ?? s.id] ?? {};
          });
          setSelectedSeats(seats);
          setPassengerDetails((p) => ({ ...p, ...details }));
          setContact((c) => (c.mobile || c.email ? c : f.contact ?? c));
          prefilledRef.current = true;
          setStep(f.step);
          return;
        }
        throw new Error("nothing to restore");
      } catch {
        sessionStorage.removeItem(FLOW_KEY);
        setStep(2);
        toast("Your seat hold expired while you were away. Please select your seats again.", { icon: "⏱️" });
      }
    })();
  }, [seatMap, loadingSeats, resumeChecked, user, resolvingReturn]); // eslint-disable-line react-hooks/exhaustive-deps

  // leaving this screen frees an un-booked hold immediately
  useEffect(
    () => () => {
      if (!bookingRef.current) holdApi.release();
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ==========================================================================
  // SECTION 2 — SEAT MAP GRID
  // ==========================================================================
  const maxRow = seatMap.reduce((m, s) => Math.max(m, s.rowNumber ?? 0), 0);
  const maxCol = seatMap.reduce((m, s) => Math.max(m, s.colNumber ?? 0), 0);

  const colsInNonLastRows = new Set(seatMap.filter((s) => s.rowNumber < maxRow).map((s) => s.colNumber));
  const aisleAfterCol = (() => {
    for (let c = 2; c < maxCol; c++) if (!colsInNonLastRows.has(c)) return c;
    return Math.floor(maxCol / 2);
  })();

  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol }, (_, ci) => seatMap.find((s) => s.rowNumber === ri + 1 && s.colNumber === ci + 1) ?? null),
  );

  const getDisplayType = (seat) => {
    if (selectedSeats.find((s) => s.id === seat.id)) return "selected";
    const status = (seat.seatStatus ?? "").toLowerCase();
    if (status === "booked") return "booked";
    if ((status === "locked" || status === "hold") && !seat.heldByMe) return "locked";
    if (seat.isDriverSeat) return "driver";
    if (seat.isLadiesQuota) return "ladies";
    return "available";
  };

  // ==========================================================================
  // SECTION 3 — SEAT SELECTION & PASSENGER DETAILS
  // ==========================================================================

  // The seat is held on the SERVER the moment it is tapped. If another device got there
  // first the tap fails with a message and the map refreshes (item 11).
  const handleSeatClick = useCallback(
    async (seat) => {
      if (!user) {
        setShowLoginGate(true);
        return;
      }
      if (booking) {
        toast("Seats are reserved for payment. Use “Change seats” to modify them.", { id: "seats-locked" });
        return;
      }
      const status = (seat.seatStatus ?? "").toLowerCase();
      if (status === "booked" || seat.isDriverSeat) return;
      if (["locked", "hold"].includes(status) && !seat.heldByMe) return;

      const exists = selectedSeats.some((s) => s.id === seat.id);
      if (!exists && selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
        toast.error(`You can book a maximum of ${MAX_SEATS_PER_BOOKING} seats at a time`, { id: "max-seats" });
        return;
      }
      const prev = selectedSeats;
      const next = exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat];
      setSelectedSeats(next); // instant UI
      const r = await holdApi.sync(next.map((s) => s.seatId ?? s.id)); // authoritative, atomic
      if (!r.ok) {
        setSelectedSeats(prev); // roll back
        toast.error(r.conflict ? `Seat ${seat.seatLabel} was just taken by another passenger.` : r.error, { id: "hold-fail" });
      }
    },
    [user, booking, selectedSeats, holdApi.sync], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleClearSelection = async () => {
    if (booking) return;
    const prev = selectedSeats;
    setSelectedSeats([]);
    const r = await holdApi.sync([]); // releases the hold on the server
    if (!r.ok) setSelectedSeats(prev);
  };

  const updatePassenger = useCallback((seatId, field, value) => {
    setPassengerDetails((prev) => ({ ...prev, [seatId]: { ...(prev[seatId] ?? {}), [field]: value } }));
    setPassengerErrors((prev) => (prev[seatId]?.[field] ? { ...prev, [seatId]: { ...prev[seatId], [field]: "" } } : prev));
  }, []);

  const handleProceedFromSeats = async () => {
    if (selectedSeats.length === 0) return toast.error("Please select at least one seat");
    const errs = {};
    for (const seat of selectedSeats) {
      const d = passengerDetails[seat.id] ?? {};
      const e = {
        name: validators.name(d.name, "Passenger name"),
        age: validators.age(d.age),
        gender: validators.gender(d.gender),
      };
      if (e.name || e.age || e.gender) errs[seat.id] = e;
    }
    setPassengerErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please correct the highlighted passenger details", { id: "pax-invalid" });
    if (!booking && !holdApi.holdId) {
      // e.g. restored from an older session
      const r = await holdApi.sync(selectedSeats.map((s) => s.seatId ?? s.id));
      if (!r.ok) return toast.error(r.error);
    }
    setStep(3);
  };

  // "Change seats": cancels the UNPAID booking server-side and re-holds the same seats,
  // so the next Confirm is priced afresh and the amount can never drift (item 14).
  const handleChangeSeats = async () => {
    const bid = booking?.bookingId ?? booking?.id ?? resumeInfo?.bookingId;
    if (!bid) {
      setStep(2);
      return;
    }
    try {
      const res = await bookingApi.changeSeats(bid);
      holdApi.apply(res.data?.data ?? res.data);
      setBooking(null);
      setResumeInfo(null);
      setLockExpiresAt(null);
      setPaymentFailed(false);
      setStep(2);
      fetchSeats();
      toast.success("You can now change your seats. The fare will be recalculated.");
    } catch {
      /* interceptor shows the reason */
    }
  };

  // ==========================================================================
  // SECTION 4 — CONTACT VALIDATION
  // ==========================================================================
  const handleEmailChange = (e) => {
    const value = e.target.value.replace(/\s/g, "");
    setContact((p) => ({ ...p, email: value }));
    setEmailError(validators.email(value));
  };

  const handleMobileChange = (e) => {
    const value = filters.digits(e.target.value, 10);
    setContact((p) => ({ ...p, mobile: value }));
    setMobileError(value.length === 10 ? validators.mobile(value) : "");
  };

  // ==========================================================================
  // SECTION 5 — CREATE BOOKING (step 3 → 4)
  // ==========================================================================
  const handleCreateBooking = async () => {
    const mErr = validators.mobile(contact.mobile);
    const eErr = validators.email(contact.email);
    setMobileError(mErr);
    setEmailError(eErr);
    if (mErr) return toast.error(mErr);
    if (eErr) return toast.error(eErr);

    // An unpaid booking already exists for these very seats → update it, don't create a new PNR
    const existing = booking ?? (resumeInfo?.resumable ? resumeInfo : null);
    if (existing?.passengers?.length) {
      const bookedIds = existing.passengers.map((p) => p.seatId).sort();
      const pickedIds = selectedSeats.map((s) => s.seatId ?? s.id).sort();
      const sameSeats = bookedIds.length === pickedIds.length && bookedIds.every((id, i) => id === pickedIds[i]);

      if (sameSeats) {
        setBookingLoading(true);
        try {
          const res = await bookingApi.updatePassengers(existing.bookingId ?? existing.id, {
            contactMobile: contact.mobile,
            contactEmail: contact.email.trim(),
            passengers: selectedSeats.map((seat) => {
              const d = passengerDetails[seat.id];
              return {
                seatId: seat.seatId ?? seat.id,
                passengerName: d.name.trim(),
                passengerAge: Number(d.age),
                passengerGender: d.gender,
              };
            }),
          });
          const updated = res.data?.data ?? res.data;
          setBooking(updated);
          setLockExpiresAt(updated.seatHoldExpiresAt ?? null);
          if (updated.serverTime) holdApi.setSkewMs(new Date(updated.serverTime).getTime() - Date.now());
          setPaymentFailed(false);
          setStep(4);
        } catch {
          // hold gone (or booking no longer editable): start clean
          setBooking(null);
          setResumeInfo(null);
          setLockExpiresAt(null);
          fetchSeats();
        } finally {
          setBookingLoading(false);
        }
        return;
      }
    }

    setBookingLoading(true);
    try {
      const passengers = selectedSeats.map((seat) => {
        const d = passengerDetails[seat.id];
        return {
          passengerName: d.name.trim(),
          passengerAge: Number(d.age),
          passengerGender: d.gender,
          seatId: seat.seatId ?? seat.id, // BusSeat entity id, not the inventory row id
          concessionType: "NONE",
        };
      });

      const res = await bookingApi.create({
        scheduleId,
        fromStationId: fromId,
        toStationId: toId,
        passengers,
        bookingSource: "WEB",
        holdId: holdApi.holdId, // the server turns the soft hold into the booking's hold
        contactMobile: contact.mobile,
        contactEmail: contact.email.trim(),
      });

      const created = res.data?.data ?? res.data;
      setBooking(created);
      holdApi.setHoldId(null);
      setResumeInfo(null);
      // the server decides when the hold ends; learn the clock skew from its response
      if (created.serverTime) holdApi.setSkewMs(new Date(created.serverTime).getTime() - Date.now());
      setLockExpiresAt(created.seatHoldExpiresAt ?? null);

      toast.success("Booking created! Complete payment before the timer ends.");
      setPaymentFailed(false);
      setStep(4);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "";
      if (/hold has expired|hold.*expired|select your seats again/i.test(msg)) {
        holdApi.setHoldId(null);
        holdApi.setExpiresAt(null);
        setSelectedSeats([]);
        setStep(2);
      }
      fetchSeats(); // show the current map (the interceptor already toasted the reason)
    } finally {
      setBookingLoading(false);
    }
  };

  // ==========================================================================
  // SECTION 6 — PAYMENT (step 4)
  // ==========================================================================
  const handleLockExpired = useCallback(() => {
    toast.error("Your seat hold expired. Please confirm your seats again - your details are saved.", { duration: 6000 });
    setBooking(null);
    setResumeInfo(null);
    setLockExpiresAt(null);
    holdApi.setHoldId(null);
    holdApi.setExpiresAt(null);
    setSelectedSeats([]); // seats are free again → must be re-held (details stay in passengerDetails)
    setPaymentFailed(false);
    setStep(2);
    fetchSeats();
  }, [fetchSeats]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapshot = (bookingId) =>
    savePaymentSession(bookingId, {
      booking, selectedSeats, passengerDetails, contact,
      scheduleId, fromLabel, toLabel, fromId, toId, date, busLabel, departure,
    });

  const handleInitiatePayment = async () => {
    if (!paymentMethod) return toast.error("Please select a payment method");
    if (!booking) return toast.error("Booking not found.");
    if (initiating) return;

    setInitiating(true);
    const bookingId = booking.bookingId ?? booking.id;

    try {
      const res = await paymentApi.initiate({ bookingId, paymentMethod });
      const initiated = res.data?.data ?? res.data;

      if (paymentMethod === "WALLET") {
        toast.success("Payment successful via wallet! 🎉");
        setLockExpiresAt(null);
        setPaymentFailed(false);
        setInitiating(false);
        setStep(5);
        return;
      }

      if (!initiated?.transactionUrl) throw new Error("Payment gateway did not return a redirect URL.");

      snapshot(bookingId);
      toast.loading("Redirecting to secure payment page…", { duration: 9000 });
      window.location.href = initiated.transactionUrl;
      // keep `initiating` true: the browser is about to leave
    } catch (err) {
      // 402 = a PENDING payment already exists: reuse its transactionUrl
      if (err?.response?.status === 402) {
        try {
          const existing = await paymentApi.getByBookingId(bookingId);
          const payment = existing.data?.data ?? existing.data;
          if (payment?.transactionUrl) {
            toast("Resuming your previous payment session.", { icon: "ℹ️" });
            snapshot(bookingId);
            window.location.href = payment.transactionUrl;
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setInitiating(false);
      setPaymentFailed(true);
      // axios interceptor already showed server errors; only toast client-side failures
      if (!err?.response) toast.error(err?.message ?? "Failed to initiate payment. Please try again.");
    }
  };

  // ==========================================================================
  // SECTION 7 — NAVIGATION GUARDS
  // ==========================================================================
  const handleBack = (targetStep) => {
    if (booking && step === 4) {
      abandonTargetRef.current = targetStep;
      setShowAbandon(true);
      return;
    }
    if (targetStep === "navigate") navigate(-1);
    else setStep(targetStep);
  };

  const handleAbandonLeave = () => {
    setShowAbandon(false);
    const target = abandonTargetRef.current;
    abandonTargetRef.current = null;
    if (target === "navigate" || target == null) {
      navigate(-1);
      return;
    }
    setStep(target);
  };

  const handleLogout = () => {
    if (booking && step === 4) {
      abandonTargetRef.current = "navigate";
      setShowAbandon(true);
    } else {
      logout();
    }
  };

  // ==========================================================================
  // SECTION 8 — TICKET
  // ==========================================================================
  const downloadTicket = async () => {
    try {
      const bookingId = booking.bookingId ?? booking.id;
      const res = await api.get(`/bookings/${bookingId}/ticket`, { responseType: "blob" });
      window.open(URL.createObjectURL(new Blob([res.data], { type: "application/pdf" })), "_blank");
    } catch {
      toast.error("Failed to load ticket. Please try again.");
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (resolvingReturn) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
        <Spinner />
        <p className="mt-4 text-gray-300">Confirming your payment…</p>
      </div>
    );
  }

  const timerExpiry = booking ? lockExpiresAt : holdApi.expiresAt;

  return (

    // <div className="w-full min-h-screen text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-20 pb-10">
    //   <SeatNavbar user={user} onLogout={handleLogout} />

    // pt-14 offsets the fixed SeatNavbar height
    <div
      className="w-full min-h-screen text-white bg-gradient-to-br
      from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-20 pb-10"
    >
      {/* ── Fixed contextual navbar ── */}
      


      <div className="mb-6">
        <ProgressBar currentStep={step} />
      </div>

      {showLoginGate && (
        <LoginGateModal
          onClose={() => setShowLoginGate(false)}
          onLogin={() => {
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
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
      <div className="flex flex-col xl:flex-row gap-6">
        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL — Journey summary + selected seats + back button
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="relative w-full xl:w-[240px] shrink-0 rounded-xl overflow-hidden border border-white/20"
        >
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
                {isoToDMY(String(date).slice(0, 10))} {formatTime(departure)}
              </p>
            </div>

            {selectedSeats.length > 0 && (
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Selected Seats</p>
                  <p className="font-semibold text-green-300 text-sm">{selectedSeats.map((s) => s.seatLabel).join(", ")}</p>
                </div>
                {booking && (
                  <>
                    <div>
                      <p className="text-xs text-gray-400">PNR</p>
                      <p className="font-semibold text-orange-300 tracking-wider text-sm">{booking.pnr}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Fare</p>
                      <p className="font-semibold text-orange-400">{formatINR(booking.totalAmountPaid)}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {(step === 3 || step === 4) && timerExpiry && (
              <LockTimer expiresAt={timerExpiry} skewMs={holdApi.skewMs} onExpired={handleLockExpired} />
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 border border-white/10"
              >
                ← Back
              </button>
            )}
            {step > 2 && step < 5 && (
              <button
                type="button"
                onClick={() => handleBack(step - 1)}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 border border-white/10"
              >
                ← Back
              </button>
            )}
          </div>
        </div>


        {/* ════════ MIDDLE PANEL — seat map ════════ */}
        {/* <div className="w-[400px] shrink-0">
          <div className="relative p-5 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl h-full"> */}

        {/* ════════════════════════════════════════════════════════════════
            MIDDLE PANEL — Interactive seat map
        ════════════════════════════════════════════════════════════════ */}
        <div className="w-full xl:w-[400px] shrink-0">
          <div
            className="relative p-5 border bg-white/10 backdrop-blur-md
            border-white/20 rounded-xl h-full"
          >

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-300">Select Seats</h3>
              <span className="text-yellow-400 text-xl">🛞</span>
            </div>

            {/* Seats reserved for payment: read-only + Change seats (item 14) */}
            {booking && step < 5 && (
              <div className="mb-3 p-3 rounded-lg bg-amber-500/20 text-amber-200 text-xs">
                Your seats are reserved for payment.{" "}
                <button type="button" onClick={handleChangeSeats} className="underline font-semibold">
                  Change seats
                </button>
              </div>
            )}

            {loadingSeats && (
              <div className="flex items-center justify-center py-16 text-gray-300">
                <Spinner />
                <span className="ml-2">Loading seat map…</span>
              </div>
            )}

            {!loadingSeats && seatError && (
              <div className="py-10 text-center">
                <p className="text-red-300 text-sm mb-3">{seatError}</p>
                <button type="button" onClick={fetchSeats} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300">
                  Retry
                </button>
              </div>
            )}

            {!loadingSeats && !seatError && (
              <>
                <div className="space-y-2 overflow-auto max-h-[500px] pr-1">
                  {grid.map((row, ri) => (
                    <div key={ri} className="flex items-center gap-1">
                      {row.map((seat, ci) => (
                        <div key={ci} className="flex items-center">
                          {ci === aisleAfterCol && row[aisleAfterCol - 1] === null && <div className="w-5" />}
                          {seat ? (
                            <SeatIcon label={seat.seatLabel} displayType={getDisplayType(seat)} onClick={() => handleSeatClick(seat)} />
                          ) : (
                            <div className="w-[34px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 text-xs">
                  {[
                    { color: "bg-gray-500", label: "Booked" },
                    { color: "bg-orange-500", label: "Held by someone" },
                    { color: "bg-blue-500", label: "Selected" },
                    { color: "border border-white/40", label: "Available" },
                    { color: "bg-purple-500", label: "Ladies" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span className="text-gray-300">{label}</span>
                    </div>
                  ))}
                </div>

                {!user && (
                  <p className="mt-4 text-xs text-orange-300 text-center">
                    <span className="underline cursor-pointer" onClick={() => setShowLoginGate(true)}>Login</span> to select seats
                  </p>
                )}
              </>
            )}
          </div>
        </div>


        {/* ════════ RIGHT PANEL — step content ════════ */}

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL — Step-specific content
        ════════════════════════════════════════════════════════════════ */}
      
<div className="w-full min-w-0 flex-1 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl p-6 min-h-[400px]">

  {/* ── STEP 2: Passenger Details ── */}
  {step === 2 &&
    (selectedSeats.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-20">
        <span className="text-5xl">💺</span>
        <p className="text-lg">Click a seat on the map to begin</p>
      </div>
    ) : (
      <>
        <h3 className="font-semibold text-green-300 mb-4">
          Passenger Details ({selectedSeats.length} seat
          {selectedSeats.length > 1 ? "s" : ""})
        </h3>

        <div className="w-full min-w-0 space-y-4">
          {selectedSeats.map((seat) => (
            <div
              key={seat.id}
              className="w-full min-w-0 p-4 rounded-xl border border-white/20 bg-white/5"
            >
              <div className="mb-4">
                <span className="text-sm font-semibold text-green-300">
                  Seat {seat.seatLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="min-w-0">
                  <label className="block text-xs text-gray-400 mb-2">
                    Full Name *
                  </label>
                  <input
                    value={passengerDetails[seat.id]?.name ?? ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(
                        /[^a-zA-Z\s.-]/g,
                        "",
                      );
                      updatePassenger(seat.id, "name", value);
                    }}
                    placeholder="Full name"
                    className="w-full min-w-0 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 outline-none text-sm focus:border-green-400"
                  />

                </div>


              {/* Booking summary + fare */}
              {/* <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm space-y-2 max-w-sm">
                <h4 className="text-gray-300 font-medium mb-2">Booking Summary</h4>
                {selectedSeats.map((seat) => {
                  const d = passengerDetails[seat.id] ?? {};
                  return (
                    <div key={seat.id} className="flex justify-between text-xs">
                      <span className="text-gray-400">{d.name} ({d.gender}, {d.age} yrs)</span>
                      <span className="text-green-300">Seat {seat.seatLabel}</span>
                    </div>
                  );
                })}
              </div>
              <div className="max-w-sm mt-4">
                <FareSummary f={booking ?? quote} title={booking ? "Fare Breakdown" : "Estimated fare"} />
              </div>

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={bookingLoading || !!emailError || !!mobileError}
                  className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bookingLoading && <Spinner />}
                  {bookingLoading ? "Creating Booking…" : "Confirm & Proceed to Payment →"}
                </button> */}

                {/* Gender */}
                <div className="min-w-0">
                  <label className="block text-xs text-gray-400 mb-2">
                    Gender *
                  </label>
                  <select
                    value={passengerDetails[seat.id]?.gender ?? ""}
                    onChange={(e) =>
                      updatePassenger(
                        seat.id,
                        "gender",
                        e.target.value,
                      )
                    }
                    className="w-full min-w-0 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm outline-none focus:border-green-400"
                  >
                    <option value="" className="text-black bg-white">
                      Select Gender
                    </option>
                    <option value="male" className="text-black bg-white">
                      Male
                    </option>
                    <option value="female" className="text-black bg-white">
                      Female
                    </option>
                    <option value="other" className="text-black bg-white">
                      Other
                    </option>
                    <option value="prefer_not_to_say" className="text-black bg-white">
                      Prefer not to say
                    </option>
                  </select>
                </div>

                {/* Age */}
                <div className="min-w-0 sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-2">
                    Age *
                  </label>
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
                    placeholder="Enter age"
                    className="w-full min-w-0 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 outline-none text-sm focus:border-green-400"
                  />
                </div>


              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setSelectedSeats([])}
            className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-sm font-medium transition-colors"
          >
            Clear Selection
          </button>

          <button
            type="button"
            onClick={handleProceedFromSeats}
            className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-sm font-semibold transition-colors"
          >
            Continue →
          </button>
        </div>
      </>
    ))}


            


{/* ── STEP 3: Contact Details ── */}
{step === 3 && (
  <>
    <h3 className="font-semibold text-green-300 mb-1">
      Contact Details
    </h3>
    <p className="text-xs text-gray-400 mb-5">
      Your ticket confirmation will be sent here
    </p>

    {/* Contact Form */}
    <div className="w-full grid grid-cols-2 gap-4">

      {/* Mobile */}
      <div className="w-full min-w-0">
        <label className="text-xs text-gray-400 mb-2 block">
          Mobile Number *
        </label>

        <div className="flex w-full items-center border border-white/20 rounded-xl overflow-hidden focus-within:border-green-400">
          <span className="px-3 py-3 bg-white/10 text-sm text-gray-300 border-r border-white/20 select-none">
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
            className="w-full min-w-0 px-3 py-3 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Email */}
      <div className="w-full min-w-0">
        <label className="text-xs text-gray-400 mb-2 block">
          Email Address *
        </label>

        <input
          type="email"
          placeholder="your@email.com"
          value={contact.email}
          onChange={handleEmailChange}
          className="w-full min-w-0 px-3 py-3 border border-white/20 rounded-xl bg-white/10 text-sm outline-none focus:border-green-400"
        />

        {emailError && (
          <p className="text-red-400 text-xs mt-1">
            {emailError}
          </p>
        )}
      </div>
    </div>

    {/* Booking Summary */}
    <div className="w-full mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
      <h4 className="text-gray-300 font-medium mb-3">
        Booking Summary
      </h4>

      <div className="space-y-3">
        {selectedSeats.map((seat) => {
          const d = passengerDetails[seat.id] ?? {};

          return (
            <div
              key={seat.id}
              className="flex flex-wrap justify-between items-center gap-2 text-xs border-b border-white/10 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-gray-300">
                {d.name} ({d.gender}, {d.age} yrs)
              </span>

              <span className="text-green-300 whitespace-nowrap">
                Seat {seat.seatLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    

{/* Navigation Buttons */}
<div className="flex justify-between items-center gap-3 mt-8 pt-5 border-t border-white/10">

  <button
    type="button"
    onClick={() => setStep(2)}
    className="inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap shrink-0 px-4 py-2 rounded-lg border border-white/25 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
  >
    <span>←</span>
    <span>Back</span>
  </button>

  <button
    type="button"
    onClick={handleCreateBooking}
    disabled={bookingLoading || !!emailError}
    className="inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap shrink-0 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {bookingLoading && <Spinner />}
    <span>
      {bookingLoading ? "Creating Booking..." : "Confirm & Proceed"}
    </span>
    {!bookingLoading && <span>→</span>}
  </button>

</div>


  </>
)}


          {/* ── STEP 4: Payment ── */}
          {step === 4 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-300">Select Payment Method</h3>
              </div>

              {paymentFailed && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-sm text-red-300 flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold">Payment failed or cancelled</p>
                    <p className="text-xs text-red-300 mt-0.5">
                      Select a payment method and try again. Your booking (PNR:{" "}
                      <span className="font-mono font-semibold">{booking?.pnr}</span>) is still active.
                    </p>
                    {/* Goes through "Change seats" so the old priced booking is cancelled and the fare is rebuilt */}
                    <button
                      type="button"
                      onClick={handleChangeSeats}
                      className="mt-2 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20"
                    >
                      ✏️ Edit passenger details / seats
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 max-w-md gap-4 mb-6">
                {[{ key: "PHONEPE", icon: "📱", label: "Pay with PhonePe", sub: "UPI, Cards, Net Banking" }].map(
                  ({ key, icon, label, sub }) => (
                    <div
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all select-none ${
                        paymentMethod === key ? "bg-green-500/30 border-green-400" : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-xl mb-1">{icon}</div>
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-xs text-gray-400">{sub}</div>
                    </div>
                  ),
                )}
              </div>

              <FareSummary f={booking} />

              <div className="flex justify-between items-center gap-2 flex-wrap">
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleBack(3)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleChangeSeats}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                  >
                    ✏️ Change seats
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={initiating}
                  className="px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  {initiating && <Spinner />}
                  {initiating
                    ? "Redirecting to secure payment page…"
                    : paymentFailed
                      ? `↻ Retry Payment ${formatINR(booking?.totalAmountPaid)}`
                      : `Pay ${formatINR(booking?.totalAmountPaid)}`}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 5: Confirmed ticket ── */}
          {step === 5 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xl font-semibold">Booking Confirmed!</span>
              </div>

              <div
                ref={ticketRef}
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] border border-white/20"
              >
                <div className="py-3 text-center bg-green-500 font-semibold tracking-wide">🎟 APSTS Bus Ticket</div>

                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">PNR</span>
                    <span className="font-bold tracking-widest text-orange-300">{booking?.pnr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route</span>
                    <span className="uppercase text-right">{fromLabel} → {toLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service</span>
                    <span>{busLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span>{isoToDMY(String(date).slice(0, 10))} {formatTime(departure)}</span>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-2">Passengers</p>
                    {(booking?.passengers ?? []).map((p) => (
                      <div key={p.reservationId} className="flex justify-between text-xs mt-1">
                        <span>{p.passengerName} ({p.passengerGender}, {p.passengerAge} yrs)</span>
                        <span className="text-green-300">Seat {p.seatLabel}</span>
                      </div>
                    ))}
                  </div>

                  <FareSummary f={booking} title="Payment summary" />

                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${booking?.bookingStatus === "CONFIRMED" ? "text-green-400" : "text-yellow-400"}`}>
                      {booking?.bookingStatus}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-3 mt-3">
                    {(booking?.passengers ?? []).map((p) => (
                      <div key={p.reservationId} className="flex flex-col items-center mt-4">
                        <QRCodeCanvas value={p.qrCodeHash} size={100} bgColor="transparent" fgColor="#ffffff" />
                        <p className="text-xs mt-1">{p.passengerName} — Seat {p.seatLabel}</p>
                        {p.reservationStatus === "BOARDED" && <span className="text-green-400 text-xs mt-0.5">✓ Boarded</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-2">Show your QR to the conductor for verification</p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="button" onClick={downloadTicket} className="px-5 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-sm">
                  ⬇ Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/my-bookings")}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm"
                >
                  View My Bookings
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/dashboard")}
                  className="px-5 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-sm font-semibold"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
