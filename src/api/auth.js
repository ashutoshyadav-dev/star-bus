//
// Centralised auth API client.
//
// CHANGE LOG:
//   - requestOtp / registerPassenger / loginWithOtp now all accept explicit
//     `purpose` so the backend can enforce purpose-matching on OTP verification.
//   - Removed the silent register-on-404 fallback from loginWithOtp; that
//     logic now lives in LoginPage and is based on a clean user decision.

import api from "./client";

export const authApi = {
  // ── Step 1: Request OTP ───────────────────────────────────────────────────
  // purpose: "login" | "registration" | "password_reset" | "phone_change" | "aadhaar_verify" | "email_verify"
  // channel: "sms" | "whatsapp" | "voice_call" | "email"   (optional, defaults to sms)
  requestOtp: (data) => api.post("/auth/otp/request", data),

  // ── Step 2a: Complete passenger registration ──────────────────────────────
  // Body must include: phone, otp, requestId, purpose ("registration")
  registerPassenger: (data) => api.post("/auth/otp/verify/register", data),

  // ── Step 2b: Login an existing user via OTP ───────────────────────────────
  // Body must include: phone, otp, requestId, purpose ("login")
  loginWithOtp: (data) => api.post("/auth/otp/verify/login", data),

  // ── Staff login (phone + password) ───────────────────────────────────────
  loginStaff: (data) => api.post("/auth/staff/login", data),

  // ── Silent token refresh ──────────────────────────────────────────────────
  refreshToken: (data) => api.post("/auth/token/refresh", data),

  // ── Logout current session ────────────────────────────────────────────────
  logout: () => api.post("/auth/logout"),

  // ── Logout all devices ────────────────────────────────────────────────────
  logoutAll: () => api.post("/auth/logout/all"),
};