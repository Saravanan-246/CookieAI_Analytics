/**
 * 🔥 Fallback Dashboard Data
 * Used when:
 * - no site selected
 * - API not loaded
 * - API error
 */

export const fallbackData = {
  /* ===== KPI ===== */
  activeUsers: 0,
  totalVisitors: 0,
  pageViews: 0,
  avgSession: 0,
  bounceRate: 0,

  /* ===== CHARTS ===== */
  traffic: [], // [{ time: "10 AM", visitors: 40 }]
  devices: [], // [{ name: "Mobile", value: 120 }]

  /* ===== TABLES ===== */
  countries: [], // [{ country, code, count }]

  /* ===== REALTIME ===== */
  liveEvents: [],

  /* ===== OPTIONAL META ===== */
  lastUpdated: null,
};