import api from "./client";

export const specialCancellationApi = {
  // counter
  create:   (payload) => api.post("/special-cancellations", payload),
  mine:     ()        => api.get("/special-cancellations/mine"),
  withdraw: (id)      => api.post(`/special-cancellations/${id}/withdraw`),

  // admin
  list:         (status)          => api.get("/special-cancellations", { params: status ? { status } : {} }),
  pendingCount: ()                => api.get("/special-cancellations/pending-count"),
  preview:      (id, mode, value) => api.get(`/special-cancellations/${id}/preview`, { params: { mode, value } }),
  approve:      (id, payload)     => api.post(`/special-cancellations/${id}/approve`, payload),
  reject:       (id, reviewNote)  => api.post(`/special-cancellations/${id}/reject`, { reviewNote }),
};

export const counterRefundApi = {
  pending: ()                => api.get("/counter/refunds/pending"),
  pay:     (refundId, payload) => api.post(`/counter/refunds/${refundId}/pay`, payload),
};