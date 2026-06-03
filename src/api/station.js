import api from "./client";

export const stationApi = {
  getAllStations:    () => api.get("/admin/stations"),
  getActiveStations: () => api.get("/admin/stations/active"),
  getStationById:    (id) => api.get(`/admin/stations/${id}`),
  getByDepot:        (depotId) => api.get(`/admin/stations/depot/${depotId}`),

  createStation:     (data) => api.post("/admin/stations", data),
  updateStation:     (id, data) => api.put(`/admin/stations/${id}`, data),
};