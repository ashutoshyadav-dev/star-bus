import api from "./client";
export const seatHoldApi = {
  sync:    (data)   => api.put("/seat-holds", data, { skipErrorToast: true }),     // callers show their own message
  get:     (id)     => api.get(`/seat-holds/${id}`, { skipErrorToast: true }),
  release: (id)     => api.delete(`/seat-holds/${id}`, { skipErrorToast: true }),
  /** page is closing → sendBeacon can only POST */
  releaseBeacon: (id) => {
    const base = api.defaults.baseURL, token = localStorage.getItem("accessToken");
    fetch(`${base}/seat-holds/${id}/release`, { method: "POST", keepalive: true,
      headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  },
};