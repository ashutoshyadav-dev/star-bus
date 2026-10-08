import api from "./client";

export const tripChartApi = {
  // staff (counter / admin)
  getFull:     (scheduleId) => api.get(`/trip-charts/schedule/${scheduleId}`),
  share:       (scheduleId) => api.post(`/trip-charts/schedule/${scheduleId}/share`),
  fullPdfPath: (scheduleId) => `/trip-charts/schedule/${scheduleId}/pdf`,

  // passenger
  getMine:     (bookingId)  => api.get(`/trip-charts/my/booking/${bookingId}`),
  minePdfPath: (bookingId)  => `/trip-charts/my/booking/${bookingId}/pdf`,
};

// Fetch a PDF through the authenticated axios instance (so the JWT is attached)
// and save it. A plain <a href> would not send the Authorization header.
export async function downloadPdf(path, filename = "trip-chart.pdf") {
  const res = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}