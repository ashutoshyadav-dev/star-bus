import api from './client'

export const rolesApi = {
  // Roles
  getAll:       ()               => api.get('/admin/roles'),
  getById:      (id)             => api.get(`/admin/roles/${id}`),
  getUserRoles: (userId)         => api.get(`/admin/roles/user/${userId}`),
  assign:       (data)           => api.post('/admin/roles/assign', data),
  revoke:       (userId, roleId) => api.delete(`/admin/roles/user/${userId}/role/${roleId}`),

  // Permissions on a role
  addPermission: (roleId, permissionId) =>
    api.post(`/admin/roles/${roleId}/permissions/${permissionId}`),

  removePermission: (roleId, permissionId) =>
    api.delete(`/admin/roles/${roleId}/permissions/${permissionId}`),
}

export const permissionsApi = {
  getAll: () => api.get('/admin/permissions'),
}