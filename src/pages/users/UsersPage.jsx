import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { rolesApi } from '../../api/roles'
import { depotApi } from '../../api/depot'
import toast from 'react-hot-toast'
import { UserPlus, Search, ShieldOff, ShieldCheck, Eye } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { format } from 'date-fns'

/* ---------------- STATUS BADGE ---------------- */
function StatusBadge({ isActive }) {
  return (
    <span className={isActive ? 'badge-green' : 'badge-red'}>
      {isActive ? 'ACTIVE' : 'SUSPENDED'}
    </span>
  )
}

/* ---------------- EMPTY FORM STATE ---------------- */
const EMPTY_FORM = {
  phone:             '',
  fullName:          '',
  password:          '',
  depotId:           '',
  employeeCode:      '',
  designation:       '',
  dateOfBirth:       '',
  joiningDate:       '',
  employmentType:    '',
  roleId:            '',
  email:             '',
  licenseNumber:     '',
  licenseExpiryDate: ''
}

/* ================================================================
   MAIN PAGE
================================================================ */
export default function UsersPage() {
  const qc       = useQueryClient()
  const navigate = useNavigate()

  /* ── table state ── */
  const [page,   setPage]   = useState(0)
  const [search, setSearch] = useState('')

  /* ── create modal state ── */
  const [showCreate,        setShowCreate]        = useState(false)
  const [createForm,        setCreateForm]        = useState(EMPTY_FORM)

  /* ── employee-code conflict confirmation ── */
  const [showEmpConfirm, setShowEmpConfirm] = useState(false)
  const [pendingPayload,  setPendingPayload]  = useState(null)

  /* ================================================================
     PHONE HELPERS
  ================================================================ */
  const stripCountryCode = (phone) => {
    if (!phone) return ''
    return phone.replace(/^(\+91|91)/, '').slice(-10)
  }

  const formatPhonePretty = (phone) => {
    const p = stripCountryCode(phone)
    if (!p) return '—'
    return p.replace(/(\d{5})(\d{5})/, '$1 $2')
  }

  /* ================================================================
     FETCH USERS
  ================================================================ */
  const formattedSearch = search ? `+91${search.replace(/^91/, '')}` : ''

  const { data, isLoading } = useQuery(
    ['users', page, formattedSearch],
    () => usersApi.getAll({ page, size: 20, search: formattedSearch }),
    { keepPreviousData: true }
  )

  const usersRaw   = data?.data?.data?.content  ?? []
  const totalPages = data?.data?.data?.totalPages ?? 1

  /* fallback client-side filter */
  const users = usersRaw.filter(u =>
    stripCountryCode(u.phoneNumber).includes(search)
  )

  /* ================================================================
     FETCH ROLES  (only when modal is open)
  ================================================================ */
  const { data: rolesData, isLoading: rolesLoading } = useQuery(
    ['roles'],
    rolesApi.getAll,
    { enabled: showCreate, staleTime: 5 * 60 * 1000 }
  )
  const roles = Array.isArray(rolesData?.data)
    ? rolesData.data
    : rolesData?.data?.data ?? []

  /* ================================================================
     FETCH DEPOTS  (only when modal is open)
  ================================================================ */
  const { data: depotsData, isLoading: depotsLoading } = useQuery(
    ['depots'],
    depotApi.getAllDepots,
    { enabled: showCreate, staleTime: 10 * 60 * 1000 }
  )
  const depots = Array.isArray(depotsData?.data)
    ? depotsData.data
    : depotsData?.data?.data ?? []

  /* ================================================================
     AUTO-FILL
     When the phone field hits 10 digits, find the matching user in
     the already-loaded list and pull their staff profile to
     pre-populate the form. Password is intentionally never filled.
  ================================================================ */
  const phoneDigits = createForm.phone.replace(/\D/g, '')
  const lookupPhone = phoneDigits.length === 10 ? `+91${phoneDigits}` : null

  useEffect(() => {
    if (!lookupPhone || !showCreate) return

    const matched = usersRaw.find(u => u.phoneNumber === lookupPhone)
    if (!matched) return

    usersApi.getStaffProfile(matched.id)
      .then(res => {
        const sp = res?.data?.data ?? res?.data ?? {}

        setCreateForm(prev => ({
          ...prev,
          fullName:          sp.fullName          ?? matched.fullName ?? prev.fullName,
          email:             sp.email             ?? matched.email    ?? prev.email,
          depotId:           sp.depotId           != null ? String(sp.depotId)  : prev.depotId,
          employeeCode:      sp.employeeCode       ?? prev.employeeCode,
          designation:       sp.designation        ?? prev.designation,
          dateOfBirth:       sp.dateOfBirth        ?? prev.dateOfBirth,
          joiningDate:       sp.joiningDate        ?? prev.joiningDate,
          employmentType:    sp.employmentType      ?? prev.employmentType,
          roleId:            sp.roleId            != null ? String(sp.roleId)   : prev.roleId,
          licenseNumber:     sp.licenseNumber      ?? prev.licenseNumber,
          licenseExpiryDate: sp.licenseExpiryDate  ?? prev.licenseExpiryDate,
          // password intentionally left blank
        }))

        toast.success('Existing staff data loaded', { icon: '📋' })
      })
      .catch(() => {
        // passenger only — admin fills manually
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupPhone, showCreate])

  /* ================================================================
     MUTATIONS
  ================================================================ */
  const suspendMut = useMutation(usersApi.suspend, {
    onSuccess: () => { toast.success('User suspended');  qc.invalidateQueries('users') },
    onError:   () =>   toast.error('Failed to suspend user')
  })

  const activateMut = useMutation(usersApi.activate, {
    onSuccess: () => { toast.success('User activated');  qc.invalidateQueries('users') },
    onError:   () =>   toast.error('Failed to activate user')
  })

  const createMut = useMutation(usersApi.createStaff, {
    onSuccess: () => {
      toast.success('Staff account created')
      qc.invalidateQueries('users')
      setShowCreate(false)
      setShowEmpConfirm(false)
      setPendingPayload(null)
      setCreateForm(EMPTY_FORM)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? ''
      if (msg.startsWith('EMPLOYEE_CODE_EXISTS')) {
        // backend signals conflict — show confirmation dialog
        setShowEmpConfirm(true)
      } else {
        toast.error(msg || 'Failed to create staff account')
      }
    }
  })

  /* ================================================================
     BUILD PAYLOAD  (shared between first attempt & force-update)
  ================================================================ */
  const buildPayload = (forceUpdate = false) => {
    const cleanPhone = createForm.phone.replace(/\D/g, '')
    return {
      phoneNumber:       `+91${cleanPhone}`,
      fullName:          createForm.fullName,
      password:          createForm.password,
      depotId:           Number(createForm.depotId),
      employeeCode:      createForm.employeeCode,
      designation:       createForm.designation,
      dateOfBirth:       createForm.dateOfBirth,
      joiningDate:       createForm.joiningDate,
      employmentType:    createForm.employmentType,
      roleId:            Number(createForm.roleId),
      email:             createForm.email             || null,
      licenseNumber:     createForm.licenseNumber     || null,
      licenseExpiryDate: createForm.licenseExpiryDate || null,
      forceUpdate,
    }
  }

  /* ================================================================
     FORM SUBMIT — first attempt (forceUpdate = false)
  ================================================================ */
  const handleCreateSubmit = (e) => {
    e.preventDefault()

    const cleanPhone = createForm.phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Invalid phone number')
      return
    }

    const payload = buildPayload(false)
    setPendingPayload(payload)
    createMut.mutate(payload)
  }

  /* ================================================================
     FORCE UPDATE — admin confirmed employee-code overwrite
  ================================================================ */
  const handleForceCreate = () => {
    createMut.mutate({ ...pendingPayload, forceUpdate: true })
  }

  /* ================================================================
     TABLE COLUMNS
  ================================================================ */
  const columns = [
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: r => (
        <span className="font-mono text-xs">
          {formatPhonePretty(r.phoneNumber)}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: r => r.email ?? '—'
    },
    {
      key: 'accountType',
      label: 'Type',
      render: r => (
        <span className="capitalize text-surface-300">
          {r.accountType}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: r => <StatusBadge isActive={r.isActive} />
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: r =>
        r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '—'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: r => (
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>

          {/* 👁 VIEW */}
          <button
            // onClick={() => navigate(`/admin/passengerProfile/${r.id}`)}
            onClick={() =>navigate(`/admin/user-profile/${r.id}/${r.accountType}`)}
            title="View profile"
            className="p-1.5 rounded hover:bg-blue-900/30 text-surface-400 hover:text-blue-400 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* 🟢 ACTIVATE — only when suspended */}
          {!r.isActive && (
            <button
              onClick={() => activateMut.mutate(r.id)}
              title="Activate"
              disabled={activateMut.isLoading}
              className="p-1.5 rounded hover:bg-emerald-900/30 text-surface-400 hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 🔴 SUSPEND — only when active */}
          {r.isActive && (
            <button
              onClick={() => suspendMut.mutate(r.id)}
              title="Suspend"
              disabled={suspendMut.isLoading}
              className="p-1.5 rounded hover:bg-red-900/30 text-surface-400 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <ShieldOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ]

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage passengers and staff accounts"
        actions={
          <button
            onClick={() => {
              setCreateForm(EMPTY_FORM)
              setShowCreate(true)
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create Staff
          </button>
        }
      />

      {/* ── USERS TABLE CARD ── */}
      <div className="card">
        <div className="p-4 border-b border-surface-700">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              className="input pl-9"
              placeholder="Search by phone..."
              value={search}
              onChange={e => {
                setSearch(e.target.value.replace(/\D/g, ''))
                setPage(0)
              }}
            />
          </div>
        </div>

        <Table columns={columns} data={users} loading={isLoading} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* ================================================================
          CREATE STAFF MODAL
      ================================================================ */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false)
          setCreateForm(EMPTY_FORM)
        }}
        title="Create Staff Account"
      >
        <div className="w-full max-w-3xl">
          <form onSubmit={handleCreateSubmit} className="flex flex-col max-h-[80vh]">

            {/* SCROLLABLE FORM BODY */}
            <div className="overflow-y-auto pr-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── PHONE ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">
                  Phone
                  <span className="ml-1 text-surface-500 font-normal italic">
                    (auto-fills if staff exists)
                  </span>
                </label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={createForm.phone}
                  onChange={e =>
                    setCreateForm(p => ({
                      ...p,
                      phone: e.target.value.replace(/\D/g, '')
                    }))
                  }
                  required
                />
              </div>

              {/* ── FULL NAME ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Full Name</label>
                <input
                  className="input"
                  type="text"
                  value={createForm.fullName}
                  onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </div>

              {/* ── PASSWORD ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Password</label>
                <input
                  className="input"
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>

              {/* ── EMPLOYEE CODE ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Employee Code</label>
                <input
                  className="input"
                  type="text"
                  value={createForm.employeeCode}
                  onChange={e => setCreateForm(p => ({ ...p, employeeCode: e.target.value }))}
                  required
                />
              </div>

              {/* ── DEPOT — shows name, sends id ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Depot</label>
                {depotsLoading ? (
                  <div className="input flex items-center gap-2 text-surface-500">
                    <Spinner size="sm" />
                    <span className="text-xs">Loading depots…</span>
                  </div>
                ) : (
                  <select
                    className="input"
                    value={createForm.depotId}
                    onChange={e => setCreateForm(p => ({ ...p, depotId: e.target.value }))}
                    required
                  >
                    <option value="">Select depot</option>
                    {depots.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* ── EMAIL ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">
                  Email <span className="text-surface-500 italic">(optional)</span>
                </label>
                <input
                  className="input"
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              {/* ── DATE OF BIRTH ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Date of Birth</label>
                <input
                  className="input"
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={e => setCreateForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              {/* ── JOINING DATE ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Joining Date</label>
                <input
                  className="input"
                  type="date"
                  value={createForm.joiningDate}
                  onChange={e => setCreateForm(p => ({ ...p, joiningDate: e.target.value }))}
                  required
                />
              </div>

              {/* ── LICENSE NUMBER ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">
                  License Number <span className="text-surface-500 italic">(optional)</span>
                </label>
                <input
                  className="input"
                  type="text"
                  value={createForm.licenseNumber}
                  onChange={e => setCreateForm(p => ({ ...p, licenseNumber: e.target.value }))}
                />
              </div>

              {/* ── LICENSE EXPIRY ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">
                  License Expiry <span className="text-surface-500 italic">(optional)</span>
                </label>
                <input
                  className="input"
                  type="date"
                  value={createForm.licenseExpiryDate}
                  onChange={e => setCreateForm(p => ({ ...p, licenseExpiryDate: e.target.value }))}
                />
              </div>

              {/* ── DESIGNATION ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Designation</label>
                <select
                  className="input"
                  value={createForm.designation}
                  onChange={e => setCreateForm(p => ({ ...p, designation: e.target.value }))}
                  required
                >
                  <option value="">Select</option>
                  <option value="driver">Driver</option>
                  <option value="conductor">Conductor</option>
                  <option value="depot_manager">Depot Manager</option>
                  <option value="ticket_checker">Ticket Checker</option>
                </select>
              </div>

              {/* ── EMPLOYMENT TYPE ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Employment Type</label>
                <select
                  className="input"
                  value={createForm.employmentType}
                  onChange={e => setCreateForm(p => ({ ...p, employmentType: e.target.value }))}
                  required
                >
                  <option value="">Select</option>
                  <option value="permanent">Permanent</option>
                  <option value="contract">Contract</option>
                  <option value="probation">Probation</option>
                  <option value="daily_wage">Daily Wage</option>
                </select>
              </div>

              {/* ── ROLE — shows name, sends id ── */}
              <div className="flex flex-col">
                <label className="text-xs text-surface-400 mb-1.5">Role</label>
                {rolesLoading ? (
                  <div className="input flex items-center gap-2 text-surface-500">
                    <Spinner size="sm" />
                    <span className="text-xs">Loading roles…</span>
                  </div>
                ) : (
                  <select
                    className="input"
                    value={createForm.roleId}
                    onChange={e => setCreateForm(p => ({ ...p, roleId: e.target.value }))}
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

            </div>

            {/* FIXED ACTION BUTTONS */}
            <div className="flex gap-2 pt-3 border-t border-surface-700 bg-surface-800">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setCreateForm(EMPTY_FORM)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMut.isLoading}
                className="btn-primary flex-1 flex justify-center"
              >
                {createMut.isLoading ? <Spinner size="sm" /> : 'Create Staff'}
              </button>
            </div>

          </form>
        </div>
      </Modal>

      {/* ================================================================
          EMPLOYEE CODE CONFLICT — CONFIRMATION MODAL
      ================================================================ */}
      <Modal
        open={showEmpConfirm}
        onClose={() => setShowEmpConfirm(false)}
        title="Employee Code Already Exists"
      >
        <div className="flex flex-col gap-4 p-2 max-w-sm">
          <p className="text-sm text-surface-300">
            Employee code{' '}
            <span className="font-mono font-semibold text-white">
              {createForm.employeeCode}
            </span>{' '}
            is already assigned to another staff member.
          </p>
          <p className="text-sm text-surface-400">
            Do you want to reassign this code and update their profile with the new details?
          </p>
          <div className="flex gap-2 pt-1">
            <button
              className="btn-secondary flex-1"
              onClick={() => setShowEmpConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1 flex justify-center"
              disabled={createMut.isLoading}
              onClick={handleForceCreate}
            >
              {createMut.isLoading ? <Spinner size="sm" /> : 'Yes, Update'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}