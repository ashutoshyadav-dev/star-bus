import api from "./client";

export const adminReservationApi = {
  create: (data) => api.post("/admin/staff-reservations", data),
};