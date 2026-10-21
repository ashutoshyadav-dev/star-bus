import api from "./client";

export const counterCancellationApi = {
  lookup: (pnr, reservationIds) =>
    api.get(`/counter/bookings/pnr/${encodeURIComponent(pnr.trim())}`, {
      params: reservationIds?.length ? { reservationIds: reservationIds.join(",") } : {},
    }),
  cancel: (pnr, payload) =>
    api.post(`/counter/bookings/pnr/${encodeURIComponent(pnr.trim())}/cancel`, payload),
};