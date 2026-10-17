import api from './client'

export const bookingApi = {
  create:         (data)       => api.post('/bookings', data),
  getById:        (id)         => api.get(`/bookings/${id}`),
  getByPnr:       (pnr)        => api.get(`/bookings/pnr/${pnr}`),
  getMine:        ()           => api.get('/bookings/my'),
  // latest unpaid booking for a journey (restore seats + details after a missed payment)
  getResumable:   (params)     => api.get('/bookings/resume', { params }),
  // edit name/age/gender of an unpaid booking, then pay again
  updatePassengers: (id, data) => api.put(`/bookings/${id}/passengers`, data),
  getMyDetails:       ()             => api.get('/bookings/my/details'),
  cancel:         (id, data)   => api.post(`/bookings/${id}/cancel`, data),
  adminGetBySchedule: (scheduleId) => api.get(`/bookings/admin/schedule/${scheduleId}`),
  adminGetByPnr: (pnr) => api.get(`/bookings/admin/pnr/${pnr}`),
  adminCancel:    (id, data)   => api.post(`/bookings/admin/${id}/cancel`, data),
   adminSearch:        (q)          => api.get('/bookings/admin/search', { params: { q, limit: 10 } }),
     downloadTicketUrl: (bookingId) => `${api.defaults.baseURL}/bookings/${bookingId}/ticket`,
}

export const paymentApi = {
  initiate:       (data)       => api.post('/payments/initiate', data),
  webhook:        (data)       => api.post('/payments/webhook', data),
  getByBookingId: (bookingId)  => api.get(`/payments/booking/${bookingId}`),
  getById:        (id)         => api.get(`/payments/${id}`),
}

export const refundApi = {
  getMine:        ()           => api.get('/refunds/my'),
  getByBookingId: (bookingId)  => api.get(`/refunds/booking/${bookingId}`),
  getById:        (id)         => api.get(`/refunds/${id}`),
  getAll:         ()           => api.get('/refunds/admin/all'),      
  getPending:     ()           => api.get('/refunds/admin/pending'),
  process:        (data)       => api.post('/refunds/admin/process', data),
  markCompleted:  (gwId)       => api.post('/refunds/webhook/completed', null,
                                    { params: { gatewayRefundId: gwId } }),
}

