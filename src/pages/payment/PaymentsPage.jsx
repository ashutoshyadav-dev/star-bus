import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { paymentApi } from '../../api/booking'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BookingSearchCombobox from '../../components/common/BookingSearchCombobox'

/* ── Status badge ── */
function PaymentStatusBadge({ status }) {
  const map = {
    SUCCESS:            'bg-green-50 text-green-800',
    INITIATED:          'bg-yellow-50 text-yellow-800',
    PENDING:            'bg-yellow-50 text-yellow-800',
    FAILED:             'bg-red-50 text-red-800',
    REFUNDED:           'bg-blue-50 text-blue-800',
    PARTIALLY_REFUNDED: 'bg-blue-50 text-blue-800',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

/* ── Info tile ── */
function Tile({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-[11px] text-gray-400 mb-1.5">{label}</p>
      <p className="text-sm font-medium font-mono text-gray-800 break-all">
        {value ?? '—'}
      </p>
    </div>
  )
}

/* ── Page ── */
export default function PaymentsPage() {
  const navigate = useNavigate()
  const [bookingId, setBookingId] = useState(null)

  useEffect(() => {
    document.title = "Payment | APSTS Admin Portal";
  }, []);

 const {
  data: paymentData,
  isLoading,
  isError,
} = useQuery(
  ['payment', bookingId],
  () => {
    return paymentApi.getByBookingId(bookingId)
  },
  { enabled: !!bookingId, retry: false }
)



  const payment = paymentData?.data?.data
  const fmt = (ts) => ts ? format(new Date(ts), 'dd MMM yyyy HH:mm') : '—'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-blue-600 mb-5 hover:underline"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Search card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible mb-4">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-800">Payments</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Search by passenger name or PNR — select a booking to load its payment
            </p>
          </div>
          <div className="p-6">
            <BookingSearchCombobox
              className="max-w-lg"
              onSelect={(booking) => {
  console.log('onSelect received:', booking)           
  console.log('bookingId being set:', booking?.bookingId)  
  setBookingId(booking?.bookingId ?? null)
}}
            />
          </div>
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="text-sm text-gray-400 animate-pulse">Loading payment…</span>
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-center text-gray-400 py-12">No payment found for this booking.</p>
        )}

        {/* Payment detail */}
        {payment && !isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Payment ID</p>
                <p className="font-mono text-sm text-gray-700 mt-0.5">{payment.paymentId}</p>
              </div>
              <PaymentStatusBadge status={payment.paymentStatus} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-6">
              <Tile label="Amount"        value={`₹${payment.amount?.toLocaleString('en-IN')}`} />
              <Tile label="Method"        value={payment.paymentMethod} />
              <Tile label="Gateway"       value={payment.gatewayName} />
              <Tile label="Gateway order" value={payment.gatewayOrderId} />
              <Tile label="Gateway pay"   value={payment.gatewayPaymentId} />
              <Tile label="UPI Tx ID"     value={payment.upiTransactionId} />
              <Tile label="Bank ref"      value={payment.bankRefNumber} />
              <Tile label="Initiated at"  value={fmt(payment.initiatedAt)} />
              <Tile label="Completed at"  value={fmt(payment.completedAt)} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
