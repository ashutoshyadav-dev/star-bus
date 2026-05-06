import api from './client'

export const bookingApi = {
  create:         (data)       => api.post('/bookings', data),
  getById:        (id)         => api.get(`/bookings/${id}`),
  getByPnr:       (pnr)        => api.get(`/bookings/pnr/${pnr}`),
  getMine:        ()           => api.get('/bookings/my'),
  cancel:         (id, data)   => api.post(`/bookings/${id}/cancel`, data),
  adminGetBySchedule: (scheduleId) => api.get(`/bookings/admin/schedule/${scheduleId}`),
  adminCancel:    (id, data)   => api.post(`/bookings/admin/${id}/cancel`, data),
}

export const paymentApi = {
  initiate:       (data)       => api.post('/payments/initiate', data),
  getByBookingId: (bookingId)  => api.get(`/payments/booking/${bookingId}`),
  getById:        (id)         => api.get(`/payments/${id}`),
}

export const refundApi = {
  getByBookingId: (bookingId)  => api.get(`/refunds/booking/${bookingId}`),
  getById:        (id)         => api.get(`/refunds/${id}`),
  getPending:     ()           => api.get('/refunds/admin/pending'),
  process:        (data)       => api.post('/refunds/admin/process', data),
}

export const walletApi = {
  get:          ()     => api.get('/wallet'),
  topUp:        (data) => api.post('/wallet/topup', data),
  getStatement: (params) => api.get('/wallet/statement', { params }),
}
