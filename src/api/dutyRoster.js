import api from "./client";

export const dutyRosterApi = {
  roster:       (params)            => api.get("/duty-assignments/roster", { params }),
  lookupRoutes: ()                  => api.get("/duty-assignments/lookup/routes"),
  lookupStaff:  (role, date)        => api.get("/duty-assignments/lookup/staff", { params: { role, date } }),
  assign:       (payload)           => api.post("/duty-assignments", payload),
  reassign:     (id, staffUserId)   => api.patch(`/duty-assignments/${id}/reassign`, { staffUserId }),
  unassign:     (id)                => api.delete(`/duty-assignments/${id}`),
};