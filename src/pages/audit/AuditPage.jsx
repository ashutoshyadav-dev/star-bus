import { useState } from 'react'
import { useQuery } from 'react-query'
import { auditApi } from '../../api/audit'
import { format } from 'date-fns'
import { Filter } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'

const EVENT_TYPES = [
  'LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','REGISTER',
  'BOOKING_CREATED','BOOKING_CONFIRMED','BOOKING_CANCELLED',
  'PAYMENT_INITIATED','PAYMENT_WEBHOOK_RECEIVED',
  'REFUND_INITIATED','REFUND_PROCESSED','REFUND_COMPLETED',
  'WALLET_TOPUP','USER_SUSPENDED','USER_ACTIVATED',
]

export default function AuditPage() {
  const [page, setPage]       = useState(0)
  const [eventType, setType]  = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery(
    ['audit', page, eventType],
    () => auditApi.getAll({ page, size: 50, eventType: eventType || undefined }),
    { keepPreviousData: true }
  )

  const logs       = data?.data?.data?.content ?? []
  const totalPages = data?.data?.data?.totalPages ?? 1

  const columns = [
    { key: 'createdAt',  label: 'Time',    render: r => <span className="font-mono text-xs text-surface-400">{r.createdAt ? format(new Date(r.createdAt), 'dd MMM HH:mm:ss') : '—'}</span> },
    { key: 'eventType',  label: 'Event',   render: r => <span className="font-mono text-xs text-primary-300">{r.eventType}</span> },
    { key: 'userId',     label: 'User',    render: r => <span className="font-mono text-xs truncate max-w-[120px] block">{r.userId ?? 'anonymous'}</span> },
    { key: 'ipAddress',  label: 'IP',      render: r => <span className="font-mono text-xs text-surface-400">{r.ipAddress ?? '—'}</span> },
    { key: 'metadata',   label: 'Meta',    render: r => r.metadata ? <span className="badge-gray">has data</span> : '—' },
  ]

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Track all system events and user actions" />

      <div className="card">
        <div className="p-4 border-b border-surface-700 flex items-center gap-3">
          <Filter className="w-4 h-4 text-surface-400" />
          <select className="input max-w-xs" value={eventType} onChange={e => { setType(e.target.value); setPage(0) }}>
            <option value="">All events</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Table columns={columns} data={logs} loading={isLoading} onRowClick={setSelected} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Audit Event Detail" size="lg">
        {selected && (
          <div className="space-y-3 text-sm">
            {[
              ['Event',      selected.eventType],
              ['User ID',    selected.userId ?? 'anonymous'],
              ['IP Address', selected.ipAddress ?? '—'],
              ['User Agent', selected.userAgent ?? '—'],
              ['Time',       selected.createdAt ? format(new Date(selected.createdAt), 'dd MMM yyyy, HH:mm:ss') : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-surface-700/50 gap-4">
                <span className="text-surface-400 flex-shrink-0">{k}</span>
                <span className="text-surface-200 font-mono text-xs text-right break-all">{v}</span>
              </div>
            ))}
            {selected.metadata && (
              <div>
                <p className="text-surface-400 mb-2">Metadata</p>
                <pre className="bg-surface-900 rounded-lg p-3 text-xs text-surface-300 overflow-x-auto">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
