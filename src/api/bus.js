import api from "./client";

// ── Bus Types ─────────────────────────────────────────────────────────────────
export const getAllBusTypes      = (activeOnly = false) => api.get(`/bus-types?activeOnly=${activeOnly}`);
export const getBusTypeById     = (id)                  => api.get(`/bus-types/${id}`);
export const getBusTypeByCode   = (code)                => api.get(`/bus-types/code/${code}`);
export const createBusType      = (payload)             => api.post("/bus-types", payload);
export const updateBusType      = (id, payload)         => api.put(`/bus-types/${id}`, payload);
export const deactivateBusType  = (id)                  => api.delete(`/bus-types/${id}`);

// ── Buses ─────────────────────────────────────────────────────────────────────
// export const getAllBuses         = (status)              => api.get(`/buses${status ? `?status=${status}` : ""}`);
export const getAllBuses = (status) => {
  console.trace("getAllBuses called");

  return api.get(
    `/buses${status ? `?status=${status}` : ""}`
  );
};
export const getBusById         = (id)                  => api.get(`/buses/${id}`);
export const getBusByRegistration = (regNumber)         => api.get(`/buses/registration/${regNumber}`);
export const getBusMaintenanceStatus = (id)             => api.get(`/buses/${id}/maintenance-status`);
export const createBus          = (payload)             => api.post("/buses", payload);
export const updateBus          = (id, payload)         => api.put(`/buses/${id}`, payload);
export const updateBusStatus    = (id, status)          => api.patch(`/buses/${id}/status?status=${status}`);
export const deactivateBus      = (id)                  => api.delete(`/buses/${id}`);
export const activateBus        = (id)                  =>api.patch(`/buses/${id}/activate`);

// ── Bus Seats ────────────────────────────────────────────────────────────────
export const getSeatsByBus = (busId,activeOnly = false) =>api.get(`/busSeat/buses/${busId}/seats`, {params: {activeOnly,},});
export const getSeatById        = (id)                  => api.get(`/busSeat/bus-seats/${id}`);
export const createSeat         = (payload)             => api.post("/busSeat/bus-seats", payload);
export const bulkCreateSeats    = (requests)            => api.post("/busSeat/bus-seats/bulk", requests);
export const updateSeat         = (id, payload)         => api.put(`/busSeat/bus-seats/${id}`, payload);
export const deactivateSeat     = (id)                  => api.delete(`/busSeat/bus-seats/${id}`);

// ── Maintenance Records ───────────────────────────────────────────────────────
export const getMaintenanceByBus   = (busId, activeOnly = false) => api.get(`/maintenances/buses/${busId}/maintenance?activeOnly=${activeOnly}`);
export const getMaintenanceById    = (id)               => api.get(`/maintenances/maintenance/${id}`);
export const createMaintenance     = (payload)          => api.post("/maintenances/maintenance", payload);
export const updateMaintenance     = (id, payload)      => api.put(`/maintenances/maintenance/${id}`, payload);
export const completeMaintenance   = (id, completedAt)  => api.patch(`/maintenances/maintenance/${id}/complete${completedAt ? `?completedAt=${completedAt}` : ""}`);
