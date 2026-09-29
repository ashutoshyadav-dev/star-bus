import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { counterApi } from "../../api/counter";
import Spinner from "../../components/common/Spinner";

export default function CounterMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    counterApi.getMyBookings()
      .then((res) => setBookings(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load your bookings"))
      .finally(() => setLoading(false));
  }, []);

  const cashTotal = bookings
    .filter((b) => b.payment?.paymentMethod === "CASH_COUNTER" && b.payment?.paymentStatus === "SUCCESS")
    .reduce((sum, b) => sum + Number(b.totalAmountPaid ?? 0), 0);

  const upiTotal = bookings
    .filter((b) => b.payment?.paymentMethod === "UPI_COUNTER" && b.payment?.paymentStatus === "SUCCESS")
    .reduce((sum, b) => sum + Number(b.totalAmountPaid ?? 0), 0);

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Bookings</h1>
        <Link to="/counter/book" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700">
          + New Booking
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">Cash collected</div>
          <div className="text-2xl font-bold text-gray-800">₹{cashTotal.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase">UPI collected</div>
          <div className="text-2xl font-bold text-gray-800">₹{upiTotal.toFixed(2)}</div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center text-gray-400 py-16">No bookings yet today</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-w-3xl">
          {bookings.map((b) => (
            <div key={b.bookingId} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{b.pnr}</div>
                <div className="text-sm text-gray-500">{b.passengerCount} passenger(s) · ₹{b.totalAmountPaid}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-semibold uppercase ${
                  b.bookingStatus === "CONFIRMED" ? "text-green-600" : "text-orange-500"
                }`}>
                  {b.bookingStatus}
                </div>
                <div className="text-xs text-gray-400">{b.payment?.paymentMethod ?? "Payment pending"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}