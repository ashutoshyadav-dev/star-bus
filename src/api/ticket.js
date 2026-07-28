import api from "./client";

export const ticketApi = {
  validate: (qrCodeHash, currentStopStationId) =>
    api.post("/conductor/tickets/validate", { qrCodeHash, currentStopStationId }),
};

export const manifestApi = {
  get: (scheduleId) => api.get(`/conductor/manifest/${scheduleId}`),
  syncBoarding: (scheduleId, entries) =>
    api.post(`/conductor/manifest/${scheduleId}/sync-boarding`, entries),
};