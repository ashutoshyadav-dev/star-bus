import api from "./client";

/**
 * Dashboard APIs — backed by DashboardController on the backend.
 * Admin summary requires an admin role; user summary uses the logged-in
 * passenger's own JWT (no id needed, backend reads it from the token).
 */
export const dashboardApi = {
  getAdminSummary: () => api.get("/dashboard/admin/summary"),
  getUserSummary: () => api.get("/dashboard/user/summary"),

  // Triggers a CSV file download of bookings in the given date range
  // (defaults to the last 30 days when omitted).
  downloadAdminReport: async (from, to) => {
    const response = await api.get("/dashboard/admin/report", {
      params: { from, to },
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const disposition = response.headers["content-disposition"];
    const match = disposition && disposition.match(/filename="?([^"]+)"?/);
    link.download = match ? match[1] : `bookings-report-${to || "latest"}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};