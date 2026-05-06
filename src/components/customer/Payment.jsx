import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaCreditCard, FaUniversity, FaWallet } from "react-icons/fa";
import { SiGooglepay } from "react-icons/si";

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    bus_id,
    from_station_id,
    to_station_id,
    journey_date,
    selectedSeats = [],
    passengers = [],
    total_amount = 0,
  } = state || {};

  const [method, setMethod] = useState("UPI");

  const handlePayment = () => {
    navigate("/ticket-confirmation", {
      state: {
        bus_id,
        from_station_id,
        to_station_id,
        journey_date,
        selectedSeats,
        passengers,
        total_amount,
        payment_method: method,
        pnr: "APS" + Math.floor(Math.random() * 1000000),
      },
    });
  };

  return (
    <div className="">
      <div className="mb-6">
        <h2 className=" text-xl font-bold text-gray-800">
          Itanagar → Guwahati
        </h2>
        <p className="text-sm text-gray-500">
          {journey_date}  Volvo AC Sleeper
        </p>
      </div>

      <div className="flex justify-center bg-gray-100 min-h-screen">

        <div className=" rounded-xl w-full max-w-5xl">

          <div className="grid grid-cols-2 gap-6">

            {/* LEFT : TRIP SUMMARY */}
            <div className=" bg-white rounded-xl shadow-lg rounded-lg p-5">

              <h2 className="font-semibold text-lg mb-4">
                Trip Summary
              </h2>

              <p className="text-gray-700 font-medium mb-2">
                Itanagar → Guwahati
              </p>

              <p className="text-sm text-gray-500 mb-4">
                {journey_date} • 08:00 PM
              </p>

              <div className="flex justify-between text-sm mb-3">
                <span>Seats</span>
                <span className="font-medium">
                  {selectedSeats.join(", ")}
                </span>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <span>Passengers</span>
                <span>{passengers.length}</span>
              </div>

              <hr className="mb-4 text-gray-300" />

              <p className="font-semibold mb-2">Fare Details</p>

              <div className="flex justify-between text-sm mb-2">
                <span>Ticket Fare</span>
                <span>₹{total_amount - 200}</span>
              </div>

              <div className="flex justify-between text-sm mb-3">
                <span>Taxes</span>
                <span>₹200</span>
              </div>

              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount</span>
                <span>₹{total_amount}</span>
              </div>
            </div>

            {/* RIGHT : PAYMENT METHODS */}

            <div className=" bg-white rounded-xl shadow-lg rounded-lg p-5">

              <h2 className="font-semibold text-lg mb-4">
                Select Payment Method
              </h2>

              <div className="space-y-3">

                {/* UPI */}

                <label className="flex items-center gap-3 border border-gray-300 p-3 rounded-lg cursor-pointer hover:bg-gray-50">

                  <input
                    type="radio"
                    checked={method === "UPI"}
                    onChange={() => setMethod("UPI")}
                  />

                  <SiGooglepay size={24} className="text-green-600" />

                  <div>
                    <p className="font-medium">UPI</p>
                    <p className="text-xs text-gray-500">
                      Pay using any UPI app
                    </p>
                  </div>

                </label>

                {/* CARD */}

                <label className="flex items-center gap-3 border border-gray-300 p-3 rounded-lg cursor-pointer hover:bg-gray-50">

                  <input
                    type="radio"
                    checked={method === "Card"}
                    onChange={() => setMethod("Card")}
                  />

                  <FaCreditCard size={20} />

                  <div>
                    <p className="font-medium">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500">
                      Visa, Mastercard, Rupay
                    </p>
                  </div>

                </label>

                {/* NET BANKING */}

                <label className="flex items-center gap-3 border border-gray-300 p-3 rounded-lg cursor-pointer hover:bg-gray-50">

                  <input
                    type="radio"
                    checked={method === "NetBanking"}
                    onChange={() => setMethod("NetBanking")}
                  />

                  <FaUniversity size={20} />

                  <div>
                    <p className="font-medium">Net Banking</p>
                    <p className="text-xs text-gray-500">
                      All major banks supported
                    </p>
                  </div>

                </label>

                {/* WALLET */}

                <label className="flex items-center gap-3 border border-gray-300 p-3 rounded-lg cursor-pointer hover:bg-gray-50">

                  <input
                    type="radio"
                    checked={method === "Wallet"}
                    onChange={() => setMethod("Wallet")}
                  />

                  <FaWallet size={20} />

                  <div>
                    <p className="font-medium">Wallets</p>
                    <p className="text-xs text-gray-500">
                      Paytm, PhonePe, Amazon Pay
                    </p>
                  </div>

                </label>

              </div>

            </div>

          </div>

          {/* PAY BUTTON */}
          <button
            onClick={handlePayment}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg"
          >
            Pay ₹{total_amount}
          </button>

        </div>
      </div>
    </div>
  );
}