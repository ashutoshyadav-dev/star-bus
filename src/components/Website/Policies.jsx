import banner from "../../assets/banner.png";
import Navbar from "../Website/Navbar";
import Breadcrumb from "../Website/Breadcrumb";
import {
  FaInfoCircle,
  FaMoneyBillWave,
  FaCheckCircle,
} from "react-icons/fa";

function CancellationPolicy() {
  return (
    <div className="w-full bg-[#f5f7fa] min-h-screen">
      <Navbar />

      {/* HERO */}
      <div className="relative h-[320px] flex items-center px-10 pt-20 text-white">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl font-bold">
            Cancellation <span className="text-green-400">Policy</span>
          </h1>

          <p className="mt-2 text-gray-200">
            Ticket cancellation, refund and rescheduling guidelines
          </p>
        </div>
      </div>

      <Breadcrumb title="Cancellation Policy" />

      <div className="max-w-6xl px-6 py-12 mx-auto">

        {/* NOTICE CARD */}
        <div className="p-6 mb-8 border-l-4 border-green-500 shadow-md bg-white rounded-2xl">
          <div className="flex items-start gap-4">
            <FaInfoCircle className="mt-1 text-3xl text-green-600" />

            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-800">
                Refund Information
              </h2>

              <p className="text-gray-600">
                Tickets booked online will be refunded to the respective
                Credit Card, Debit Card or Bank Account as per banking
                procedures. Refunds are not provided at APSTS ticket
                booking counters.
              </p>
            </div>
          </div>
        </div>

        {/* CANCELLATION CHARGES */}
        <div className="mb-8 overflow-hidden bg-white shadow-md rounded-2xl">
          <div className="flex items-center gap-3 px-6 py-4 text-white bg-green-600">
            <FaMoneyBillWave />
            <h2 className="text-lg font-semibold">
              Cancellation Charges
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">
                    Cancellation Period
                  </th>
                  <th className="px-6 py-4 text-left">
                    Deduction
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-t">
                  <td className="px-6 py-4">
                    Before 24 Hours of Departure
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    25%
                  </td>
                </tr>

                <tr className="border-t">
                  <td className="px-6 py-4">
                    Between 24 Hours and 2 Hours
                  </td>
                  <td className="px-6 py-4 font-semibold text-orange-500">
                    50%
                  </td>
                </tr>

                <tr className="border-t">
                  <td className="px-6 py-4">
                    Between 2 Hours and Departure Time
                  </td>
                  <td className="px-6 py-4 font-semibold text-red-500">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TERMS */}
        <div className="p-6 bg-white shadow-md rounded-2xl">
          <h2 className="mb-6 text-xl font-bold text-gray-800">
            Additional Terms & Conditions
          </h2>

          <div className="space-y-4">

            {[
              "Cancellation is not allowed after 2 hours before the scheduled departure time from the origin station.",
              "Reservation fee is non-refundable except when the service is completely cancelled by APSTS.",
              "No refund will be provided to No-Show passengers.",
              "Refunds are generally processed within one month after ticket cancellation.",
              "Passengers may contact the helpline if refunds are delayed beyond one month.",
              "Payment Gateway charges are non-refundable for cancellations and failed transactions.",
              "Partial cancellation is allowed and standard cancellation charges will apply.",
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3"
              >
                <FaCheckCircle className="mt-1 text-green-500" />
                <p className="text-gray-600">{item}</p>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}

export default CancellationPolicy;