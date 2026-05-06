import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { rolesApi } from '../../api/roles'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'

export default function RolesPage() {
  const qc = useQueryClient()
  const [showAssign, setShowAssign] = useState(false)
  const [form, setForm] = useState({ userId: '', roleId: '', expiresAt: '' })

  const { data: rolesData, isLoading } = useQuery('roles', rolesApi.getAll)
  const roles = rolesData?.data?.data ?? []

  const assignMut = useMutation(d => rolesApi.assign(d), {
    onSuccess: () => { toast.success('Role assigned'); setShowAssign(false); setForm({ userId: '', roleId: '', expiresAt: '' }) }
  })

  const columns = [
    { key: 'id',          label: 'ID',          render: r => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'name',        label: 'Role Name',   render: r => <span className="font-medium text-surface-200">{r.name}</span> },
    { key: 'displayName', label: 'Display',     render: r => r.displayName ?? r.name },
    { key: 'isSystem',    label: 'System Role', render: r => r.isSystem
        ? <span className="badge-blue">System</span>
        : <span className="badge-gray">Custom</span> },
    { key: 'permissions', label: 'Permissions', render: r =>
        <span className="text-xs text-surface-400">{r.permissions?.length ?? 0} permissions</span> },
  ]

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Manage system roles and user assignments"
        actions={
          <button onClick={() => setShowAssign(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Assign Role
          </button>
        }
      />

      <div className="card mb-4">
        <div className="px-4 py-3 border-b border-surface-700">
          <h2 className="text-sm font-medium text-surface-200">System Roles</h2>
        </div>
        <Table columns={columns} data={roles} loading={isLoading} />
      </div>

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Role to User">
        <form onSubmit={e => { e.preventDefault(); assignMut.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">User ID</label>
            <input className="input font-mono text-xs" placeholder="UUID" value={form.userId}
              onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Role</label>
            <select className="input" value={form.roleId}
              onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))} required>
              <option value="">Select role...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.displayName ?? r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Expires At (optional)</label>
            <input className="input" type="datetime-local" value={form.expiresAt}
              onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowAssign(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={assignMut.isLoading} className="btn-primary flex-1 flex justify-center">
              {assignMut.isLoading ? <Spinner size="sm" /> : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
