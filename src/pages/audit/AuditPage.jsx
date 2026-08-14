import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { auditApi } from '../../api/audit'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  Activity,
  Shield,
  Globe,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react'

const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',

  'OTP_SENT',
  'OTP_VERIFIED',
  'OTP_FAILED',

  'TOKEN_REFRESHED',
  'PASSWORD_CHANGED',
  'PROFILE_UPDATED',

  'ROLE_ASSIGNED',

  'ACCOUNT_LOCKED',
  'ACCOUNT_SUSPENDED',

  'DEPOT_CREATED',
  'DEPOT_UPDATED',

  'STATION_CREATED',
  'STATION_UPDATED',

  'ROUTE_CREATED',
  'ROUTE_UPDATED',
  'ROUTE_SUSPENDED',

  'FARE_CREATED',
  'FARE_UPDATED',

  'BOOKING_CREATED',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',

  'PAYMENT_INITIATED',
  'PAYMENT_WEBHOOK_RECEIVED',

  'REFUND_INITIATED',
  'REFUND_PROCESSED',
  'REFUND_COMPLETED',

  'WALLET_TOPUP',

  'BUS_TYPE_CREATED',
  'BUS_TYPE_UPDATED',
  'BUS_TYPE_DEACTIVATED',

  'BUS_CREATED',
  'BUS_UPDATED',
  'BUS_STATUS_CHANGED',
  'BUS_DEACTIVATED',

  'BUS_SEAT_CREATED',
  'BUS_SEAT_UPDATED',
  'BUS_SEAT_DEACTIVATED',
  'BUS_SEATS_BULK_CREATED',

  'MAINTENANCE_RECORD_CREATED',
  'MAINTENANCE_RECORD_UPDATED',
  'MAINTENANCE_COMPLETED',

  'SCHEDULE_CREATED',
  'SCHEDULE_STATUS_UPDATED',
  'SCHEDULE_BOOKING_TOGGLED',

  'SEAT_INVENTORY_INITIALISED',
  'SEAT_LOCKED',
  'SEAT_BOOKED',
  'SEAT_RELEASED',

  'DUTY_ASSIGNED',
  'DUTY_UNASSIGNED',
  'DUTY_CHECK_IN',
  'DUTY_CHECK_OUT',
]

const inputCls = `
  h-10 px-3 text-sm text-slate-700 bg-white border border-slate-200
  rounded-xl outline-none transition-all
  focus:border-blue-400 focus:ring-4 focus:ring-blue-100
  placeholder:text-slate-300
`

function EventBadge({ type }) {
  const styles = {
    LOGIN_SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    LOGIN_FAILED: 'bg-red-50 text-red-700 border-red-200',
    PAYMENT_INITIATED: 'bg-amber-50 text-amber-700 border-amber-200',
    BOOKING_CREATED: 'bg-blue-50 text-blue-700 border-blue-200',
    BOOKING_CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    REFUND_COMPLETED: 'bg-violet-50 text-violet-700 border-violet-200',
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold tracking-wide ${
        styles[type] ??
        'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {type}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Activity className="w-6 h-6 text-slate-400" />
      </div>

      <h3 className="text-sm font-semibold text-slate-700">
        No audit logs found
      </h3>

      <p className="text-xs text-slate-400 mt-1">
        Try changing filters or wait for new system activity
      </p>
    </div>
  )
}

export default function AuditPage() {
  const [page, setPage] = useState(0)
  const [eventType, setEventType] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

   useEffect(() => {
    document.title = "Audit Page | APSTS Admin Portal";
  }, []);

  const { data, isLoading } = useQuery(
    ['audit', page, eventType],
    () =>
      auditApi.getAll({
        page,
        size: 25,
        eventType: eventType || undefined,
      }),
    {
      keepPreviousData: true,
    }
  )

  const logs = data?.data?.data?.content ?? []
  const totalPages = data?.data?.data?.totalPages ?? 1

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs

    return logs.filter((l) => {
      const q = search.toLowerCase()

      return (
        l?.eventType?.toLowerCase().includes(q) ||
        l?.ipAddress?.toLowerCase()?.includes(q) ||
        l?.userId?.toLowerCase()?.includes(q)
      )
    })
  }, [logs, search])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Audit Logs
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Monitor system activity, security actions and operational events
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Total Logs
              </p>
              <p className="text-lg font-bold text-slate-800">
                {logs.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-5">
          <div className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                placeholder="Search by event, user or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 ${inputCls}`}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 text-slate-400">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-medium">Filter</span>
              </div>

              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value)
                  setPage(0)
                }}
                className={`${inputCls} min-w-[250px]`}
              >
                <option value="">All events</option>

                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Top */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Recent Activity
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                Click any row to inspect complete event details
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              Live audit tracking
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="py-24 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Event
                    </th>

                    <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      User
                    </th>

                    <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      IP Address
                    </th>

                    <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Time
                    </th>

                    <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelected(log)}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <EventBadge type={log.eventType} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-blue-600" />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {log.userId ?? 'Anonymous'}
                            </p>

                            <p className="text-[11px] text-slate-400 font-mono">
                              User Activity
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {log.ipAddress ?? '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {log.createdAt
                              ? format(new Date(log.createdAt), 'dd MMM yyyy')
                              : '—'}
                          </p>

                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {log.createdAt
                              ? format(new Date(log.createdAt), 'hh:mm:ss a')
                              : ''}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-400">
              Page {page + 1} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />

            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Audit Event Detail
                  </h2>

                  <p className="text-sm text-slate-400 mt-1">
                    Complete activity inspection and metadata
                  </p>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {[
                    ['Event Type', selected.eventType],
                    ['User ID', selected.userId ?? 'Anonymous'],
                    ['IP Address', selected.ipAddress ?? '—'],
                    ['User Agent', selected.userAgent ?? '—'],
                    [
                      'Created At',
                      selected.createdAt
                        ? format(
                            new Date(selected.createdAt),
                            'dd MMM yyyy, hh:mm:ss a'
                          )
                        : '—',
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-4"
                    >
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                        {label}
                      </p>

                      <p className="text-sm text-slate-700 font-medium break-all">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Metadata */}
                {selected.metadata && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      Metadata
                    </p>

                    <pre className="bg-slate-900 rounded-2xl p-5 text-xs text-slate-200 overflow-auto border border-slate-800 leading-relaxed">
{JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}