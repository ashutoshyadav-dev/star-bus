import api from "./client";

export const depotApi = {
  getAllDepots:        () => api.get("/admin/depots"),
  getActiveDepots:     () => api.get("/admin/depots/active"),
  getDepotById:        (id) => api.get(`/admin/depots/${id}`),
  getDepotByCode:      (code) => api.get(`/admin/depots/code/${code}`),
  getDepotsByType:     (type) => api.get(`/admin/depots/type/${type}`),
  getDepotsByDistrict: (district) => api.get(`/admin/depots/district/${district}`),

  createDepot:         (payload) => api.post("/admin/depots", payload),
  updateDepot:         (id, payload) => api.put(`/admin/depots/${id}`, payload),
};