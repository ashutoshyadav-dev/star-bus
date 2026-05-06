import api from './client'

export const rolesApi = {
  getAll:       ()               => api.get('/admin/roles'),
  getById:      (id)             => api.get(`/admin/roles/${id}`),
  getUserRoles: (userId)         => api.get(`/admin/roles/user/${userId}`),
  assign:       (data)           => api.post('/admin/roles/assign', data),
  revoke:       (userId, roleId) => api.delete(`/admin/roles/user/${userId}/role/${roleId}`),
}
