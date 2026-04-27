import { apiRequest } from "./api";

export const authService = {
  /* ================= LOGIN ================= */
  login: async (credentials) => {
    try {
      const res = await apiRequest.post("/auth/login", credentials);

      const data = res?.data || res;

      if (!data?.token || !data?.user) {
        throw new Error("Invalid login response");
      }

      // 🔥 store token once
      localStorage.setItem("token", data.token);

      return data;
    } catch (error) {
      console.error("Login error");
      throw error;
    }
  },

  /* ================= SIGNUP ================= */
  signup: async (userData) => {
    try {
      const res = await apiRequest.post("/auth/signup", userData);

      const data = res?.data || res;

      if (!data?.token || !data?.user) {
        throw new Error("Invalid signup response");
      }

      // 🔥 auto login after signup
      localStorage.setItem("token", data.token);

      return data;
    } catch (error) {
      console.error("Signup error");
      throw error;
    }
  },

  /* ================= GET CURRENT USER ================= */
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return null;

      const res = await apiRequest.get("/auth/me");

      const data = res?.data || res;

      if (!data?.user) return null;

      return data;
    } catch (error) {
      console.warn("Auth restore failed");

      // 🔥 remove invalid token
      localStorage.removeItem("token");

      return null;
    }
  },

  /* ================= LOGOUT ================= */
  logout: () => {
    localStorage.removeItem("token");

    // 🔥 don't clear everything (important fix)
    // localStorage.clear(); ❌ REMOVE THIS

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  },
};

export default authService;