import api from "./client";

export const counterApi = {
  lookupPassenger: (phoneNumber) =>
    api.get("/counter/passengers/lookup", { params: { phoneNumber } }),

  quickRegisterPassenger: (data) =>
    api.post("/counter/passengers/quick-register", data),

  createBooking: (data) =>
    api.post("/counter/bookings", data),

  getMyBookings: () =>
    api.get("/counter/bookings/my"),

  collectPayment: (data) =>
    api.post("/counter/payments/collect", data),

    downloadTicketUrl: (bookingId) => `${api.defaults.baseURL}/counter/bookings/${bookingId}/ticket`,

      cancelBooking: (bookingId, data) =>
    api.post(`/counter/bookings/${bookingId}/cancel`, data),
};