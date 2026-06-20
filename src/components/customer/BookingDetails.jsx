import { useNavigate, useLocation } from "react-router-dom";
import { useRef } from "react";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiDownload,
  FiMapPin,
  FiArrowRight,
} from "react-icons/fi";

import { QRCodeCanvas } from "qrcode.react";

const STATUS_META = {
  CONFIRMED: {
    label: "Confirmed",
    style: "bg-blue-100 text-blue-700",
  },
  COMPLETED: {
    label: "Completed",
    style: "bg-green-100 text-green-700",
  },
  FULLY_CANCELLED: {
    label: "Cancelled",
    style: "bg-red-100 text-red-600",
  },
  PENDING_PAYMENT: {
    label: "Pending",
    style: "bg-yellow-100 text-yellow-700",
  },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "—";

  if (typeof time === "string") {
    const [h, m] = time.split(":").map(Number);

    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 || 12;

    return `${String(h12).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )} ${ampm}`;
  }

  const { hour = 0, minute = 0 } = time;

  const ampm = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 || 12;

  return `${String(h12).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${ampm}`;
}

export default function BookingDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const ticketRef = useRef(null);

  const booking = location.state?.booking;

  // ─────────────────────────────────────────────
  // Download PDF
  // ─────────────────────────────────────────────
  const handleDownload = async () => {
  const element = ticketRef.current;
  if (!element) return;

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    // ── Grab the QR <canvas> and convert to PNG BEFORE html2canvas runs ──
    const qrCanvas = element.querySelector("canvas");
    if (qrCanvas) {
      const qrDataUrl = qrCanvas.toDataURL("image/png");
      const img = document.createElement("img");
      img.src = qrDataUrl;
      img.width  = qrCanvas.width;
      img.height = qrCanvas.height;
      img.style.width  = qrCanvas.style.width  || qrCanvas.width  + "px";
      img.style.height = qrCanvas.style.height || qrCanvas.height + "px";
      // Temporarily swap canvas → img so html2canvas captures it
      qrCanvas.parentNode.replaceChild(img, qrCanvas);

      const mainCanvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Restore the original QR canvas
      img.parentNode.replaceChild(qrCanvas, img);

      const imgData   = mainCanvas.toDataURL("image/png");
      const pdf       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth  = 210;
      const imgHeight = (mainCanvas.height * pdfWidth) / mainCanvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      pdf.save(`eTicket_${booking.pnr ?? booking.bookingId ?? "ticket"}.pdf`);

    } else {
      // Fallback — no QR canvas found, just capture normally
      const mainCanvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(mainCanvas.toDataURL("image/png"), "PNG", 0, 0, 210,
        (mainCanvas.height * 210) / mainCanvas.width);
      pdf.save(`eTicket_${booking.pnr ?? booking.bookingId ?? "ticket"}.pdf`);
    }

  } catch (err) {
    console.error("PDF generation failed:", err);
   toast.error("Could not generate PDF. Please try again.");
  }
};

  // ─────────────────────────────────────────────
  // No booking found
  // ─────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="max-w-2xl space-y-5">
        <button
          onClick={() => navigate("/user/my-bookings")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
        >
          <FiArrowLeft />
          Back to Bookings
        </button>

        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-red-100">
          <p className="text-red-500 font-medium">
            Booking not found.
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Please go back and click View Details again.
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_META[booking.bookingStatus] ?? {
    label: booking.bookingStatus,
    style: "bg-gray-100 text-gray-600",
  };

  const isCancelled =
    booking.bookingStatus === "FULLY_CANCELLED";

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate("/user/my-bookings")}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <FiArrowLeft />
        Back to Bookings
      </button>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#163F2D] p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-70 mb-1">
                PNR Number
              </p>

              <p className="text-2xl font-bold tracking-widest">
                {booking.pnr ?? "—"}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.style}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 mt-4 text-lg font-semibold flex-wrap">
            <FiMapPin size={16} />

            <span>
              {booking.fromStationName ?? "—"}
            </span>

            <FiArrowRight className="text-orange-400" />

            <span>
              {booking.toStationName ?? "—"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
          <DetailRow
            label="Booking ID"
            value={booking.bookingId}
            mono
          />

          <DetailRow
            label="Journey Date"
            value={formatDate(booking.journeyDate)}
          />

          <DetailRow
            label="Departure Time"
            value={formatTime(booking.departureTime)}
          />

          <DetailRow
            label="Bus Type"
            value={booking.busTypeName}
          />

          <DetailRow
            label="Total Amount"
            value={`₹${
              booking.totalAmountPaid?.toLocaleString(
                "en-IN"
              ) ?? "—"
            }`}
          />

          <DetailRow
            label="Passengers"
            value={booking.passengerCount ?? "—"}
          />

          <DetailRow
            label="Booked At"
            value={formatDate(booking.bookedAt)}
          />

          {/* Seats */}
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-1.5">
              Seat Numbers
            </p>

            <div className="flex flex-wrap gap-2">
              {Array.isArray(booking.seatNumbers) &&
              booking.seatNumbers.length > 0 ? (
                booking.seatNumbers.map((seat) => (
                  <span
                    key={seat}
                    className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm font-semibold"
                  >
                    {seat}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="col-span-2 flex flex-col items-center mt-6">
            <p className="text-xs text-gray-400 mb-3">
              Scan Ticket
            </p>

            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <QRCodeCanvas
                value={[
  `PNR       : ${booking.pnr ?? "—"}`,
  `Booking ID: ${booking.bookingId ?? "—"}`,
  `From      : ${booking.fromStationName ?? "—"}`,
  `To        : ${booking.toStationName ?? "—"}`,
  `Date      : ${formatDate(booking.journeyDate)}`,
  `Departure : ${formatTime(booking.departureTime)}`,
  `Seats     : ${(booking.seatNumbers ?? []).join(", ") || "—"}`,
  `Passengers: ${booking.passengerCount ?? "—"}`,
  `Bus Type  : ${booking.busTypeName ?? "—"}`,
  `Amount    : Rs.${booking.totalAmountPaid?.toLocaleString("en-IN") ?? "—"}`,
  `Status    : ${STATUS_META[booking.bookingStatus]?.label ?? booking.bookingStatus}`,
].join("\n")}
                size={140}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#0F3D2E"
              />
            </div>

            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Show this QR during ticket verification
            </p>
          </div>

          {/* Cancelled Info */}
          {isCancelled && (
            <>
              {booking.cancelledAt && (
                <DetailRow
                  label="Cancelled At"
                  value={formatDate(booking.cancelledAt)}
                />
              )}

              {booking.cancellationReason && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">
                    Cancellation Reason
                  </p>

                  <p className="font-medium text-red-600">
                    {booking.cancellationReason}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isCancelled && (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-600 transition font-medium"
          >
            <FiDownload />
            Download e-Ticket
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Detail Row Component
// ─────────────────────────────────────────────
function DetailRow({
  label,
  value,
  mono = false,
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">
        {label}
      </p>

      <p
        className={`font-semibold text-gray-800 break-all ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}