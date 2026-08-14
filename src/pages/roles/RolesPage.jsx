import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { rolesApi, permissionsApi } from '../../api/roles'
import { usersApi } from '../../api/users'
import { toOffsetDateTime } from '../../utils/format'
import toast from 'react-hot-toast'
import {
  Plus, ChevronDown, ChevronRight,
  Search, X, Shield, User, Check,
  ArrowLeft, UserCheck, Lock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/* ─────────────────────────────────────────────
   SHARED STYLE CONSTANTS
───────────────────────────────────────────── */
const inputCls = `w-full h-10 px-3 text-sm text-slate-800 bg-white border border-slate-200
  rounded-lg outline-none transition-all
  focus:border-blue-400 focus:ring-2 focus:ring-blue-100
  placeholder:text-slate-300`

function Spin({ size = 16 }) {
  return (
    <span className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }} />
  )
}

/* ═══════════════════════════════════════════
   USER SEARCH COMBOBOX
═══════════════════════════════════════════ */
function UserSearchCombobox({ onSelect, placeholder = 'Search by name, phone or email…' }) {
  const [inputValue, setInputValue] = useState('')
  const [query,      setQuery]      = useState('')
  const [open,       setOpen]       = useState(false)
  const [activeIdx,  setActiveIdx]  = useState(-1)

  const wrapRef     = useRef(null)
  const debounceRef = useRef(null)

  const { data, isFetching } = useQuery(
    ['user-search', query],
    () => usersApi.search(query),
    { enabled: query.length >= 2, keepPreviousData: true, staleTime: 30_000 }
  )
  const raw     = data?.data
  const results = Array.isArray(raw) ? raw : (raw?.data ?? [])

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleInput = useCallback((e) => {
    const val = e.target.value
    setInputValue(val)
    setActiveIdx(-1)
    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setQuery(''); setOpen(false); return }
    debounceRef.current = setTimeout(() => { setQuery(val.trim()); setOpen(true) }, 300)
  }, [])

  const handleKeyDown = (e) => {
    if (!open || !results.length) return
    if      (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter')     { e.preventDefault(); if (activeIdx >= 0) select(results[activeIdx]) }
    else if (e.key === 'Escape')    setOpen(false)
  }

  const select = (user) => {
    const label = user.staffProfile?.fullName ?? user.phoneNumber ?? user.email ?? user.id
    setInputValue(label)
    setOpen(false)
    setQuery('')
    onSelect?.(user)
  }

  const clear = () => { setInputValue(''); setQuery(''); setOpen(false); setActiveIdx(-1); onSelect?.(null) }
  const show  = open && query.length >= 2

  return (
    <div ref={wrapRef} className="relative">
      <div className={`flex items-center border rounded-lg bg-white transition-all
        ${show ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}>
        <span className="pl-3 text-slate-400">
          {isFetching
            ? <Spin size={14} />
            : <Search className="w-3.5 h-3.5" />}
        </span>
        <input
          type="text" value={inputValue} onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder={placeholder}
          className="flex-1 h-10 bg-transparent text-sm text-slate-800 placeholder-slate-300 outline-none px-2"
        />
        {inputValue && (
          <button onClick={clear} className="pr-3 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {show && (
        <ul onMouseDown={e => e.preventDefault()}
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-lg shadow-slate-100">
          {isFetching && !results.length && (
            <li className="px-4 py-3 text-sm text-slate-400">Searching…</li>
          )}
          {!isFetching && !results.length && (
            <li className="px-4 py-3 text-sm text-slate-400">No users found</li>
          )}
          {results.length > 0 && (
            <li className="px-4 py-2 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-medium">
              Matching users
            </li>
          )}
          {results.map((user, idx) => {
            const name  = user.staffProfile?.fullName ?? '—'
            const phone = user.phoneNumber ?? '—'
            const type  = user.accountType ?? ''
            return (
              <li key={user.id} onClick={() => select(user)} onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-50 last:border-0
                  ${idx === activeIdx ? 'bg-slate-50' : 'hover:bg-slate-50/70'} transition-colors`}>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{phone}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                  ${type === 'staff' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {type}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   PERMISSION TOGGLE
   Green = has it (click to remove)
   Gray  = doesn't have it (click to add)
═══════════════════════════════════════════ */
function PermissionToggle({ roleId, permission, hasIt }) {
  const qc = useQueryClient()

  const addMut = useMutation(
    () => rolesApi.addPermission(roleId, permission.id),
    {
      onSuccess: () => { qc.invalidateQueries('roles'); toast.success(`Added: ${permission.name}`) },
      onError:   () => toast.error('Failed to add permission'),
    }
  )
  const removeMut = useMutation(
    () => rolesApi.removePermission(roleId, permission.id),
    {
      onSuccess: () => { qc.invalidateQueries('roles'); toast.success(`Removed: ${permission.name}`) },
      onError:   () => toast.error('Failed to remove permission'),
    }
  )

  const busy = addMut.isLoading || removeMut.isLoading

  return (
    <button
      onClick={() => hasIt ? removeMut.mutate() : addMut.mutate()}
      disabled={busy}
      title={hasIt ? 'Click to remove' : 'Click to add'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all
        ${hasIt
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}
        ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {busy
        ? <Spin size={10} />
        : hasIt ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
      {permission.name}
    </button>
  )
}

/* ═══════════════════════════════════════════
   ROLE ROW — expandable with permission editor
═══════════════════════════════════════════ */
function RoleRow({ role, allPermissions }) {
  const [expanded, setExpanded] = useState(false)
  const [search,   setSearch]   = useState('')

  const rolePermIds = new Set((role.permissions ?? []).map(p => p.id))

  const byModule = allPermissions.reduce((acc, p) => {
    const mod = p.module ?? 'Other'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  const filteredModules = Object.entries(byModule).reduce((acc, [mod, perms]) => {
    const filtered = search
      ? perms.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : perms
    if (filtered.length) acc[mod] = filtered
    return acc
  }, {})

  const grantedCount = (role.permissions ?? []).length

  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-slate-50/70 transition-colors text-left">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{role.displayName ?? role.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{grantedCount} permission{grantedCount !== 1 ? 's' : ''} granted</p>
        </div>
        <div className="flex items-center gap-2">
          {role.isSystemRole && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
              <Lock className="w-2.5 h-2.5" />System
            </span>
          )}
          {expanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Editor */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-4">

          {/* Permission search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
              placeholder="Filter permissions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {Object.entries(filteredModules).map(([module, perms]) => (
            <div key={module}>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">{module}</p>
              <div className="flex flex-wrap gap-1.5">
                {perms.map(p => (
                  <PermissionToggle
                    key={p.id}
                    roleId={role.id}
                    permission={p}
                    hasIt={rolePermIds.has(p.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredModules).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No permissions match "{search}"</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   ASSIGN ROLE MODAL
   Purpose: assign / revoke roles for an existing user
   (separate from createStaff — that handles new users)
═══════════════════════════════════════════ */
function AssignRoleModal({ open, onClose, roles }) {
  const qc = useQueryClient()
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleId,       setRoleId]       = useState('')
  const [validFrom,    setValidFrom]    = useState('')
  const [validUntil,   setValidUntil]   = useState('')

  useEffect(() => {
    if (!open) { setSelectedUser(null); setRoleId(''); setValidFrom(''); setValidUntil('') }
  }, [open])

  const { data: userRolesData } = useQuery(
    ['user-roles', selectedUser?.id],
    () => rolesApi.getUserRoles(selectedUser.id),
    { enabled: !!selectedUser?.id }
  )
  const userRoles = userRolesData?.data?.data ?? userRolesData?.data ?? []

  const assignMut = useMutation(
    () => rolesApi.assign({
      userId:     selectedUser.id,
      roleId:     Number(roleId),
      validFrom:  toOffsetDateTime(validFrom),
      validUntil: toOffsetDateTime(validUntil),
    }),
    {
      onSuccess: () => {
        toast.success('Role assigned')
        qc.invalidateQueries(['user-roles', selectedUser?.id])
        setRoleId(''); setValidFrom(''); setValidUntil('')
      },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to assign role'),
    }
  )

  const revokeMut = useMutation(
    (rid) => rolesApi.revoke(selectedUser.id, rid),
    {
      onSuccess: () => { toast.success('Role revoked'); qc.invalidateQueries(['user-roles', selectedUser?.id]) },
      onError:   (err) => toast.error(err?.response?.data?.message ?? 'Cannot revoke system role'),
    }
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/80 w-full max-w-lg max-h-[90vh] overflow-y-auto ring-1 ring-slate-200/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Assign Role to User</h2>
              <p className="text-xs text-slate-400 mt-0.5">Search for an existing user and assign a role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Step 1 — search user */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Search User
            </label>
            <UserSearchCombobox onSelect={setSelectedUser} />
          </div>

          {/* Selected user card */}
          {selectedUser && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-indigo-900 truncate">
                  {selectedUser.staffProfile?.fullName ?? selectedUser.phoneNumber}
                </p>
                <p className="text-[11px] text-indigo-400 font-mono mt-0.5">{selectedUser.id}</p>
              </div>
            </div>
          )}

          {/* Current roles */}
          {selectedUser && userRoles.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                Current Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {userRoles.map(r => (
                  <span key={r.id}
                    className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-sm">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    {r.displayName ?? r.name}
                    <button
                      onClick={() => revokeMut.mutate(r.id)}
                      disabled={revokeMut.isLoading}
                      title="Revoke"
                      className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — pick role */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Role to Assign
            </label>
            <select className={inputCls} value={roleId} onChange={e => setRoleId(e.target.value)}>
              <option value="">Select a role…</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.displayName ?? r.name}</option>
              ))}
            </select>
          </div>

          {/* Validity window */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Validity Window <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-400 mb-1">From</p>
                <input type="datetime-local" value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1">Until</p>
                <input type="datetime-local" value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => assignMut.mutate()}
              disabled={!selectedUser || !roleId || assignMut.isLoading}
              className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {assignMut.isLoading
                ? <Spin size={14} />
                : <><Plus className="w-4 h-4" />Assign Role</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function RolesPage() {
  const navigate    = useNavigate()
  const [showAssign, setShowAssign] = useState(false)

  const { data: rolesData, isLoading: rolesLoading } = useQuery('roles', rolesApi.getAll)
  const { data: permsData, isLoading: permsLoading } = useQuery('permissions', permissionsApi.getAll)

  const roles          = rolesData?.data?.data ?? rolesData?.data ?? []
  const allPermissions = permsData?.data?.data ?? permsData?.data ?? []
  const loading        = rolesLoading || permsLoading

  useEffect(() => {
    document.title = "Roles | APSTS Admin Portal";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Roles & Permissions</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Expand a role to manage its permissions · Use "Assign Role" to grant roles to users
            </p>
          </div>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-200">
            <UserCheck className="w-4 h-4" /> Assign Role
          </button>
        </div>

        {/* Role list card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">All Roles</p>
            <p className="text-xs text-slate-400">
              {roles.length} roles · {allPermissions.length} permissions
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Spin size={20} />
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {roles.map(role => (
                <RoleRow key={role.id} role={role} allPermissions={allPermissions} />
              ))}
            </div>
          )}
        </div>

      </div>

      <AssignRoleModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        roles={roles}
      />
    </div>
  )
}
