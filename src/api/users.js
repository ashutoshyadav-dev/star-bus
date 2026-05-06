import api from './client'

export const usersApi = {
  getAll:              (params)        => api.get('/admin/users', { params }),
  getById:             (id)            => api.get(`/admin/users/${id}`),
  getPassengerProfile: (id)            => api.get(`/admin/users/${id}/passenger-profile`),
  getStaffProfile:     (id)            => api.get(`/admin/users/${id}/staff-profile`),
  createStaff:         (data)          => api.post('/admin/users/staff', data),
  suspend:             (id)            => api.post(`/admin/users/${id}/suspend`),
  activate:            (id)            => api.post(`/admin/users/${id}/activate`),
  delete:              (id)            => api.delete(`/admin/users/${id}`),

  // Passenger own profile
  getMyProfile:        ()              => api.get('/passenger/profile'),
  updateMyProfile:     (data)          => api.patch('/passenger/profile', data),
}
