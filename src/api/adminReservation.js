import api from "./client";

export const adminReservationApi = {
  // Create a new staff reservation
  create: (data) => api.post("/admin/staff-reservations", data),

  // Download or retrieve the reservation ticket
  ticket: (id) =>
    api.get(`/admin/staff-reservations/${id}/ticket`, {
      responseType: "blob",
    }),
};