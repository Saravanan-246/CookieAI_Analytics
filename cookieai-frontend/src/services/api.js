import axios from "axios";

/* ---------- BASE URL ---------- */
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ---------- AXIOS INSTANCE ---------- */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ---------- REQUEST INTERCEPTOR ---------- */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /* ✅ KEEP REAL-TIME BUT NOT AGGRESSIVE */
    config.headers["Cache-Control"] = "no-cache";

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------- RESPONSE INTERCEPTOR ---------- */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const isPublicApi =
      url.includes("/track") ||
      url.includes("/analytics") ||
      url.includes("/auth/login") ||
      url.includes("/auth/signup");

    if (status === 401 && !isPublicApi) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    if (status === 403) {
      console.error("Access forbidden:", error.response?.data);
    }

    if (status >= 500) {
      console.error("Server error:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

/* ---------- API METHODS ---------- */
export const apiRequest = {
  get: (url, config = {}) => api.get(url, config),

  post: (url, data = {}, config = {}) => api.post(url, data, config),

  put: (url, data = {}, config = {}) => api.put(url, data, config),

  patch: (url, data = {}, config = {}) => api.patch(url, data, config),

  delete: (url, config = {}) => api.delete(url, config),
};

export default api;