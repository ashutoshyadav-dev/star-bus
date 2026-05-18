import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { rolesApi } from '../../api/roles'
import { depotApi } from '../../api/depot'
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

const selectCls = `${inputCls} cursor-pointer`

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

/* ─────────────────────────────────────────────
   EMPTY FORM
───────────────────────────────────────────── */
const EMPTY = {
  phone: '', fullName: '', password: '', depotId: '',
  employeeCode: '', designation: '', dateOfBirth: '',
  joiningDate: '', employmentType: '', roleId: '',
  email: '', licenseNumber: '', licenseExpiryDate: ''
}

/* ═══════════════════════════════════════════
   CREATE STAFF MODAL
   Flow: phone auto-fills profile if staff exists
         → fill details → submit
         → if EMPLOYEE_CODE_EXISTS → confirm dialog
═══════════════════════════════════════════ */
function CreateStaffModal({ open, onClose, roles, depots, rolesLoading, depotsLoading }) {
  const qc = useQueryClient()
  const [form, setForm]         = useState(EMPTY)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pending, setPending]   = useState(null)

  // Add this state inside CreateStaffModal
const [userFound, setUserFound] = useState(null) // null=not checked, true=found, false=not found

// Reset it when modal opens/closes
useEffect(() => {
  if (open) { setForm(EMPTY); setShowConfirm(false); setPending(null); setUserFound(null) }
}, [open])


  // reset on open
  useEffect(() => { if (open) { setForm(EMPTY); setShowConfirm(false); setPending(null) } }, [open])

  /* auto-fill from existing staff profile */
  const phoneDigits = form.phone.replace(/\D/g, '')
  const lookupPhone = phoneDigits.length === 10 ? `+91${phoneDigits}` : null

  const { data: allUsersData } = useQuery(['users', 0, ''], () => usersApi.getAll({ page: 0, size: 100 }), { staleTime: 60_000 })
  const allUsers = allUsersData?.data?.data?.content ?? []

  useEffect(() => {
  if (!lookupPhone || !open) return
  
  usersApi.search(phoneDigits)
    .then(res => {
      const results = res?.data?.data ?? res?.data ?? []
      const matched = results.find(u => u.phoneNumber === lookupPhone)

      if (!matched) {
        setUserFound(false)
        return
      }
      setUserFound(true)

      // Try staff profile first (existing staff being re-onboarded)
      usersApi.getStaffProfile(matched.id)
        .then(res => {
          const sp = res?.data?.data ?? res?.data ?? {}
          setForm(prev => ({
            ...prev,
            fullName:          sp.fullName          ?? prev.fullName,
            email:             matched.email        ?? prev.email,
            depotId:           sp.depotId           != null ? String(sp.depotId)  : prev.depotId,
            employeeCode:      sp.employeeCode       ?? prev.employeeCode,
            designation:       sp.designation        ?? prev.designation,
            dateOfBirth:       sp.dateOfBirth        ?? prev.dateOfBirth,
            joiningDate:       sp.joiningDate        ?? prev.joiningDate,
            employmentType:    sp.employmentType      ?? prev.employmentType,
            licenseNumber:     sp.licenseNumber      ?? prev.licenseNumber,
            licenseExpiryDate: sp.licenseExpiryDate  ?? prev.licenseExpiryDate,
          }))
          toast.success('Existing staff data loaded', { icon: '📋' })
        })
        .catch(() => {
          // No staff profile → passenger, pull what we can
          usersApi.getPassengerProfile(matched.id)
            .then(res => {
              const pp = res?.data?.data ?? res?.data ?? {}
              setForm(prev => ({
                ...prev,
                fullName:    pp.fullName    ?? prev.fullName,
                dateOfBirth: pp.dateOfBirth ?? prev.dateOfBirth,
                email:       matched.email  ?? prev.email,
              }))
              toast.success('Passenger profile loaded — fill employment details', { icon: '📋' })
            })
            .catch(() => {
              setForm(prev => ({ ...prev, email: matched.email ?? prev.email }))
              toast('Account found — fill remaining details', { icon: 'ℹ️' })
            })
        })
    })
    .catch(() => {})

// ✅ dependency is `open` not `showCreate`
}, [lookupPhone, open])

  const buildPayload = (forceUpdate = false) => ({
    phoneNumber:       `+91${form.phone.replace(/\D/g, '')}`,
    fullName:          form.fullName,
    password:          form.password,
    depotId:           Number(form.depotId),
    employeeCode:      form.employeeCode,
    designation:       form.designation,
    dateOfBirth:       form.dateOfBirth,
    joiningDate:       form.joiningDate,
    employmentType:    form.employmentType,
    roleId:            Number(form.roleId),
    email:             form.email             || null,
    licenseNumber:     form.licenseNumber     || null,
    licenseExpiryDate: form.licenseExpiryDate || null,
    forceUpdate,
  })

  const mut = useMutation(usersApi.createStaff, {
    onSuccess: () => {
      toast.success('Staff account created')
      qc.invalidateQueries('users')
      onClose()
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? ''
      if (msg.startsWith('EMPLOYEE_CODE_EXISTS')) {
        setPending(buildPayload(false))
        setShowConfirm(true)
      } else {
        toast.error(msg || 'Failed to create staff')
      }
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const clean = form.phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(clean)) { toast.error('Invalid phone number'); return }
    mut.mutate(buildPayload(false))
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  if (!open) return null

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/80 w-full max-w-2xl flex flex-col max-h-[92vh] ring-1 ring-slate-200/60">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Create Staff Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter phone — form auto-fills if user exists</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">

                {/* Phone */}
                <Field label="Phone" icon={Phone}>
                  <input className={inputCls} type="text" inputMode="numeric"
                    placeholder="10-digit mobile" maxLength={10}
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                    required />
                </Field>

                {phoneDigits.length === 10 && userFound === false && (
  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1.5">
    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
    No account found. Ask this person to register via the app first.
  </p>
)}
{phoneDigits.length === 10 && userFound === true && (
  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1.5">
    <Check className="w-3 h-3 flex-shrink-0" />
    Account found — details loaded below.
  </p>
)}

                {/* Full Name */}
                <Field label="Full Name" icon={User}>
                  <input className={inputCls} type="text" placeholder="As per ID"
                    value={form.fullName} onChange={set('fullName')} required />
                </Field>

                {/* Password */}
                <Field label="Login Password">
                  <input className={inputCls} type="password" placeholder="Set initial password"
                    value={form.password} onChange={set('password')} required />
                </Field>

                {/* Employee Code */}
                <Field label="Employee Code" icon={Hash}>
                  <input className={inputCls} type="text" placeholder="e.g. EMP-0042"
                    value={form.employeeCode} onChange={set('employeeCode')} required />
                </Field>

                {/* Depot */}
                <Field label="Depot" icon={Building2}>
                  {depotsLoading
                    ? <div className={`${inputCls} flex items-center gap-2 text-slate-400`}><Spin size={14} /><span>Loading…</span></div>
                    : (
                      <select className={selectCls} value={form.depotId} onChange={set('depotId')} required>
                        <option value="">Select depot</option>
                        {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    )}
                </Field>

                {/* Email */}
                <Field label="Email" optional icon={Mail}>
                  <input className={inputCls} type="email" placeholder="staff@example.com"
                    value={form.email} onChange={set('email')} />
                </Field>

                {/* Date of Birth */}
                <Field label="Date of Birth" icon={Calendar}>
                  <input className={inputCls} type="date"
                    value={form.dateOfBirth} onChange={set('dateOfBirth')} required />
                </Field>

                {/* Joining Date */}
                <Field label="Joining Date" icon={Calendar}>
                  <input className={inputCls} type="date"
                    value={form.joiningDate} onChange={set('joiningDate')} required />
                </Field>

                {/* Designation */}
                <Field label="Designation" icon={Briefcase}>
                  <select className={selectCls} value={form.designation} onChange={set('designation')} required>
                    <option value="">Select</option>
                    <option value="driver">Driver</option>
                    <option value="conductor">Conductor</option>
                    <option value="depot_manager">Depot Manager</option>
                    <option value="ticket_checker">Ticket Checker</option>
                  </select>
                </Field>

                {/* Employment Type */}
                <Field label="Employment Type">
                  <select className={selectCls} value={form.employmentType} onChange={set('employmentType')} required>
                    <option value="">Select</option>
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="probation">Probation</option>
                    <option value="daily_wage">Daily Wage</option>
                  </select>
                </Field>

                {/* Role */}
                <Field label="Role">
                  {rolesLoading
                    ? <div className={`${inputCls} flex items-center gap-2 text-slate-400`}><Spin size={14} /><span>Loading…</span></div>
                    : (
                      <select className={selectCls} value={form.roleId} onChange={set('roleId')} required>
                        <option value="">Select role</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.displayName ?? r.name}</option>)}
                      </select>
                    )}
                </Field>

                {/* License Number */}
                <Field label="License Number" optional icon={CreditCard}>
                  <input className={inputCls} type="text" placeholder="DL-XXXX-XXXX"
                    value={form.licenseNumber} onChange={set('licenseNumber')} />
                </Field>

                {/* License Expiry — full width */}
                <Field label="License Expiry" optional icon={Calendar}>
                  <input className={inputCls} type="date"
                    value={form.licenseExpiryDate} onChange={set('licenseExpiryDate')} />
                </Field>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 bg-white rounded-b-2xl">
              <button type="button" onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={mut.isLoading}
                className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {mut.isLoading ? <Spin size={14} /> : <><UserPlus className="w-4 h-4" />Create Staff</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* EMPLOYEE CODE CONFLICT MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 ring-1 ring-slate-200/60">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Employee Code Conflict</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Code <span className="font-mono font-semibold text-slate-700">{form.employeeCode}</span> is
                  already assigned to another staff member.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Reassign this code and update the profile with the new details?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => mut.mutate({ ...pending, forceUpdate: true })}
                disabled={mut.isLoading}
                className="flex-1 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                {mut.isLoading ? <Spin size={13} /> : <><Check className="w-3.5 h-3.5" />Yes, Update</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const [showCreate, setShowCreate] = useState(false)

  /* ── fetch users ── */
  const fmtSearch = search ? `+91${search.replace(/^91/, '')}` : ''
  const { data, isLoading } = useQuery(
    ['users', page, fmtSearch],
    () => usersApi.getAll({ page, size: 20, search: fmtSearch }),
    { keepPreviousData: true }
  )
  const usersRaw   = data?.data?.data?.content  ?? []
  const totalPages = data?.data?.data?.totalPages ?? 1
  const users      = usersRaw.filter(u => stripCC(u.phoneNumber).includes(search))

  /* ── fetch roles & depots (only when modal open) ── */
  const { data: rolesData, isLoading: rolesLoading } = useQuery(
    'roles', rolesApi.getAll, { enabled: showCreate, staleTime: 5 * 60_000 }
  )
  const roles = Array.isArray(rolesData?.data) ? rolesData.data : rolesData?.data?.data ?? []

  const { data: depotsData, isLoading: depotsLoading } = useQuery(
    'depots', depotApi.getAllDepots, { enabled: showCreate, staleTime: 10 * 60_000 }
  )
  const depots = Array.isArray(depotsData?.data) ? depotsData.data : depotsData?.data?.data ?? []

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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-200">
            <UserPlus className="w-4 h-4" />
            Create Staff
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

      {/* CREATE STAFF MODAL */}
      <CreateStaffModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        roles={roles}
        depots={depots}
        rolesLoading={rolesLoading}
        depotsLoading={depotsLoading}
      />
    </div>
  )
}
