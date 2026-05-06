import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { refundApi } from '../../api/booking'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { CheckCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'

function RefundStatusBadge({ status }) {
  const map = { PENDING: 'badge-yellow', PROCESSING: 'badge-blue', COMPLETED: 'badge-green', FAILED: 'badge-red' }
  return <span className={map[status] ?? 'badge-gray'}>{status}</span>
}

const REFUND_METHODS = ['ORIGINAL_SOURCE','WALLET_CREDIT','BANK_TRANSFER','CHEQUE']

export default function RefundsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [processForm, setProcessForm] = useState({ refundId: '', refundMethod: 'ORIGINAL_SOURCE', gatewayRefundId: '' })

  const { data, isLoading } = useQuery('pending-refunds', refundApi.getPending)
  const refunds = data?.data?.data ?? []

  const processMut = useMutation(d => refundApi.process(d), {
    onSuccess: () => {
      toast.success('Refund processed')
      setSelected(null)
      qc.invalidateQueries('pending-refunds')
    }
  })

  const columns = [
    { key: 'refundId',         label: 'Refund ID',  render: r => <span className="font-mono text-xs">{r.refundId?.slice(0,8)}…</span> },
    { key: 'bookingId',        label: 'Booking',    render: r => <span className="font-mono text-xs">{r.bookingId?.slice(0,8)}…</span> },
    { key: 'cancellationTier', label: 'Tier',       render: r => <span className="badge-blue text-xs">{r.cancellationTier?.replace(/_/g,' ')}</span> },
    { key: 'refundAmount',     label: 'Amount',     render: r => <span className="text-emerald-400 font-medium">₹{r.refundAmount}</span> },
    { key: 'refundMethod',     label: 'Method',     render: r => r.refundMethod ?? '—' },
    { key: 'refundStatus',     label: 'Status',     render: r => <RefundStatusBadge status={r.refundStatus} /> },
    { key: 'initiatedAt',      label: 'Initiated',  render: r => r.initiatedAt ? format(new Date(r.initiatedAt), 'dd MMM HH:mm') : '—' },
    {
      key: 'action', label: '',
      render: r => r.refundStatus === 'PENDING' && (
        <button onClick={e => { e.stopPropagation(); setSelected(r); setProcessForm(p => ({ ...p, refundId: r.refundId })) }}
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
          <CheckCircle className="w-3.5 h-3.5" /> Process
        </button>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="Refunds" subtitle="Process pending passenger refunds" />

      <div className="card">
        <div className="px-4 py-3 border-b border-surface-700 flex items-center justify-between">
          <h2 className="text-sm font-medium text-surface-200">Pending Refunds</h2>
          <span className="badge-yellow">{refunds.length} pending</span>
        </div>
        <Table columns={columns} data={refunds} loading={isLoading} emptyText="No pending refunds" />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Process Refund">
        {selected && (
          <div className="space-y-4">
            <div className="bg-surface-900 rounded-lg p-4 space-y-2 text-sm">
              {[
                ['Refund Amount', `₹${selected.refundAmount}`],
                ['Tier',         selected.cancellationTier],
                ['Deduction',    `₹${selected.deductionAmount}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-surface-400">{k}</span>
                  <span className="text-surface-200 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1.5">Refund Method</label>
              <select className="input" value={processForm.refundMethod}
                onChange={e => setProcessForm(p => ({ ...p, refundMethod: e.target.value }))}>
                {REFUND_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1.5">Gateway Refund ID (optional)</label>
              <input className="input font-mono text-xs" placeholder="Gateway refund reference"
                value={processForm.gatewayRefundId}
                onChange={e => setProcessForm(p => ({ ...p, gatewayRefundId: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => processMut.mutate(processForm)} disabled={processMut.isLoading}
                className="btn-primary flex-1 flex justify-center">
                {processMut.isLoading ? <Spinner size="sm" /> : 'Process Refund'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
