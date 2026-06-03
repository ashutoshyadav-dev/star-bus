/**
 * Complete refundApi — add this to your src/api/booking.js
 * replacing the existing refundApi export.
 *
 * Controller endpoints covered:
 *   GET  /refunds/my                   → refund:viewOwn  (add this endpoint — see INTEGRATION.md)
 *   GET  /refunds/booking/:bookingId   → refund:viewOwn
 *   GET  /refunds/:refundId            → refund:viewOwn
 *   GET  /refunds/admin/pending        → refund:viewAll
 *   POST /refunds/admin/process        → refund:process
 *   POST /refunds/webhook/completed    → admin / gateway
 */

export const refundApi = {
  /** Customer: get all my refunds (requires /refunds/my on backend) */
  getMine: () =>
    api.get('/refunds/my'),

  /** Customer: get refund for a specific booking */
  getByBookingId: (bookingId) =>
    api.get(`/refunds/booking/${bookingId}`),

  /** Customer: get refund by refund UUID */
  getById: (refundId) =>
    api.get(`/refunds/${refundId}`),

  /** Admin: all pending refunds */
  getPending: () =>
    api.get('/refunds/admin/pending'),

  /**
   * Admin: process a pending refund.
   * Body: { refundId: UUID, refundMethod: RefundMethod, gatewayRefundId?: string }
   */
  process: (data) =>
    api.post('/refunds/admin/process', data),

  /**
   * Admin / gateway webhook: mark refund completed.
   * Maps to: POST /refunds/webhook/completed?gatewayRefundId=...
   */
  markCompleted: (gatewayRefundId) =>
    api.post('/refunds/webhook/completed', null, {
      params: { gatewayRefundId },
    }),
}