import { apiRequest } from "./api";

export const authService = {

  /* ================= LOGIN ================= */
  login: async (credentials) => {
    try {
      const res = await apiRequest.post("/auth/login", credentials);

      const data = res?.data || res;

      // ✅ store token
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /* ================= SIGNUP ================= */
  signup: async (userData) => {
    try {
      const res = await apiRequest.post("/auth/signup", userData);

      const data = res?.data || res;

      // ✅ auto login after signup (optional but good UX)
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  },

  /* ================= GET CURRENT USER ================= */
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return null; // ✅ no API call if not logged

      const res = await apiRequest.get("/auth/me");

      return res?.data || res;
    } catch (error) {
      console.error("Get user error:", error);
      return null; // ✅ safe fallback
    }
  },

  /* ================= LOGOUT ================= */
  logout: () => {
    localStorage.removeItem("token");

    // optional: clear everything
    localStorage.clear();

    // redirect
    window.location.href = "/login";
  },

};

export default authService;