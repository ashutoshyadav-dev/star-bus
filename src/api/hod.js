import api from "./client";

/** Head of Department dashboard — backed by HodDashboardController (/dashboard/hod). */
export const hodApi = {
  getSummary: (from, to) => api.get("/dashboard/hod/summary", { params: { from, to } }),

  // CSV exports: revenue | routes | depots | refunds | grievances
  downloadReport: async (type, from, to) => {
    const response = await api.get(`/dashboard/hod/report/${type}`, {
      params: { from, to },
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const disposition = response.headers["content-disposition"];
    const match = disposition && disposition.match(/filename="?([^"]+)"?/);
    link.download = match ? match[1] : `hod-${type}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
