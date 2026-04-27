import { apiRequest } from "./api";

/* ---------- SERVICE ---------- */
const analyticsService = {

  /* 🔥 MAIN SUMMARY - ONLY SOURCE OF TRUTH */
  getSummary: async (siteId, range = "7d", env = "all") => {
    if (!siteId) {
      throw new Error("siteId required");
    }

    try {
      const params = { siteId, range };
      if (env && env !== "all") params.env = env;

      const res = await apiRequest.get("/analytics/summary", { params });

      return res?.data || res;
    } catch (error) {
      console.error("❌ Summary API error:", error);
      throw error; // 🔥 IMPORTANT → don't hide errors
    }
  },

  /* ================= LIVE VISITORS ================= */
  getLiveVisitors: async (siteId) => {
    try {
      const data = await analyticsService.getSummary(siteId);

      return {
        total: data?.totalVisitors ?? 0,   // ✅ FIXED
        active: data?.activeUsers ?? 0,
        devices: data?.devices ?? {},
      };
    } catch (error) {
      console.error("Live visitors error:", error);
      return { total: 0, active: 0, devices: {} };
    }
  },

  /* ================= TOP PAGES ================= */
  getTopPages: async (siteId) => {
    try {
      const data = await analyticsService.getSummary(siteId);
      return data?.topPages ?? {};
    } catch (error) {
      console.error("Top pages error:", error);
      return {};
    }
  },

  /* ================= DEVICES ================= */
  getDeviceAnalytics: async (siteId) => {
    try {
      const data = await analyticsService.getSummary(siteId);
      return data?.devices ?? {};
    } catch (error) {
      console.error("Device analytics error:", error);
      return {};
    }
  },

  /* ================= CLEAR ANALYTICS ================= */
  clearAnalytics: async (siteId) => {
    if (!siteId) {
      throw new Error("siteId required");
    }

    try {
      const res = await apiRequest.delete("/analytics/clear", {
        params: { siteId },
      });

      return res?.data || res;
    } catch (error) {
      console.error("❌ Clear analytics error:", error);
      throw error;
    }
  },
};

export default analyticsService;