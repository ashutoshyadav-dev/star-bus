import api from "./client";

export const getAllRoutes         = ()           => api.get("/admin/routes");
export const getRouteById        = (id)         => api.get(`/admin/routes/${id}`);
export const getRouteDetail      = (id)         => api.get(`/admin/routes/${id}/detail`);
export const getRoutesByStatus   = (status)     => api.get(`/admin/routes/status/${status}`);
export const getRoutesByType     = (type)       => api.get(`/admin/routes/type/${type}`);
export const getRoutesByDepot    = (depotId)    => api.get(`/admin/routes/depot/${depotId}`);
export const createRoute         = (payload)    => api.post("/admin/routes", payload);
export const updateRoute         = (id, payload)=> api.put(`/admin/routes/${id}`, payload);
export const suspendRoute        = (id, payload)=> api.post(`/admin/routes/${id}/suspend`, payload);
export const activateRoute       = (id)         => api.post(`/admin/routes/${id}/activate`);

// Stops
export const getStops            = (routeId)          => api.get(`/admin/routes/${routeId}/stops`);
export const addStop             = (routeId, payload)  => api.post(`/admin/routes/${routeId}/stops`, payload);
export const updateStop          = (stopId, payload)   => api.put(`/admin/routes/stops/${stopId}`, payload);
export const removeStop          = (stopId)            => api.delete(`/admin/routes/stops/${stopId}`);

// Via Points
export const getViaPoints        = (routeId)          => api.get(`/admin/routes/${routeId}/via-points`);
export const addViaPoint         = (routeId, payload)  => api.post(`/admin/routes/${routeId}/via-points`, payload);
export const removeViaPoint      = (viaPointId)        => api.delete(`/admin/routes/via-points/${viaPointId}`);