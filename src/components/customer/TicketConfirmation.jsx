import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

export default function TicketConfirmation() {

  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    pnr = "APS123456",
  } = state || {};

  return (

    <div className="flex justify-center items-center h-[calc(100vh-70px)] bg-gray-100">

      <div className=" rounded-xl p-10 text-center w-full max-w-lg">

        {/* SUCCESS ICON */}

        <div className="flex justify-center mb-4">
          <FaCheckCircle size={50} className="text-green-500"/>
        </div>

        {/* TITLE */}

        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Booking Confirmed! 
        </h2>

        <p className="text-gray-500 mb-6">
          Your ticket has been booked successfully.
        </p>

        {/* PNR BOX */}

        <div className="bg-gray-100 shadow bg-white rounded-lg p-6 mb-6">

          <p className="text-sm text-gray-500 mb-1">
            PNR Number
          </p>

          <p className="text-2xl font-bold tracking-widest">
            {pnr}
          </p>

        </div>

        {/* MESSAGE */}

        <p className="text-sm text-gray-500 mb-8">
          A ticket has been sent to your mobile number  
          <br/>
          <span className="font-medium">
            9876543210
          </span> and email  
          <span className="font-medium">
            aneeka@gmail.com
          </span>
        </p>

        {/* BUTTONS */}

        <div className="flex justify-center gap-4">

          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            View Ticket
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-green-900 hover:bg-green-950 text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Home
          </button>

        </div>

      </div>

    </div>
  );
}