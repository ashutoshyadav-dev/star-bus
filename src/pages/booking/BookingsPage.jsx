import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { bookingApi } from '../../api/booking'
import toast from 'react-hot-toast'
import { Search, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'

function BookingStatusBadge({ status }) {
  const map = {
    CONFIRMED:          'badge-green',
    PENDING_PAYMENT:    'badge-yellow',
    FULLY_CANCELLED:    'badge-red',
    PARTIALLY_CANCELLED:'badge-yellow',
    COMPLETED:          'badge-blue',
    NO_SHOW:            'badge-gray',
  }
  return <span className={map[status] ?? 'badge-gray'}>{status?.replace(/_/g,' ')}</span>
}

export default function BookingsPage() {
  const qc = useQueryClient()
  const [pnr, setPnr]           = useState('')
  const [searchedPnr, setSearchedPnr] = useState('')
  const [selected, setSelected] = useState(null)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading } = useQuery(
    ['booking-pnr', searchedPnr],
    () => bookingApi.getByPnr(searchedPnr),
    { enabled: !!searchedPnr, retry: false }
  )

  const booking = data?.data?.data

  const cancelMut = useMutation(
    () => bookingApi.adminCancel(selected?.bookingId, { cancellationReason: cancelReason }),
    {
      onSuccess: () => {
        toast.success('Booking cancelled')
        setShowCancel(false)
        qc.invalidateQueries(['booking-pnr', searchedPnr])
      }
    }
  )

  const columns = booking ? [
    { key: 'reservationId', label: 'Reservation ID', render: r => <span className="font-mono text-xs">{r.reservationId?.slice(0,8)}…</span> },
    { key: 'passengerName',  label: 'Passenger' },
    { key: 'passengerAge',   label: 'Age' },
    { key: 'seatId',         label: 'Seat' },
    { key: 'finalFare',      label: 'Fare', render: r => `₹${r.finalFare}` },
    { key: 'reservationStatus', label: 'Status', render: r => <BookingStatusBadge status={r.reservationStatus} /> },
  ] : []

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Search and manage passenger bookings" />

      {/* PNR Search */}
      <div className="card p-5 mb-4">
        <p className="text-xs text-surface-400 mb-3">Search booking by PNR</p>
        <div className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input className="input pl-9 font-mono uppercase tracking-widest" placeholder="AP12345678"
              value={pnr} onChange={e => setPnr(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && setSearchedPnr(pnr)} />
          </div>
          <button className="btn-primary" onClick={() => setSearchedPnr(pnr)}>Search</button>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}

      {booking && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-lg font-semibold font-mono text-primary-300">{booking.pnr}</p>
                <BookingStatusBadge status={booking.bookingStatus} />
              </div>
              {booking.bookingStatus === 'CONFIRMED' && (
                <button onClick={() => { setSelected(booking); setShowCancel(true) }}
                  className="btn-danger flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4" /> Cancel Booking
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ['Booked At', booking.bookedAt ? format(new Date(booking.bookedAt), 'dd MMM yyyy HH:mm') : '—'],
                ['Passengers', booking.passengerCount],
                ['Total Paid', `₹${booking.totalAmountPaid}`],
                ['Source', booking.bookingSource],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-surface-400">{k}</p>
                  <p className="text-surface-200 font-medium mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Passengers */}
          <div className="card">
            <div className="px-4 py-3 border-b border-surface-700">
              <h2 className="text-sm font-medium text-surface-200">Passengers</h2>
            </div>
            <Table columns={columns} data={booking.passengers} />
          </div>
        </div>
      )}

      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Booking">
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            Cancel booking <span className="font-mono text-primary-300">{selected?.pnr}</span>?
            Refund will be calculated per APSTS cancellation policy.
          </p>
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Reason (optional)</label>
            <textarea className="input h-20 resize-none" placeholder="Reason for cancellation..."
              value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCancel(false)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isLoading}
              className="btn-danger flex-1 flex justify-center">
              {cancelMut.isLoading ? <Spinner size="sm" /> : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
