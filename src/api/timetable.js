import api from "./client";

/**
 * Public timetable APIs — no auth required (see PUBLIC_GET_PATHS on the
 * backend: /timetable/**). Powers the dynamic Bus Routes page.
 */
export const timetableApi = {
  search: (fromStationId, toStationId, date, serviceType) =>
    api.get("/timetable/search", {
      params: { fromStationId, toStationId, date, serviceType },
    }),

  getScheduleRoute: (scheduleId) =>
    api.get(`/timetable/route/${scheduleId}`),
};