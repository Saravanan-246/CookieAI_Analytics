import api from "../../services/api";

/**
 * Get dashboard analytics
 * @param {string} siteId
 */
export const getDashboardData = async (siteId) => {
  try {
    if (!siteId) return null;

    // 🔥 Fetch dashboard base data + charts data for richer insights
    const [dashRes, chartRes, pagesRes] = await Promise.all([
      api.get(`/analytics/dashboard`, { params: { siteId } }),
      api.get(`/analytics/charts`, { params: { siteId } }),
      api.get(`/analytics/pages/${siteId}`)
    ]);

    const dash = dashRes?.data || {};
    const chart = chartRes?.data || {};
    const pages = pagesRes?.data?.data || [];

    // 🔥 Normalize data (important)
    return {
      totalVisitors: dash.totalVisitors || 0,
      activeUsers: dash.activeUsers || 0,
      pageViews: dash.totalPageViews || dash.pageViews || 0,
      sessions: dash.totalSessions || 0,
      bounceRate: dash.bounceRate || 0,

      traffic: chart.traffic || [],
      devices: dash.devices || chart.devices || [],
      countries: dash.countries || chart.countries || [],
      browsers: chart.browsers || [],
      topPages: pages || []
    };
  } catch (err) {
    console.error("Dashboard API error:", err);
    return null;
  }
};