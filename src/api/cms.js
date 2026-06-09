import api from "./client";

export const cmsApi = {

  // ─── Public ───────────────────────────────────────────────────────────────

  // GET ALL FAQS
  getAllFaqs: () =>
    api.get("/cms/faqs"),

  // GET FAQS BY CATEGORY
  getFaqsByCategory: (category) =>
    api.get(`/cms/faqs/${category}`),

  // ─── Admin ────────────────────────────────────────────────────────────────

  // CREATE FAQ  [cmsFaq:create]
  createFaq: (data) =>
    api.post("f/cms/aqs/admin", data),

  // UPDATE FAQ  [cmsFaq:update]
  updateFaq: (id, data) =>
    api.put(`/cms/faqs/admin/${id}`, data),

  // DELETE FAQ  [cmsFaq:delete]
  deleteFaq: (id) =>
    api.delete(`/cms/faqs/admin/${id}`),

  // ─── Timetable ────────────────────────────────────────────────────────────

  search: ({ fromStationId, toStationId, date, serviceType }) =>
    api.get("/timetable/search", {
      params: {
        fromStationId,
        toStationId,
        date,
        serviceType,
      },
    }),
 
  getRouteOfSchedule: ({ scheduleId }) => api.get(`/timetable/route/${scheduleId}`),




  //─── contact ────────────────────────────────────────────────────────────
  getContactByStationId: (id) =>
    api.get(`/admin/stations/contacts`),
};