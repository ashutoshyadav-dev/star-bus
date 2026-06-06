import api from "./client";

export const notificationApi = {

  // ─── Passenger ────────────────────────────────────────────────────────────

  // GET OWN NOTIFICATIONS  [notification:view-own]
  // status: "pending" | "sent" | "read" | "failed" | undefined
  getMyNotifications: (status, page = 0, size = 20) => {
    const params = new URLSearchParams({ page, size });
    if (status) params.set("status", status);
    return api.get(`/notifications?${params}`);
  },

  // GET UNREAD COUNT  [notification:view-own]
  getUnreadCount: () =>
    api.get("/notifications/unread-count"),

  // MARK SINGLE NOTIFICATION READ  [notification:mark-read]
  markRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  // MARK ALL NOTIFICATIONS READ  [notification:mark-read]
  markAllRead: () =>
    api.patch("/notifications/read-all"),

  // ─── Admin ────────────────────────────────────────────────────────────────

  // GET FILTERED NOTIFICATION LIST  [notification:admin-view]
  // All params optional; userId is a UUID string
  adminList: (filters = {}, page = 0, size = 20) => {
    const { userId, status, channel, type } = filters;
    const params = new URLSearchParams({ page, size });
    if (userId)  params.set("userId",  userId);
    if (status)  params.set("status",  status);
    if (channel) params.set("channel", channel);
    if (type)    params.set("type",    type);
    return api.get(`/admin/notifications?${params}`);
  },

  // SEND MANUAL NOTIFICATION TO A USER  [notification:admin-send]
  adminSend: (data) =>
    api.post("/admin/notifications/send", data),
  // data: { userId, notificationType, channel, title, body, referenceType?, referenceId? }

  // BROADCAST TO MULTIPLE USERS / CHANNELS  [notification:broadcast]
  broadcast: (data) =>
    api.post("/admin/notifications/broadcast", data),
  // data: { targetUserIds[], channels[], notificationType, title, body }

  // RETRY FAILED / PENDING NOTIFICATIONS  [notification:admin-retry]
  retryFailed: (limit = 50) =>
    api.post(`/admin/notifications/retry?limit=${limit}`),
};