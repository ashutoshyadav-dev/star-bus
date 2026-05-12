// import axios from "axios";
// import toast from "react-hot-toast";

// const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7000/apbus/api/v1";

// const api = axios.create({
//   baseURL: BASE_URL,
//   headers: { "Content-Type": "application/json" },
//   timeout: 15000,
// });

// // ── Request interceptor: attach access token ──────────────────────────────
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ── Response interceptor: silent token refresh on 401 ────────────────────
// let isRefreshing = false;
// let refreshQueue = [];

// const processQueue = (error, token = null) => {
//   refreshQueue.forEach((prom) =>
//     error ? prom.reject(error) : prom.resolve(token)
//   );
//   refreshQueue = [];
// };

// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const original = error.config;
//     const skipUrls = ["/auth/logout", "/auth/token/refresh", "/auth/staff/login"];
//     const isSkipped = skipUrls.some((u) => original.url?.includes(u));

//     if (error.response?.status === 401 && !original._retry && !isSkipped) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           refreshQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             original.headers.Authorization = `Bearer ${token}`;
//             return api(original);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       original._retry = true;
//       isRefreshing = true;

//       try {
//         const refreshToken = localStorage.getItem("refreshToken");
//         if (!refreshToken) throw new Error("No refresh token");

//         const { data } = await api.post("/auth/token/refresh", { refreshToken });
//         const { accessToken, refreshToken: newRefresh } = data.data;

//         localStorage.setItem("accessToken", accessToken);
//         localStorage.setItem("refreshToken", newRefresh);
//         api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
//         processQueue(null, accessToken);

//         original.headers.Authorization = `Bearer ${accessToken}`;
//         return api(original);
//       } catch (refreshError) {
//         processQueue(refreshError, null);
//         localStorage.clear();
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     if (error.response?.status !== 401) {
//       const msg = error.response?.data?.message || "Something went wrong";
//       toast.error(msg);
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7000/apbus/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", //adding this just to remove cors error due to rgnok
  },
  timeout: 15000,
});

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: silent token refresh on 401 ────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const skipUrls = ["/auth/logout", "/auth/token/refresh", "/auth/staff/login"];
    const isSkipped = skipUrls.some((u) => original.url?.includes(u));

    if (error.response?.status === 401 && !original._retry && !isSkipped) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await api.post("/auth/token/refresh", { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
       } 
      // catch (refreshError) {
      //   processQueue(refreshError, null);
      //   localStorage.clear();
      //   window.location.href = "/login";
      //   return Promise.reject(refreshError);
      // } 
      catch (refreshError) {
            processQueue(refreshError, null);
            const hadSession = !!localStorage.getItem("refreshToken");
            localStorage.clear();
            if (hadSession) {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
      }
      finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status !== 401) {
      const msg = error.response?.data?.message || "Something went wrong";
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export default api;