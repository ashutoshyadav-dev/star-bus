import { useState } from "react";
import sideBg from "../../assets/side-bg.jpeg";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
const SeatIcon = ({ number, type, onClick }) => {

  const colors = {
    selected: "#3b82f6",
    female: "#a855f7",
    conductor: "#facc15",
    booked: "#6b7280",
    available: "transparent"
  };

  const border = type === "available" ? "#94a3b8" : colors[type];

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center ${
        type === "booked" ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <svg width="34" height="34" viewBox="0 0 24 24">
        <rect x="6" y="2" width="12" height="5" rx="2"
          fill={colors[type]} stroke={border} strokeWidth="1.5" />
        <rect x="4" y="7" width="16" height="13" rx="3"
          fill={colors[type]} stroke={border} strokeWidth="1.5" />
      </svg>

      <span className="text-[10px] mt-1">{number}</span>
    </div>
  );
};
function SeatSelection() {
  
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({});
  const [step, setStep] = useState(2);
  const ticketRef = useRef();
const [showOtpModal, setShowOtpModal] = useState(false);
  const seats = Array.from({ length: 32 }, (_, i) => i + 1);

  const handleSeatClick = (seatNo) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNo)
        ? prev.filter((s) => s !== seatNo)
        : [...prev, seatNo]
    );
  };
   const downloadTicket = async () => {
  const element = ticketRef.current;

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF();
  pdf.addImage(imgData, "PNG", 10, 10, 180, 100);
  pdf.save("bus-ticket.pdf");
};

  // 🎯 SEAT TYPE
  const getSeatType = (seat) => {
    if (selectedSeats.includes(seat)) return "selected";
    if ([5, 6, 9, 10, 13, 14].includes(seat)) return "female";
    if (seat === 1) return "conductor";
    if ([2, 3, 4].includes(seat)) return "booked";
    return "available";
  };

  const getSeatStyle = (type) => {
    switch (type) {
      case "selected":
        return "bg-blue-500 border-blue-500 text-white";
      case "female":
        return "bg-purple-500 border-purple-500 text-white";
      case "conductor":
        return "bg-yellow-400 border-yellow-400 text-black";
      case "booked":
        return "bg-gray-500 border-gray-500 text-white cursor-not-allowed";
      default:
        return "border-white/40 text-white hover:bg-white/10";
    }
  };
