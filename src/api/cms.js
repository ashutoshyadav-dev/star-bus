import api from "./client";

const FILE_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "http://localhost:7000/apbus/api/v1";

export const buildImageUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith("http")) return relativePath;
  // encode each path segment to handle spaces and special chars
  const encoded = relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${FILE_BASE_URL}/public/files/${encoded}`;
};

export const cmsApi = {

  // ─── FAQs — Public ────────────────────────────────────────────────────────

  getAllFaqs: () =>
    api.get("/cms/faqs"),

  getFaqsByCategory: (category) =>
    api.get(`/cms/faqs/${category}`),

  // ─── FAQs — Admin ─────────────────────────────────────────────────────────

  createFaq: (data) =>
    api.post("/cms/faqs/admin", data),

  updateFaq: (id, data) =>
    api.put(`/cms/faqs/admin/${id}`, data),

  deleteFaq: (id) =>
    api.delete(`/cms/faqs/admin/${id}`),

  // ─── Timetable ────────────────────────────────────────────────────────────

  search: ({ fromStationId, toStationId, date, serviceType }) =>
    api.get("/timetable/search", {
      params: { fromStationId, toStationId, date, serviceType },
    }),

  getRouteOfSchedule: ({ scheduleId }) =>
    api.get(`/timetable/route/${scheduleId}`),

  // ─── Contact ──────────────────────────────────────────────────────────────

  getContactByStationId: () =>
    api.get("/admin/stations/contacts"),

  // ─── Gallery — Public ─────────────────────────────────────────────────────

  getActiveGallery: () =>
    api.get("/public/cms/gallery"),

  // ─── Gallery — Admin ──────────────────────────────────────────────────────

  adminGetAllGallery: () =>
    api.get("/admin/cms/gallery"),

  // file = File object, meta = { title, altText, sortOrder }
  adminUploadImage: (file, meta) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("meta", new Blob([JSON.stringify(meta)], { type: "application/json" }));
    return api.post("/admin/cms/gallery", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  adminActivateImage: (id) =>
    api.patch(`/admin/cms/gallery/${id}/activate`),

  adminDeactivateImage: (id) =>
    api.patch(`/admin/cms/gallery/${id}/deactivate`),

  adminDeleteImage: (id) =>
    api.delete(`/admin/cms/gallery/${id}`),

  // ─── Menu — Public ────────────────────────────────────────────────────────

  getActiveMenus: () =>
    api.get("/public/cms/menus"),

  // ─── Menu — Admin ─────────────────────────────────────────────────────────

  adminGetAllMenus: () =>
    api.get("/admin/cms/menus"),

  // data = { label, path, position, sortOrder, openInNewTab, isActive }
  adminCreateMenu: (data) =>
    api.post("/admin/cms/menus", data),

  // data = same shape as create
  adminUpdateMenu: (id, data) =>
    api.put(`/admin/cms/menus/${id}`, data),

  adminDeleteMenu: (id) =>
    api.delete(`/admin/cms/menus/${id}`),
  


  // ─── CMS Pages — Public ───────────────────────────────────────────────────────
getPage: (slug) => api.get(`/public/cms/pages/${slug}`),

// ─── CMS Pages — Admin ────────────────────────────────────────────────────────
adminGetAllPages:    ()          => api.get("/admin/cms/pages"),
adminGetPage:        (slug)      => api.get(`/admin/cms/pages/${slug}`),
adminCreatePage:     (data)      => api.post("/admin/cms/pages", data),
adminUpdatePage:     (id, data)  => api.put(`/admin/cms/pages/${id}`, data),
adminUpdateContent:  (id, content) => api.patch(`/admin/cms/pages/${id}/content`, content),
adminPublishPage:    (id)        => api.patch(`/admin/cms/pages/${id}/publish`),
adminUnpublishPage:  (id)        => api.patch(`/admin/cms/pages/${id}/unpublish`),
adminDeletePage:     (id)        => api.delete(`/admin/cms/pages/${id}`),

// Documents
adminGetDocuments:   (pageId)    => api.get(`/admin/cms/pages/${pageId}/documents`),
adminAddDocument:    (pageId, formData) => api.post(
  `/admin/cms/pages/${pageId}/documents`, formData,
  { headers: { "Content-Type": "multipart/form-data" } }
),
adminUploadDocFile:  (docId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.patch(`/admin/cms/documents/${docId}/upload`, fd,
    { headers: { "Content-Type": "multipart/form-data" } });
},
adminDeleteDocument: (docId) => api.delete(`/admin/cms/documents/${docId}`),

};