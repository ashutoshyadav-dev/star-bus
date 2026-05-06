import { useState } from 'react'
import { useQuery } from 'react-query'
import { paymentApi } from '../../api/booking'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'

function PaymentStatusBadge({ status }) {
  const map = {
    SUCCESS: 'badge-green', INITIATED: 'badge-yellow', PENDING: 'badge-yellow',
    FAILED: 'badge-red', REFUNDED: 'badge-blue', PARTIALLY_REFUNDED: 'badge-blue',
  }
  return <span className={map[status] ?? 'badge-gray'}>{status}</span>
}

export default function PaymentsPage() {
  const [bookingId, setBookingId]   = useState('')
  const [searchId, setSearchId]     = useState('')

  const { data, isLoading, isError } = useQuery(
    ['payment', searchId],
    () => paymentApi.getByBookingId(searchId),
    { enabled: !!searchId, retry: false }
  )
  const payment = data?.data?.data

  return (
    <div>
      <PageHeader title="Payments" subtitle="Look up payment details by booking ID" />

      <div className="card p-5 mb-4">
        <p className="text-xs text-surface-400 mb-3">Search by Booking ID</p>
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input className="input pl-9 font-mono text-xs" placeholder="Booking UUID"
              value={bookingId} onChange={e => setBookingId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchId(bookingId)} />
          </div>
          <button className="btn-primary" onClick={() => setSearchId(bookingId)}>Look Up</button>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
      {isError   && <p className="text-center text-surface-500 py-12">Payment not found for this booking ID.</p>}

      {payment && (
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs text-surface-400">Payment ID</p>
              <p className="font-mono text-sm text-surface-200 mt-0.5">{payment.paymentId}</p>
            </div>
            <PaymentStatusBadge status={payment.paymentStatus} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              ['Amount',       `₹${payment.amount}`],
              ['Method',       payment.paymentMethod],
              ['Gateway',      payment.gatewayName ?? '—'],
              ['Gateway Order',payment.gatewayOrderId ?? '—'],
              ['Gateway Pay',  payment.gatewayPaymentId ?? '—'],
              ['UPI Tx ID',    payment.upiTransactionId ?? '—'],
              ['Bank Ref',     payment.bankRefNumber ?? '—'],
              ['Initiated At', payment.initiatedAt ? format(new Date(payment.initiatedAt), 'dd MMM yyyy HH:mm') : '—'],
              ['Completed At', payment.completedAt ? format(new Date(payment.completedAt), 'dd MMM yyyy HH:mm') : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-surface-400">{k}</p>
                <p className="text-sm text-surface-200 font-mono mt-0.5 break-all">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
