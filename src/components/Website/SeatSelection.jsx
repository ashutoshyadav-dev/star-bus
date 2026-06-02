import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import sideBg from "../../assets/side-bg.jpeg";
import { getScheduleSeats, lockSeatForJourney } from "../../api/schedule";
import { getScheduleById } from "../../api/schedule";
import api from "../../api/client";
import { bookingApi, paymentApi } from "../../api/booking";
import { ProgressBar } from "./BusList";
import { loadRazorpay } from "../../utils/loadRazorpay";

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const SEAT_LOCK_MINUTES = 10;
const RAZORPAY_KEY      = import.meta.env.VITE_RAZORPAY_KEY_ID;

// Maps our payment method keys → Razorpay's method identifiers
const RAZORPAY_METHOD_MAP = {
  UPI:         "upi",
  CREDIT_CARD: "card",
  DEBIT_CARD:  "card",
  NET_BANKING: "netbanking",
};

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/* ─── Seat Icon ─────────────────────────────────────────────────────────────── */

const SEAT_COLORS = {
  selected:  "#3b82f6",
  ladies:    "#a855f7",
  booked:    "#6b7280",
  locked:    "#f97316",
  hold:      "#f97316",
  available: "transparent",
};

function SeatIcon({ label, displayType, onClick }) {
  const fill    = SEAT_COLORS[displayType] ?? "transparent";
  const stroke  = displayType === "available" ? "#94a3b8" : fill;
  const blocked = ["booked", "locked", "hold"].includes(displayType);
  return (
    <div
      // FIX: use onMouseDown instead of onClick to avoid double-click issue
      // caused by React's synthetic event batching with state updates
      onMouseDown={!blocked ? (e) => { e.preventDefault(); onClick(); } : undefined}
      title={label}
      className={`flex flex-col items-center select-none ${
        blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80 transition-opacity"
      }`}
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
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
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

/* ─── Abandon Confirm Modal ─────────────────────────────────────────────────── */

function AbandonModal({ onStay, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[400px] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-8 rounded-2xl border border-white/20 text-white text-center shadow-2xl">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-orange-400 mb-2">Booking in Progress</h2>
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
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-semibold"
          >
            Stay & Pay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20"
          >
            Leave Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Lock Timer ────────────────────────────────────────────────────────────── */

function LockTimer({ expiresAt, onExpired }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    // Compute immediately so there's no blank flash
    const compute = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) {
        setRemaining("00:00");
        onExpired?.();
        return false; // signal stop
      }
      const m = String(Math.floor(diff / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setRemaining(`${m}:${s}`);
      return true;
    };

    compute();
    const interval = setInterval(() => {
      if (!compute()) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (!remaining) return null;
  // FIX: string comparison on "05:00" is unreliable — compare numerically
  const [mm, ss] = remaining.split(":").map(Number);
  const totalSecs = mm * 60 + ss;
  const isUrgent = totalSecs < 300; // under 5 minutes

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${
      isUrgent ? "bg-red-500/30 text-red-300" : "bg-yellow-500/20 text-yellow-300"
    }`}>
      ⏱ {remaining}
    </div>
  );
}

/* ─── SeatSelection ─────────────────────────────────────────────────────────── */

export default function SeatSelection() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const ticketRef      = useRef();

  const scheduleId = searchParams.get("scheduleId");
  const fromLabel  = decodeURIComponent(searchParams.get("from")      ?? "");
  const toLabel    = decodeURIComponent(searchParams.get("to")        ?? "");
  const fromId     = Number(searchParams.get("fromId")                ?? 0);
  const toId       = Number(searchParams.get("toId")                  ?? 0);
  const date       = searchParams.get("date")                         ?? "";
  const busLabel   = decodeURIComponent(searchParams.get("bus")       ?? "");
  const departure  = searchParams.get("departure")                    ?? "";

  const [step, setStep] = useState(2);

  // Seat inventory
  const [seatMap,      setSeatMap]      = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatError,    setSeatError]    = useState("");

  // Seat selection
  const [selectedSeats,    setSelectedSeats]    = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({});
  const [showLoginGate,    setShowLoginGate]    = useState(false);
  const [showAbandon,      setShowAbandon]      = useState(false);
  const [fromStopSeq, setFromStopSeq] = useState(null);
  const [toStopSeq,   setToStopSeq]   = useState(null);
  // FIX: track where user wants to go when abandon modal shows
  const abandonTargetRef = useRef(null);

  // Contact
  const [contact, setContact] = useState({ mobile: "", email: "" });

  // Booking & payment
  const [booking,        setBooking]        = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod,  setPaymentMethod]  = useState("");
  // FIX: split into two states — initiating (API call) and processing (Razorpay open)
  const [initiating,     setInitiating]     = useState(false);
  const [paymentFailed,  setPaymentFailed]  = useState(false);
  const [lockExpiresAt,  setLockExpiresAt]  = useState(null);

  /* ── Fetch seat inventory ── */
  const fetchSeats = useCallback(() => {
  if (!scheduleId) { setSeatError("No schedule selected."); setLoadingSeats(false); return; }
  setLoadingSeats(true);
  setSeatError("");
  getScheduleSeats(scheduleId, fromStopSeq, toStopSeq)  // ← pass sequences
    .then((res) => setSeatMap(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
    .catch(() => setSeatError("Failed to load seat map. Please try again."))
    .finally(() => setLoadingSeats(false));
}, [scheduleId, fromStopSeq, toStopSeq]);

  useEffect(() => {
  if (fromStopSeq !== null && toStopSeq !== null) {
    fetchSeats();
  }
}, [fetchSeats, fromStopSeq, toStopSeq]);


  useEffect(() => {
  if (!scheduleId || !fromId || !toId) return;

  getScheduleById(scheduleId).then((res) => {
    const schedule = res.data?.data ?? res.data;
    const routeId  = schedule?.routeId ?? schedule?.route?.id;
    if (!routeId) return;

    // fetch route stops to resolve sequences
    api.get(`/admin/routes/${routeId}/stops`).then((r) => {
      const stops = r.data?.data ?? r.data ?? [];
      const from  = stops.find((s) => s.stationId === fromId);
      const to    = stops.find((s) => s.stationId === toId);
      if (from) setFromStopSeq(from.stopSequence);
      if (to)   setToStopSeq(to.stopSequence);
    });
  }).catch(() => {});
}, [scheduleId, fromId, toId]);



  /* ── Grid ── */
  const maxRow        = seatMap.reduce((m, s) => Math.max(m, s.rowNumber ?? 0), 0);
  const maxCol        = seatMap.reduce((m, s) => Math.max(m, s.colNumber ?? 0), 0);
  const aisleAfterCol = Math.floor(maxCol / 2);
  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol }, (_, ci) =>
      seatMap.find((s) => s.rowNumber === ri + 1 && s.colNumber === ci + 1) ?? null
    )
  );

  /* ── Display type ── */
  const getDisplayType = (seat) => {
    if (selectedSeats.find((s) => s.id === seat.id)) return "selected";
    const status = (seat.seatStatus ?? "").toLowerCase();
    if (status === "booked")                      return "booked";
    if (status === "locked" || status === "hold") return "locked";
    if (seat.isLadiesQuota)                       return "ladies";
    return "available";
  };

  /* ── Seat click ── */
  // FIX: use functional updater — no stale closure issues
  const handleSeatClick = useCallback((seat) => {
    if (!user) { setShowLoginGate(true); return; }
    const status = (seat.seatStatus ?? "").toLowerCase();
    if (status === "booked" || status === "locked" || status === "hold") return;

    setSelectedSeats((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  }, [user]);

  /* ── Passenger update ── */
  const updatePassenger = useCallback((seatId, field, value) =>
    setPassengerDetails((prev) => ({ ...prev, [seatId]: { ...(prev[seatId] ?? {}), [field]: value } })),
  []);

  /* ── Step 2 → 3 ── */
  const handleProceedFromSeats = () => {
    if (selectedSeats.length === 0) { toast.error("Please select at least one seat"); return; }
    for (const seat of selectedSeats) {
      const d = passengerDetails[seat.id] ?? {};
      if (!d.name?.trim()) { toast.error(`Enter name for seat ${seat.seatLabel}`);    return; }
      if (!d.gender)       { toast.error(`Select gender for seat ${seat.seatLabel}`); return; }
      if (!d.age)          { toast.error(`Enter age for seat ${seat.seatLabel}`);     return; }
    }
    setStep(3);
  };

  /* ── Step 3 → 4: create booking ── */
  const handleCreateBooking = async () => {
    if (booking) {
  setStep(4);
  return;
}

    if (!contact.mobile || contact.mobile.length < 10) {
      toast.error("Enter a valid 10-digit mobile number"); return;
    }
    if (!contact.email?.includes("@")) {
      toast.error("Enter a valid email address"); return;
    }

    setBookingLoading(true);
    try {
      const passengers = selectedSeats.map((seat) => {
        const d = passengerDetails[seat.id];
        return {
          passengerName:   d.name,
          passengerAge:    Number(d.age),
          passengerGender: d.gender,
          // FIX: use seatId (the actual seat entity id) not seat.id (the inventory row id)
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

      const lockExpiry = new Date(Date.now() + SEAT_LOCK_MINUTES * 60 * 1000).toISOString();
      setLockExpiresAt(lockExpiry);

      // Lock seats — use seat inventory id (seat.id) for the lock endpoint
      await Promise.allSettled(
  selectedSeats.map((seat) =>
    lockSeatForJourney(
      seat.seatId ?? seat.id,          // the actual BusSeat id
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
      toast.error(err?.response?.data?.message ?? "Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  /* ── Lock expired ── */
  const handleLockExpired = useCallback(() => {
    toast.error("Session expired. Seats released. Please start again.", { duration: 6000 });
    setBooking(null);
    setSelectedSeats([]);
    setPassengerDetails({});
    setLockExpiresAt(null);
    setPaymentFailed(false);
    setStep(2);
    fetchSeats();
  }, [fetchSeats]);

  /* ── Open Razorpay modal ── */
  // FIX: separated from handleInitiatePayment so state is cleanly set before calling
  const openRazorpay = useCallback((initiated, currentBooking, currentContact, currentPaymentMethod) => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      setInitiating(false);
      return;
    }

    const options = {
      key:         RAZORPAY_KEY,
      // FIX: always integer paise, Math.round avoids floating-point issues
      amount:      Math.round(Number(initiated.amount) * 100),
      currency:    "INR",
      name:        "APSTS Bus Reservation",
      description: `Booking #${currentBooking.pnr}`,
      order_id:    initiated.gatewayOrderId,
      prefill: {
        contact: currentContact.mobile,
        email:   currentContact.email,
      },
      theme: { color: "#22c55e" },
      // FIX: pre-select the method the user chose on our UI
      ...(RAZORPAY_METHOD_MAP[currentPaymentMethod] && {
        config: {
          display: {
            blocks: {
              preferred: {
                name:    "Recommended",
                instruments: [{ method: RAZORPAY_METHOD_MAP[currentPaymentMethod] }],
              },
            },
            sequence: ["block.preferred"],
            preferences: { show_default_blocks: true },
          },
        },
      }),
      handler: async (response) => {
        await handlePaymentSuccess(response, currentBooking);
      },
      modal: {
        // FIX: escape key / back dismiss is treated as cancellation, not an error
        escape:    true,
        backdropclose: false,
        ondismiss: () => {
          // FIX: reset initiating so button is clickable again immediately
          setInitiating(false);
          setPaymentFailed(true);
          toast("Payment cancelled. Select a method and try again.", { icon: "⚠️" });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      setInitiating(false);
      setPaymentFailed(true);
      toast.error(
        response?.error?.description ?? "Payment failed. Please try again with a different method."
      );
    });
    rzp.open();
    // FIX: reset initiating AFTER open() so button isn't stuck if open() throws
    setInitiating(false);
  }, []);

  /* ── Initiate payment ── */
// const handleInitiatePayment = async () => {
//   if (!paymentMethod) { toast.error("Please select a payment method"); return; }
//   if (!booking) { toast.error("Booking not found."); return; }
//   if (initiating) return;

//   setInitiating(true);
//   setPaymentFailed(false);

//   //  Load Razorpay only when user actually pays (not on page load)
//   if (paymentMethod !== "WALLET") {
//     const loaded = await loadRazorpay();
//     if (!loaded) {
//       toast.error("Payment gateway failed to load. Check your internet connection.");
//       setInitiating(false);
//       return;
//     }
//   }

//   try {
//     const bookingId = booking.bookingId ?? booking.id;

//     if (paymentFailed && booking) {
//   const bookingId = booking.bookingId ?? booking.id;

//   try {
//     const existing = await paymentApi.getByBookingId(bookingId);
//     const payment = existing.data?.data ?? existing.data;

//     if (payment?.gatewayOrderId) {
//       openRazorpay(
//         payment,
//         booking,
//         contact,
//         paymentMethod
//       );
//       return;
//     }
//   } catch (e) {
//     console.error(e);
//   }
// }
//     const res = await paymentApi.initiate({ bookingId, paymentMethod });
//     const initiated = res.data?.data ?? res.data;

//     if (paymentMethod === "WALLET") {
//       toast.success("Payment successful via wallet! 🎉");
//       setLockExpiresAt(null);
//       setPaymentFailed(false);
//       setInitiating(false);
//       setStep(5);
//       return;
//     }

//     openRazorpay(initiated, booking, contact, paymentMethod);

//   } catch (err) {
//     // FIX: 402 means a PENDING payment already exists for this booking
//     // Fetch it and reuse its gatewayOrderId to reopen Razorpay
//     if (err?.response?.status === 402) {
//       try {
//         const bookingId = booking.bookingId ?? booking.id;
//         const existing = await paymentApi.getByBookingId(bookingId);
//         const payment = existing.data?.data ?? existing.data;

//         if (payment?.gatewayOrderId) {
//           toast("Resuming your previous payment session.", { icon: "ℹ️" });
//           openRazorpay(payment, booking, contact, paymentMethod);
//           return; // openRazorpay resets initiating
//         }
//       } catch {
//         // fall through to generic error
//       }
//     }

//     setInitiating(false);
//     setPaymentFailed(true);
//     toast.error(err?.response?.data?.message ?? "Failed to initiate payment. Please try again.");
//   }
// };

const handleInitiatePayment = async () => {
  if (!paymentMethod) {
    toast.error("Please select a payment method");
    return;
  }

  if (!booking) {
    toast.error("Booking not found.");
    return;
  }

  if (initiating) return;

  setInitiating(true);

  try {
    const bookingId = booking.bookingId ?? booking.id;

    // Retry existing pending payment
    if (paymentFailed) {
      try {
        const existing = await paymentApi.getByBookingId(bookingId);
        const payment = existing.data?.data ?? existing.data;

        if (payment?.gatewayOrderId) {
          setPaymentFailed(false);

          openRazorpay(
            payment,
            booking,
            contact,
            paymentMethod
          );

          return;
        }
      } catch (e) {
        console.error("Failed to resume payment", e);
      }
    }

    setPaymentFailed(false);

    if (paymentMethod !== "WALLET") {
      const loaded = await loadRazorpay();

      if (!loaded) {
        toast.error(
          "Payment gateway failed to load. Check your internet connection."
        );
        setInitiating(false);
        return;
      }
    }

    const res = await paymentApi.initiate({
      bookingId,
      paymentMethod,
    });

    const initiated = res.data?.data ?? res.data;

    if (paymentMethod === "WALLET") {
      toast.success("Payment successful via wallet! 🎉");
      setLockExpiresAt(null);
      setPaymentFailed(false);
      setInitiating(false);
      setStep(5);
      return;
    }

    openRazorpay(
      initiated,
      booking,
      contact,
      paymentMethod
    );

  } catch (err) {

    if (err?.response?.status === 402) {
      try {
        const bookingId = booking.bookingId ?? booking.id;

        const existing = await paymentApi.getByBookingId(
          bookingId
        );

        const payment =
          existing.data?.data ?? existing.data;

        if (payment?.gatewayOrderId) {
          toast(
            "Resuming your previous payment session.",
            { icon: "ℹ️" }
          );

          openRazorpay(
            payment,
            booking,
            contact,
            paymentMethod
          );

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
      "Failed to initiate payment. Please try again."
    );
  }
};

  /* ── Verify payment ── */
const handlePaymentSuccess = async (razorpayResponse, currentBooking) => {
  const toastId = toast.loading("Verifying payment…");
  try {
    const res = await paymentApi.webhook({
      gatewayOrderId:   razorpayResponse.razorpay_order_id,
      gatewayPaymentId: razorpayResponse.razorpay_payment_id,
      gatewaySignature: razorpayResponse.razorpay_signature,
      rawPayload:       razorpayResponse,   // ← object, not JSON.stringify()
    });

    // Re-fetch booking so ticket shows CONFIRMED not PENDING_PAYMENT
    const updated = await bookingApi.getById(currentBooking.bookingId ?? currentBooking.id);
    const freshBooking = updated.data?.data ?? updated.data;
    setBooking(freshBooking);

    toast.dismiss(toastId);
    toast.success("Payment successful! Ticket confirmed. 🎉");
    setPaymentFailed(false);
    setLockExpiresAt(null);
    setStep(5);
  } catch (err) {
    toast.dismiss(toastId);
    setPaymentFailed(true);
    toast.error(
      `Verification failed. PNR: ${currentBooking?.pnr}. Please contact support or retry.`
    );
  }
};
  /* ── Back navigation ── */
  // FIX: completely rewritten — handles abandon modal with a stored target
  // so the user isn't left in limbo
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

  // const handleAbandonLeave = () => {
  //   setShowAbandon(false);
  //   const target = abandonTargetRef.current;
  //   abandonTargetRef.current = null;
  //   if (target === "navigate" || target == null) {
  //     navigate(-1);
  //   } else {
  //     // Going back within the flow — clear booking state so permission checks
  //     // on later steps don't fire against a stale booking
  //     setBooking(null);
  //     setLockExpiresAt(null);
  //     setPaymentFailed(false);
  //     setStep(target);
  //   }
  // };

  const handleAbandonLeave = () => {
  setShowAbandon(false);

  const target = abandonTargetRef.current;
  abandonTargetRef.current = null;

  if (target === "navigate" || target == null) {
    navigate(-1);
    return;
  }

  // Keep existing booking and lock
  setStep(target);
};

  /* ── Handle logout during booking ── */
  const handleLogout = () => {
    if (booking && step === 4) {
      abandonTargetRef.current = "navigate";
      setShowAbandon(true);
    } else {
      logout();
    }
  };

  /* ── Download PDF ── */
  const downloadTicket = async () => {
    try {
      const canvas  = await html2canvas(ticketRef.current, { backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 130);
      pdf.save(`ticket-${booking?.pnr ?? "bus"}.pdf`);
    } catch {
      toast.error("Failed to download ticket. Please try again.");
    }
  };

  // FIX: use totalAmountPaid from booking if available, otherwise sum seats
  const totalFare = booking?.totalAmountPaid
    ? Number(booking.totalAmountPaid).toFixed(2)
    : "0.00";

  // FIX: derive bookingId safely in one place
  const bookingId = booking?.bookingId ?? booking?.id;

  return (
    <div className="w-full min-h-screen text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-6 pb-10">

      <div className="mb-6">
        <ProgressBar currentStep={step} />
      </div>

      {/* Modals */}
      {showLoginGate && (
        <LoginGateModal
          onClose={() => setShowLoginGate(false)}
          onLogin={() => {
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            navigate(`/ap/login?redirect=${redirect}`);
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

      <div className="flex gap-6">

        {/* ── LEFT: Journey info ── */}
        <div className="relative w-[240px] shrink-0 rounded-xl overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${sideBg})` }} />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 p-5 space-y-3">
            <h3 className="font-semibold text-green-300">Journey Details</h3>
            <div><p className="text-xs text-gray-400">From</p><p className="font-semibold uppercase text-sm">{fromLabel}</p></div>
            <div><p className="text-xs text-gray-400">To</p><p className="font-semibold uppercase text-sm">{toLabel}</p></div>
            <div><p className="text-xs text-gray-400">Service</p><p className="font-semibold text-sm">{busLabel}</p></div>
            <div><p className="text-xs text-gray-400">Date & Time</p><p className="font-semibold text-sm">{formatDate(date)} {formatTime(departure)}</p></div>

            {selectedSeats.length > 0 && (
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Selected Seats</p>
                  <p className="font-semibold text-green-300 text-sm">{selectedSeats.map((s) => s.seatLabel).join(", ")}</p>
                </div>
                {booking && (
                  <>
                    <div><p className="text-xs text-gray-400">PNR</p><p className="font-semibold text-orange-300 tracking-wider text-sm">{booking.pnr}</p></div>
                    <div><p className="text-xs text-gray-400">Total Fare</p><p className="font-semibold text-orange-400">₹ {totalFare}</p></div>
                  </>
                )}
              </div>
            )}

            {lockExpiresAt && step === 4 && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-1">Time remaining</p>
                <LockTimer expiresAt={lockExpiresAt} onExpired={handleLockExpired} />
              </div>
            )}

            {/* FIX: back button uses handleBack consistently */}
            {step > 2 && step < 5 && (
              <button
                type="button"
                onClick={() => handleBack(step === 2 ? "navigate" : step - 1)}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 border border-white/10"
              >
                ← Back
              </button>
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
          </div>
        </div>

        {/* ── MIDDLE: Seat map ── */}
        <div className="w-[400px] shrink-0">
          <div className="relative p-5 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-300">Select Seats</h3>
              <span className="text-yellow-400 text-xl">🛞</span>
            </div>

            {loadingSeats && (
              <div className="flex items-center justify-center py-16 text-gray-300">
                <Spinner /><span className="ml-2">Loading seat map…</span>
              </div>
            )}

            {!loadingSeats && seatError && (
              <div className="py-10 text-center">
                <p className="text-red-300 text-sm mb-3">{seatError}</p>
                <button
                  type="button"
                  onClick={fetchSeats}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300"
                >
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
                          {ci === aisleAfterCol && <div className="w-5" />}
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

                {!user && (
                  <p className="mt-4 text-xs text-orange-300 text-center">
                    <span
                      className="underline cursor-pointer"
                      onClick={() => setShowLoginGate(true)}
                    >
                      Login
                    </span>{" "}to select seats
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Step content ── */}
        <div className="flex-1 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl p-6 min-h-[400px]">

          {/* STEP 2 — Passenger Details */}
          {step === 2 && (
            selectedSeats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-20">
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
                  Passenger Details ({selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""})
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
                          <td className="p-2 font-semibold text-green-300">{seat.seatLabel}</td>
                          <td className="p-2">
                            <input
                              value={passengerDetails[seat.id]?.name ?? ""}
                              onChange={(e) => updatePassenger(seat.id, "name", e.target.value)}
                              placeholder="Full name"
                              className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 outline-none text-sm"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={passengerDetails[seat.id]?.gender ?? ""}
                              onChange={(e) => updatePassenger(seat.id, "gender", e.target.value)}
                              className="w-full rounded bg-white/20 border border-white/30 text-white text-sm py-1"
                            >
                              <option value=""                   className="text-black bg-white">Select</option>
                              <option value="male"              className="text-black bg-white">Male</option>
                              <option value="female"            className="text-black bg-white">Female</option>
                              <option value="other"             className="text-black bg-white">Other</option>
                              <option value="prefer_not_to_say" className="text-black bg-white">Prefer not to say</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number" min="1" max="120"
                              value={passengerDetails[seat.id]?.age ?? ""}
                              onChange={(e) => updatePassenger(seat.id, "age", e.target.value)}
                              placeholder="Age"
                              className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 outline-none text-sm"
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
                    className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-sm"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromSeats}
                    className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 font-semibold text-sm"
                  >
                    Continue →
                  </button>
                </div>
              </>
            )
          )}

          {/* STEP 3 — Contact */}
          {step === 3 && (
            <>
              <h3 className="font-semibold text-green-300 mb-1">Contact Details</h3>
              <p className="text-xs text-gray-400 mb-5">Your ticket confirmation will be sent here</p>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Mobile Number *</label>
                  <div className="flex items-center border border-white/20 rounded-xl overflow-hidden">
                    <span className="px-3 py-2.5 bg-white/10 text-sm text-gray-300 border-r border-white/20 select-none">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={contact.mobile}
                      onChange={(e) => setContact((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "") }))}
                      className="w-full px-3 py-2.5 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={contact.email}
                    onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-white/20 rounded-xl bg-white/10 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm space-y-2 max-w-sm">
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

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={bookingLoading}
                  className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bookingLoading && <Spinner />}
                  {bookingLoading ? "Creating Booking…" : "Confirm & Proceed to Payment →"}
                </button>
              </div>
            </>
          )}

          {/* STEP 4 — Payment */}
          {step === 4 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-300">Select Payment Method</h3>
                {lockExpiresAt && (
                  <LockTimer expiresAt={lockExpiresAt} onExpired={handleLockExpired} />
                )}
              </div>

              {paymentFailed && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-sm text-red-300 flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold">Payment failed or cancelled</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Select a payment method and try again. Your booking (PNR:{" "}
                      <span className="font-mono font-semibold">{booking?.pnr}</span>) is still active.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { key: "UPI",         icon: "📱", label: "UPI",          sub: "GPay, PhonePe, Paytm" },
                  { key: "CREDIT_CARD", icon: "💳", label: "Credit Card",  sub: "Visa, Mastercard, RuPay" },
                  { key: "DEBIT_CARD",  icon: "🏧", label: "Debit Card",   sub: "All bank debit cards" },
                  { key: "NET_BANKING", icon: "🏦", label: "Net Banking",  sub: "All major banks" },
                  { key: "WALLET",      icon: "👛", label: "APSTS Wallet", sub: "Use your wallet balance" },
                ].map(({ key, icon, label, sub }) => (
                  <div
                    key={key}
                    // FIX: type="button" + onClick (not onMouseDown) is correct for card selections
                    onClick={() => setPaymentMethod(key)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all select-none ${
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

              {booking && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm space-y-1.5 mb-5">
                  <h4 className="text-gray-300 font-medium mb-2">Fare Breakdown</h4>
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
                  <div className="flex justify-between font-semibold text-white border-t border-white/10 pt-2 mt-2">
                    <span>Total Amount</span>
                    <span className="text-green-400">₹ {totalFare}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleBack(3)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  // FIX: disabled only when initiating — paymentMethod check is done inside handler
                  // so the button is always clickable (better UX than graying out)
                  disabled={initiating}
                  className="px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  {initiating && <Spinner />}
                  {initiating
                    ? "Opening Payment…"
                    : paymentFailed
                      ? `↻ Retry Payment ₹ ${totalFare}`
                      : `Pay ₹ ${totalFare}`}
                </button>
              </div>
            </>
          )}

          {/* STEP 5 — Confirmed Ticket */}
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
                <div className="py-3 text-center bg-green-500 font-semibold tracking-wide">
                  🎟 APSTS Bus Ticket
                </div>
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
                    <span>{formatDate(date)} {formatTime(departure)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-gray-400 mb-2">Passengers</p>
                    {(booking?.passengers ?? selectedSeats).map((p, i) => {
                      // FIX: handle both booking.passengers array and selectedSeats fallback
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
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3">
                    <span className="text-gray-400">Total Paid</span>
                    <span className="text-green-400 font-semibold">₹ {totalFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${
                      booking?.bookingStatus === "CONFIRMED" ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {booking?.bookingStatus}
                    </span>
                  </div>
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
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={downloadTicket}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-sm"
                >
                  ⬇ Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/my-bookings")}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

