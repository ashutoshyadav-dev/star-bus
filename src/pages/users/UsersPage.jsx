import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../../api/users'
import toast from 'react-hot-toast'
import {
  UserPlus, Search, ShieldOff, ShieldCheck, Eye,
  X, ChevronLeft, ChevronRight, AlertTriangle, Check,
  Phone, Mail, Calendar, Briefcase, Hash, MapPin,
  CreditCard, Building2, User
} from 'lucide-react'
import { format } from 'date-fns'

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const stripCC  = (p = '') => p.replace(/^(\+91|91)/, '').slice(-10)
const fmtPhone = (p = '') => {
  const d = stripCC(p)
  return d ? d.replace(/(\d{5})(\d{5})/, '$1 $2') : '—'
}

/* ─────────────────────────────────────────────
   BADGE
───────────────────────────────────────────── */
function Badge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide
      ${active
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-red-50 text-red-600 ring-1 ring-red-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {active ? 'Active' : 'Suspended'}
    </span>
  )
}

/* ─────────────────────────────────────────────
   FIELD WRAPPER — reusable form field
───────────────────────────────────────────── */
function Field({ label, optional, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
        {optional && <span className="text-slate-400 normal-case font-normal">(optional)</span>}
      </label>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   INPUT / SELECT classes
───────────────────────────────────────────── */
const inputCls = `w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-200
  rounded-lg outline-none transition-all
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100
  placeholder:text-slate-300`

/* ─────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────── */
function Spin({ size = 16 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }}
    />
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function UsersPage() {
  const qc       = useQueryClient()
  const navigate = useNavigate()

  const [page,       setPage]       = useState(0)
  const [search,     setSearch]     = useState('')

   useEffect(() => {
    document.title = "Users | APSTS Admin Portal";
  }, []);

  /* ── fetch users ── */
  const fmtSearch = search ? `+91${search.replace(/^91/, '')}` : ''
  const { data: pendingData } = useQuery(['staff-requests'], usersApi.getPendingStaff, { staleTime: 30_000 })
  const pendingCount = (pendingData?.data?.data ?? []).length

  const { data, isLoading } = useQuery(
    ['users', page, fmtSearch],
    () => usersApi.getAll({ page, size: 20, search: fmtSearch }),
    { keepPreviousData: true }
  )
  const usersRaw   = data?.data?.data?.content  ?? []
  const totalPages = data?.data?.data?.totalPages ?? 1
  const users      = usersRaw.filter(u => stripCC(u.phoneNumber).includes(search))

  /* ── mutations ── */
  const suspendMut  = useMutation(usersApi.suspend,   {
    onSuccess: () => { toast.success('User suspended');  qc.invalidateQueries('users') },
    onError:   () => toast.error('Failed to suspend')
  })
  const activateMut = useMutation(usersApi.activate,  {
    onSuccess: () => { toast.success('User activated'); qc.invalidateQueries('users') },
    onError:   () => toast.error('Failed to activate')
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Users</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage passenger and staff accounts</p>
          </div>
          <button
            onClick={() => navigate('/admin/staff-requests')}
            className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-200">
            <UserPlus className="w-4 h-4" />
            Staff Requests
            {pendingCount > 0 && (
              <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-white text-blue-700 text-xs font-semibold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* ── TABLE CARD ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

          {/* Search bar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                placeholder="Search by phone…"
                value={search}
                onChange={e => { setSearch(e.target.value.replace(/\D/g, '')); setPage(0) }}
              />
            </div>
            <p className="text-xs text-slate-400 flex-shrink-0">{users.length} users</p>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Spin size={20} />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <User className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Phone', 'Email', 'Type', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-700 tracking-wide">
                          {fmtPhone(u.phoneNumber)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{u.email ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                          ${u.accountType === 'staff'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'}`}>
                          {u.accountType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><Badge active={u.isActive} /></td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                          {/* View */}
                          <button
                            onClick={() => navigate(`/admin/user-profile/${u.id}/${u.accountType}`)}
                            title="View profile"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Activate */}
                          {!u.isActive && (
                            <button
                              onClick={() => activateMut.mutate(u.id)}
                              disabled={activateMut.isLoading}
                              title="Activate"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-40">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Suspend */}
                          {u.isActive && (
                            <button
                              onClick={() => suspendMut.mutate(u.id)}
                              disabled={suspendMut.isLoading}
                              title="Suspend"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                              <ShieldOff className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
