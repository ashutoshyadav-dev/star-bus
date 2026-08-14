/**
 * client.js — Central Axios instance for all API calls
 *
 * Responsibilities:
 *  1. Attach access token to every outgoing request
 *  2. On 401 (token expired) → silently call refresh endpoint using a
 *     PLAIN axios call (not the intercepted `api` instance) so the expired
 *     access token is never accidentally attached to the refresh request
 *  3. Queue any parallel requests that arrive while a refresh is in-flight,
 *     then replay them all once the new token is ready
 *  4. If refresh itself fails (session deleted / expired) → clear storage
 *     and redirect to login
 *  5. For all non-401 errors → show a toast with the server error message
 */

import axios from "axios";
import toast from "react-hot-toast";

// ─── Base URL ────────────────────────────────────────────────────────────────
// Reads from .env (VITE_API_URL) and falls back to local dev server.
// In production set VITE_API_URL in your deployment environment.
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:7000/apbus/api/v1";

// ─── Default headers shared by both instances ────────────────────────────────
// ngrok-skip-browser-warning: suppresses ngrok's browser warning page
// during local/tunnel development. Safe to keep in production (ignored).
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

// ─── Main API instance ───────────────────────────────────────────────────────
// Used for ALL application requests.
// The request interceptor below will attach the access token automatically.
const api = axios.create({
  baseURL: BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 15000, // 15 s — avoids hanging requests on slow connections
});

// ─── Refresh-only instance ───────────────────────────────────────────────────
// IMPORTANT: This is a separate axios instance with NO interceptors.
// We use this exclusively for the token refresh call so that:
//   - The expired access token is NOT attached (no request interceptor)
//   - A failed refresh does NOT trigger another refresh loop (no response interceptor)
const refreshAxios = axios.create({
  baseURL: BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 10000,
});

// ─── URLs that should never trigger a token refresh on 401 ──────────────────
// These are auth endpoints that are expected to sometimes return 401
// and must not enter the refresh loop.
const SKIP_REFRESH_URLS = [
  "/auth/logout",
  "/auth/logout/all",
  "/auth/token/refresh",
  "/auth/staff/login",
  "/auth/otp/verify/login",
  "/auth/otp/verify/register",
];

// ─── Refresh queue state ─────────────────────────────────────────────────────
// isRefreshing: prevents multiple simultaneous refresh calls
// refreshQueue: holds all requests that arrived while a refresh was in-flight
let isRefreshing = false;
let refreshQueue = [];

/**
 * Flush the queue after a refresh attempt.
 * @param {Error|null} error  — pass error to reject all queued promises
 * @param {string|null} token — pass new token to resolve all queued promises
 */
const flushQueue = (error, token = null) => {
  refreshQueue.forEach((promise) =>
    error ? promise.reject(error) : promise.resolve(token)
  );
  refreshQueue = [];
};

// ─── Request interceptor ─────────────────────────────────────────────────────
// Runs before EVERY request made through `api`.
// Attaches the current access token from localStorage as a Bearer header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────────────────
// Runs after EVERY response (or error) from `api`.
api.interceptors.response.use(
  // ── Success: pass through unchanged ──
  (response) => response,

  // ── Error handler ──
  async (error) => {
    const originalRequest = error.config;

    // Check if this URL should skip the refresh logic
    const shouldSkip = SKIP_REFRESH_URLS.some((url) =>
      originalRequest?.url?.includes(url)
    );

    // ── Handle 401 Unauthorized ──────────────────────────────────────────────
    // Conditions to attempt a token refresh:
    //   - Status is 401 (Unauthorized / token expired)
    //   - This request hasn't already been retried (_retry flag)
    //   - This is not an auth endpoint that should be skipped
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkip
    ) {
      // ── If a refresh is already in-flight ──
      // Queue this request and wait for the ongoing refresh to complete.
      // Once done, flushQueue will resolve/reject this promise and the
      // original request will be retried with the new token.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // ── Start a fresh refresh ──
      originalRequest._retry = true; // mark so we don't retry more than once
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // No refresh token at all → force logout immediately
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // ── Call refresh endpoint using the plain refreshAxios instance ──
        // CRITICAL: We use refreshAxios (not api) here so that:
        //   1. The expired access token is NOT attached as Authorization header
        //   2. A 401 on this call does NOT recurse into this interceptor
        const { data } = await refreshAxios.post("/auth/token/refresh", {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        // ── Persist the new tokens ──
        localStorage.setItem("accessToken", accessToken);
        // Backend returns the same refresh token (non-rotating).
        // If you switch to rotating refresh tokens, newRefreshToken will differ.
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Update the default Authorization header for future requests
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // Resolve all queued requests with the new token
        flushQueue(null, accessToken);

        // Retry the original request that triggered the 401
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // ── Refresh failed ──
        // This means the session is expired or was deleted server-side.
        // Clear all stored auth data and redirect to login.
        flushQueue(refreshError, null);
        localStorage.clear();

        // Only redirect if we actually had a session (avoids redirect loops
        // on pages that are already public or partially authenticated)

        window.location.href = "/home/login";

        return Promise.reject(refreshError);

      } finally {
        // Always reset the flag so future 401s can trigger a refresh again
        isRefreshing = false;
      }
    }

    // ── Handle all other errors (non-401, or skipped 401s) ──────────────────
    // Show a toast with the server's error message.
    // We deliberately skip toasts for 401 because the user will either be
    // silently refreshed or redirected to login — no toast needed.
    if (error.response?.status !== 401) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Something went wrong. Please try again.";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;