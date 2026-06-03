import api from './client'

export const auditApi = {
  getAll:    (params)  => api.get('/admin/audit', { params }),
  getByUser: (userId, params) => api.get(`/admin/audit/user/${userId}`, { params }),
  getMine:   (params)  => api.get('/admin/audit/me', { params }),
}
