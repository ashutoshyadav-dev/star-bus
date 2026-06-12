import api from "./client";

export const profileApi = {
  // GET PROFILE
  getDetails: () =>
    api.get("/passenger/profile"),

  // UPDATE PROFILE
  editDetails: (data) =>
    api.patch("/passenger/profile", data),
};