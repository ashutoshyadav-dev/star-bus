import api from "./client";

export const grievanceApi = {

  // ─── Passenger ────────────────────────────────────────────────────────────

  // GET /grievances/my
  getMine: (status) =>
    api.get("/grievances/my", { params: status ? { status } : {} }),

  // GET /grievances/:id
  getById: (id) =>
    api.get(`/grievances/${id}`),

  // GET /grievances/ticket/:ticketNumber
  getByTicket: (ticketNumber) =>
    api.get(`/grievances/ticket/${ticketNumber}`),

  // POST /grievances
  file: (data) =>
    api.post("/grievances", data),

  // PATCH /grievances/:id/reopen
  reopen: (id) =>
    api.patch(`/grievances/${id}/reopen`),

  // PATCH /grievances/:id/rate
  rate: (id, data) =>
    api.patch(`/grievances/${id}/rate`, data),

  // ─── Admin ────────────────────────────────────────────────────────────────

  // GET /admin/grievances?status=&priority=&assignedTo=&page=&size=
  adminList: (params) =>
    api.get("/admin/grievances", { params }),

  // GET /admin/grievances/search?q=&limit=
  adminSearch: (q, limit = 20) =>
    api.get("/admin/grievances/search", { params: { q, limit } }),

  // GET /admin/grievances/:id
  adminGetById: (id) =>
    api.get(`/admin/grievances/${id}`),

  // GET /admin/grievances/ticket/:ticketNumber
  adminGetByTicket: (ticketNumber) =>
    api.get(`/admin/grievances/ticket/${ticketNumber}`),

  // PATCH /admin/grievances/:id/assign
  assign: (id, data) =>
    api.patch(`/admin/grievances/${id}/assign`, data),

  // PATCH /admin/grievances/:id/priority
  updatePriority: (id, data) =>
    api.patch(`/admin/grievances/${id}/priority`, data),

  // PATCH /admin/grievances/:id/in-progress
  markInProgress: (id) =>
    api.patch(`/admin/grievances/${id}/in-progress`),

  // PATCH /admin/grievances/:id/pending-passenger-info
  markPendingPassengerInfo: (id) =>
    api.patch(`/admin/grievances/${id}/pending-passenger-info`),

  // PATCH /admin/grievances/:id/escalate
  escalate: (id) =>
    api.patch(`/admin/grievances/${id}/escalate`),

  // PATCH /admin/grievances/:id/resolve
  resolve: (id, data) =>
    api.patch(`/admin/grievances/${id}/resolve`, data),

  // PATCH /admin/grievances/:id/close
  close: (id) =>
    api.patch(`/admin/grievances/${id}/close`),
};