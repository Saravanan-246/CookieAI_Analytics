import { apiRequest } from "./api";

const analyticsService = {
  /* ================= SUMMARY ================= */
  getSummary: async (siteId, range = "7d") => {
    if (!siteId) return null;

    const res = await apiRequest.get("/analytics/summary", {
      params: { siteId, range },
    });

    return res.data;
  },

  /* ================= DASHBOARD ================= */
  getDashboard: async (siteId, range = "7d") => {
    if (!siteId) return null;

    const res = await apiRequest.get("/analytics/dashboard", {
      params: { siteId, range },
    });

    return res.data;
  },

  /* ================= 🔥 CHARTS FIX ================= */
  getCharts: async (siteId, range = "7d") => {
    if (!siteId) return null;

    const res = await apiRequest.get("/analytics/charts", {
      params: { siteId, range },
    });

    return res.data;
  },

  /* ================= PAGES ================= */
  getPageAnalytics: async (siteId) => {
    const res = await apiRequest.get(`/analytics/pages/${siteId}`);
    return res.data?.data || [];
  },

  /* ================= LIVE ================= */
  getLiveVisitors: async (siteId) => {
    const data = await analyticsService.getSummary(siteId);

    return {
      total: data?.stats?.visitors || 0,
      active: data?.stats?.activeUsers || 0,
      devices: data?.charts?.devices || [],
    };
  },

  /* ================= CLEAR ================= */
  clearAnalytics: async (siteId) => {
    return apiRequest.delete("/analytics/clear", {
      params: { siteId },
    });
  },

  /* ================= SETUP ================= */
  getSetupStatus: async (siteId) => {
    const res = await apiRequest.get(`/analytics/setup/${siteId}`);
    return res.data;
  },
};

export default analyticsService;