const farePerSeat = 780;
const totalFare = selectedSeats.length * farePerSeat;
const progressWidth = ((step - 1) / 4) * 100;
  return (
   <div className="w-full text-white bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 pt-10 pb-4">

      {/* 🔝 PROGRESS */}
      <div className="p-4 mb-6 mt-10 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">
        <div className="relative flex items-center justify-between">
          <div className="absolute w-full h-[2px] bg-white/20 top-4"></div>
         <div
  className="absolute h-[2px] bg-green-400 top-4 transition-all duration-500"
  style={{ width: `${progressWidth}%` }}
></div>

          {["Search", "Seat Selection", "Confirmation", "Payment", "Finish"].map((s, i) => (
            <div key={i} className="z-10 text-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center
                ${i <= step-1 ? "bg-green-400" : "bg-white/20"}`}>
                {i + 1}
              </div>
              <p className={`text-xs mt-1 ${i === step-1 && "text-green-400"}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">

        {/* LEFT PANEL */}
       <div className="relative w-[260px] rounded-xl overflow-hidden border border-white/20">

  {/* BACKGROUND IMAGE */}
  <div
    className="absolute inset-0 bg-center bg-cover"
    style={{ backgroundImage: `url(${sideBg})` }}
  ></div>

  {/* DARK + BLUR OVERLAY (IMPORTANT FIX) */}
  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

  {/* CONTENT */}
  <div className="relative z-10 p-5">

    <h3 className="mb-4 font-semibold text-green-300">
      You are booking for
    </h3>

    <p className="text-sm text-gray-300">Source</p>
    <p className="font-semibold">ITANAGAR</p>

    <p className="mt-3 text-sm text-gray-300">Destination</p>
    <p className="font-semibold">GUWAHATI</p>

    <p className="mt-3 text-sm text-gray-300">Service</p>
    <p className="font-semibold">146F147 | VOLVO</p>

    <p className="mt-3 text-sm text-gray-300">Journey Date</p>
    <p className="font-semibold">27/04/2026 06:00 AM</p>

  </div>
</div>
        {/* SEAT SECTION */}
        <div className="flex justify-center w-[400px]">

          <div className="relative p-5 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">

            {/* DRIVER */}
            <div className="absolute text-xl text-yellow-400 top-2 right-3">🛞</div>

            {/* GRID */}
           <div className="grid grid-cols-5 gap-4 mt-4">

  {seats.map((seat, index) => {

    if ((index + 1) % 5 === 3) {
      return <div key={index}></div>; // aisle gap
    }

    const type = getSeatType(seat);

    return (
      <SeatIcon
        key={seat}
        number={seat}
        type={type}
        onClick={() => type !== "booked" && handleSeatClick(seat)}
      />
    );
  })}

</div>

            {/* LEGEND */}
            <div className="flex justify-between mt-6 text-xs">

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Booked</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Selected</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-white rounded"></div>
                <span>Available</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span>Female</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Conductor</span>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 p-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-xl">

          {step === 2 && (
            selectedSeats.length === 0 ? (
              <h2 className="mt-20 text-xl text-center text-gray-400">
                Click on a seat to proceed
              </h2>
            ) : (
              <>
                <table className="w-full text-sm border border-white/20">
                  <thead>
                    <tr className="bg-white/10">
                      <th className="p-2">Seat</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Gender</th>
                      <th className="p-2">Age</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedSeats.map((seat) => (
                      <tr key={seat}>
                        <td className="p-2">{seat}</td>
                        <td className="p-2">
                         <input
  value={passengerDetails[seat]?.name || ""}
  onChange={(e) =>
    setPassengerDetails({
      ...passengerDetails,
      [seat]: {
        ...passengerDetails[seat],
        name: e.target.value
      }
    })
  }
  className="w-full px-2 py-1 border rounded bg-white/10 border-white/20"
/>
                        </td>
                        <td className="p-2">
    <select
  value={passengerDetails[seat]?.gender || ""}
  onChange={(e) =>
    setPassengerDetails({
      ...passengerDetails,
      [seat]: {
        ...passengerDetails[seat],
        gender: e.target.value
      }
    })
  }
  className="w-full text-white border rounded bg-white/20 border-white/30 backdrop-blur-md"
>
  <option value="" className="text-black bg-white">Select</option>
  <option value="Male" className="text-black bg-white">Male</option>
  <option value="Female" className="text-black bg-white">Female</option>
  <option value="Child" className="text-black bg-white">Child</option>
</select>
                          
                        </td>
                        <td className="p-2">
                          <input type="number" className="w-full px-2 py-1 border rounded bg-white/10 border-white/20" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end gap-4 mt-6">
                  <button onClick={() => setSelectedSeats([])} className="px-4 py-2 bg-red-500 rounded">
                    Cancel
                  </button>

                  <button onClick={() => setStep(3)} className="px-4 py-2 bg-green-500 rounded">
                    Proceed
                  </button>
                </div>
              </>
            )
          )}

          {step === 3 && (
            <>
              <p className="mb-4 text-sm text-gray-300">
                Enter mobile & email for verification
              </p>

              <div className="flex gap-4 mb-6">
                <input placeholder="Mobile No" className="bg-white/10 border border-white/20 px-3 py-2 rounded w-[250px]" />
                <input placeholder="Email" className="bg-white/10 border border-white/20 px-3 py-2 rounded w-[250px]" />
              </div>

              <div className="flex justify-end gap-4">
                <button onClick={() => setStep(2)} className="px-4 py-2 bg-red-500 rounded">
                  Back
                </button>

              <button 
  onClick={() => setShowOtpModal(true)}
  className="px-4 py-2 bg-green-500 rounded"
>
  Proceed
</button>
              </div>
            </>
          )}

          {step === 4 && (
  <div>

    <h2 className="mb-4 text-lg font-semibold text-green-400">
      Select Payment Method
    </h2>

    <div className="grid grid-cols-3 gap-4">

  {/* CARD */}
  <div
    onClick={() => setPaymentMethod("Card")}
    className={`p-4 border rounded cursor-pointer ${
      paymentMethod === "Card" ? "bg-green-500/30 border-green-400" : "bg-white/10 border-white/20"
    }`}
  >
    💳 Card Payment
  </div>

  {/* UPI */}
  <div
    onClick={() => setPaymentMethod("UPI")}
    className={`p-4 border rounded cursor-pointer ${
      paymentMethod === "UPI" ? "bg-green-500/30 border-green-400" : "bg-white/10 border-white/20"
    }`}
  >
    📱 UPI
  </div>

  {/* NET BANKING */}
  <div
    onClick={() => setPaymentMethod("Net Banking")}
    className={`p-4 border rounded cursor-pointer ${
      paymentMethod === "Net Banking" ? "bg-green-500/30 border-green-400" : "bg-white/10 border-white/20"
    }`}
  >
    🏦 Net Banking
  </div>

</div>

    <div className="flex justify-end gap-4 mt-6">

      <button
        onClick={() => setStep(3)}
        className="px-4 py-2 bg-red-500 rounded"
      >
        Back
      </button>

      <button
      onClick={() => {
  if (!paymentMethod) {
    alert("Please select payment method");
    return;
  }
  setStep(5);
}}
        className="px-4 py-2 bg-green-500 rounded"
      >
        Pay Now
      </button>

    </div>

  </div>
)}
{step === 5 && (
  <div className="text-center">

    {/* 🎟 TICKET DESIGN */}
 <div
  ref={ticketRef}
  className="max-w-md mx-auto mt-6 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white border border-white/20"
>

  <div className="py-3 text-lg font-semibold text-center bg-green-500">
    🎟 Bus Ticket
  </div>

  <div className="p-5 space-y-3">

    <div className="flex justify-between">
      <span>Route</span>
      <span>ITANAGAR → GUWAHATI</span>
    </div>

    {/* PASSENGERS */}
    <div>
      <span className="text-gray-300">Passengers:</span>

      {selectedSeats.map((seat) => (
        <div key={seat} className="flex justify-between mt-1 text-sm">
          <span>
            {passengerDetails[seat]?.name || "N/A"} ({passengerDetails[seat]?.gender || "N/A"})
          </span>
          <span>Seat {seat}</span>
        </div>
      ))}
    </div>

    <div className="flex justify-between">
      <span>Date</span>
      <span>27/04/2026</span>
    </div>

    <div className="flex justify-between">
      <span>Total Fare</span>
      <span className="text-green-400">₹{totalFare}</span>
    </div>

    <div className="flex justify-between">
      <span>Payment</span>
      <span>{paymentMethod}</span>
    </div>

    {/* QR CODE */}
    <div className="flex justify-center mt-4">
      <QRCodeCanvas
        value={`Seats: ${selectedSeats.join(", ")} | Amount: ₹${totalFare}`}
        size={80}
      />
    </div>

    <p className="text-sm text-center text-gray-300">
      Thank you for booking 🚍
    </p>

  </div>
</div>
    {/* ⬇ DOWNLOAD BUTTON */}
    <button
      onClick={downloadTicket}
      className="px-5 py-2 mt-6 text-white bg-green-500 rounded"
    >
      Download Ticket
    </button>

  </div>
)}
        </div>

      </div>
      {showOtpModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

    <div className="w-[600px] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-6 rounded-xl border border-white/20">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-green-400">
          Mobile No. Verification
        </h2>

        <button
          onClick={() => setShowOtpModal(false)}
          className="text-xl text-white"
        >
          ✕
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-300">
        Please enter the 6 digit OTP sent to Mobile No.
        <br />
        <span className="text-green-400">( XXXXXXX576 )</span>
      </p>

      {/* INPUTS */}
      <div className="grid grid-cols-2 gap-4">

        <input
          placeholder="Enter Name"
          className="px-3 py-2 border rounded bg-white/10 border-white/20"
        />

        <input
          placeholder="Enter OTP"
          className="px-3 py-2 border rounded bg-white/10 border-white/20"
        />

        <input
          placeholder="Enter Text"
          className="col-span-1 px-3 py-2 border rounded bg-white/10 border-white/20"
        />

        {/* CAPTCHA BOX */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 text-sm text-black bg-white rounded">
            752161
          </div>

          <button className="px-2 py-2 rounded bg-white/10">⟳</button>
        </div>

      </div>

      {/* BUTTONS */}
      <div className="flex items-center justify-between mt-6">

        <button
          onClick={() => setShowOtpModal(false)}
          className="text-gray-300"
        >
          Cancel
        </button>

      <button
  onClick={() => {
    setShowOtpModal(false);
    setStep(4);
  }}
  className="px-5 py-2 bg-green-500 rounded"
>
  ✔ Verify & Proceed
</button>

      </div>

    </div>
  </div>
)}
    </div>
  );
}

export default SeatSelection;