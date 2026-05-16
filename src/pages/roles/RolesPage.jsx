import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { rolesApi, permissionsApi } from '../../api/roles'
import { usersApi } from '../../api/users'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  Search, X, Shield, User, Check, AlertTriangle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/* ══════════════════════════════════════════════════════
   USER SEARCH COMBOBOX  (same pattern as BookingSearchCombobox)
══════════════════════════════════════════════════════ */

function UserSearchCombobox({ onSelect, placeholder = 'Search by name, phone or email…' }) {
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery]           = useState('')
  const [open, setOpen]             = useState(false)
  const [activeIdx, setActiveIdx]   = useState(-1)

  const wrapRef     = useRef(null)
  const debounceRef = useRef(null)
  const listRef     = useRef(null)

  const { data, isFetching } = useQuery(
    ['user-search', query],
    () => usersApi.search(query),
    { enabled: query.length >= 2, keepPreviousData: true, staleTime: 30_000 }
  )

  // usersApi.search returns { data: [...] } or { data: { data: [...] } }
  // handle both shapes
  const raw     = data?.data
  const results = Array.isArray(raw) ? raw : (raw?.data ?? [])

  /* close on outside click */
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) selectItem(results[activeIdx]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  const selectItem = (user) => {
    const label = user.staffProfile?.fullName ?? user.phoneNumber ?? user.email ?? user.id
    setInputValue(`${label}`)
    setOpen(false)
    setQuery('')
    onSelect?.(user)
  }

  const clear = () => {
    setInputValue(''); setQuery(''); setOpen(false); setActiveIdx(-1); onSelect?.(null)
  }

  const showDropdown = open && query.length >= 2

  return (
    <div ref={wrapRef} className="relative">
      <div className={`flex items-center border rounded-xl bg-white transition-all ${showDropdown ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
        <span className="pl-3 text-gray-400">
          {isFetching
            ? <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            : <Search className="w-4 h-4" />}
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 2) setOpen(true) }}
          placeholder={placeholder}
          className="flex-1 h-10 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none px-2"
        />
        {inputValue && (
          <button onClick={clear} className="pr-3 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        )}
      </div>

      {showDropdown && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-lg"
        >
          {isFetching && !results.length && (
            <li className="px-4 py-3 text-sm text-gray-400">Searching…</li>
          )}
          {!isFetching && !results.length && (
            <li className="px-4 py-3 text-sm text-gray-400">No users found</li>
          )}
          {results.length > 0 && (
            <li className="px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
              Matching users
            </li>
          )}
          {results.map((user, idx) => {
            const name  = user.staffProfile?.fullName ?? '—'
            const phone = user.phoneNumber ?? '—'
            const type  = user.accountType ?? ''
            return (
              <li
                key={user.id}
                onClick={() => selectItem(user)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 ${idx === activeIdx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-medium text-indigo-700 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{phone}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${type === 'staff' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
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

/* ══════════════════════════════════════════════════════
   PERMISSION TOGGLE — single permission row inside a role
══════════════════════════════════════════════════════ */

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

  const loading = addMut.isLoading || removeMut.isLoading

  return (
    <button
      onClick={() => hasIt ? removeMut.mutate() : addMut.mutate()}
      disabled={loading}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
        ${hasIt
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-700'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {loading
        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : hasIt ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
      {permission.name}
    </button>
  )
}

/* ══════════════════════════════════════════════════════
   ROLE ROW — expandable card with permission editor
══════════════════════════════════════════════════════ */

function RoleRow({ role, allPermissions }) {
  const [expanded, setExpanded] = useState(false)

  const rolePermIds = new Set((role.permissions ?? []).map(p => p.id))

  // Group all permissions by module
  const byModule = allPermissions.reduce((acc, p) => {
    const mod = p.module ?? 'Other'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{role.displayName ?? role.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{role.permissions?.length ?? 0} permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {role.isSystem && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
              System
            </span>
          )}
          {expanded
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded permission editor */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
          {Object.entries(byModule).map(([module, perms]) => (
            <div key={module}>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">{module}</p>
              <div className="flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ASSIGN ROLE MODAL
══════════════════════════════════════════════════════ */

function AssignRoleModal({ open, onClose, roles }) {
  const qc = useQueryClient()
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleId, setRoleId]             = useState('')
  const [validFrom, setValidFrom]       = useState('')
  const [validUntil, setValidUntil]     = useState('')

  // Load current roles for selected user
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
      validFrom:  validFrom  || null,
      validUntil: validUntil || null,
    }),
    {
      onSuccess: () => {
        toast.success('Role assigned successfully')
        qc.invalidateQueries(['user-roles', selectedUser?.id])
        setRoleId(''); setValidFrom(''); setValidUntil('')
      },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to assign role'),
    }
  )

  const revokeMut = useMutation(
    (rid) => rolesApi.revoke(selectedUser.id, rid),
    {
      onSuccess: () => {
        toast.success('Role revoked')
        qc.invalidateQueries(['user-roles', selectedUser?.id])
      },
      onError: (err) => toast.error(err?.response?.data?.message ?? 'Cannot revoke system role'),
    }
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Assign Role to User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Step 1 — pick user */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Search User</label>
            <UserSearchCombobox onSelect={setSelectedUser} />
          </div>

          {/* Selected user info */}
          {selectedUser && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">
                  {selectedUser.staffProfile?.fullName ?? selectedUser.phoneNumber}
                </p>
                <p className="text-xs text-indigo-500 font-mono">{selectedUser.id}</p>
              </div>
            </div>
          )}

          {/* Current roles on this user */}
          {selectedUser && userRoles.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Current Roles</p>
              <div className="flex flex-wrap gap-2">
                {userRoles.map(r => (
                  <span key={r.id} className="flex items-center gap-1.5 pl-3 pr-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                    {r.displayName ?? r.name}
                    <button
                      onClick={() => revokeMut.mutate(r.id)}
                      disabled={revokeMut.isLoading}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Revoke role"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — pick role */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Role to Assign</label>
            <select
              className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
            >
              <option value="">Select a role…</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.displayName ?? r.name}</option>
              ))}
            </select>
          </div>

          {/* Optional validity window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Valid From (optional)</label>
              <input type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)}
                className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Valid Until (optional)</label>
              <input type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => assignMut.mutate()}
              disabled={!selectedUser || !roleId || assignMut.isLoading}
              className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {assignMut.isLoading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Plus className="w-4 h-4" /> Assign Role</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */

export default function RolesPage() {
  const navigate = useNavigate()
  const [showAssign, setShowAssign] = useState(false)

  const { data: rolesData, isLoading: rolesLoading } = useQuery('roles', rolesApi.getAll)
  const { data: permsData, isLoading: permsLoading } = useQuery('permissions', permissionsApi.getAll)

  const roles          = rolesData?.data?.data ?? rolesData?.data ?? []
  const allPermissions = permsData?.data?.data ?? permsData?.data ?? []

  const loading = rolesLoading || permsLoading

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-blue-600 mb-5 hover:underline">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Roles & Permissions</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Click a role to expand and manage its permissions. Assign roles to users below.
            </p>
          </div>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Assign Role
          </button>
        </div>

        {/* Role list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">All Roles</p>
            <p className="text-xs text-gray-400">{roles.length} roles · {allPermissions.length} permissions available</p>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <span className="text-sm text-gray-400 animate-pulse">Loading…</span>
            </div>
          )}

          {!loading && (
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
