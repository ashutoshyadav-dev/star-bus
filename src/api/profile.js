import api from "./client";

export const profileApi = {
  // GET PROFILE
  getDetails: () =>
    api.get("/passenger/profile"),

  // UPDATE PROFILE
  editDetails: (data) =>
    api.patch("/passenger/profile", data),

  uploadPhoto: (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/passenger/profile/photo", fd, {
    headers: { "Content-Type": "multipart/form-data" },   // same pattern as api/bus.js
  });
},

};