import api from "./client";

export const authApi = {
  // Step 1 – request OTP (purpose: "registration" | "LOGIN")
  requestOtp:        (data) => api.post("/auth/otp/request", data),

  // Step 2 – register a brand-new passenger (first-time OTP verify)
  registerPassenger: (data) => api.post("/auth/otp/verify/register", data),

  // Step 2 – login an existing user via OTP
  loginWithOtp:      (data) => api.post("/auth/otp/verify/login", data),

  // Staff login (phone + password)
  loginStaff:        (data) => api.post("/auth/staff/login", data),

  // Silent token refresh
  refreshToken:      (data) => api.post("/auth/token/refresh", data),

  // Logout current session
  logout:            ()     => api.post("/auth/logout"),

  // Logout all devices
  logoutAll:         ()     => api.post("/auth/logout/all"),
};
