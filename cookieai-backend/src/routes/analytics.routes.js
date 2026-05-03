const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analytics.controller");

/* 🔥 CORRECT TRACK CONTROLLER */
const { trackEvent } = require("../controllers/track.controller");

const auth = require("../middlewares/auth.middleware");
const rateLimiter = require("../middlewares/rateLimit.middleware");

/* ---------- HANDLERS ---------- */
const {
  getSummary,
  getCharts,
  getDashboardData,
  clearAnalytics,
  getSetupStatus,
  getPageAnalytics,
  getLiveEvents
} = analyticsController;

/* ---------- OPTIONAL AUTH ---------- */
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return auth(req, res, next);
  }
  return next();
};

/* ---------- VALIDATION ---------- */
const validateSiteId = (req, res, next) => {
  const { siteId } = req.query;

  if (!siteId || typeof siteId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Valid siteId required",
    });
  }

  if (["dashboard", "undefined", "null"].includes(siteId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid siteId",
    });
  }

  next();
};

/* ---------- SAFE WRAPPER ---------- */
const safe = (handler) => (req, res, next) => {
  try {
    return handler(req, res, next);
  } catch (err) {
    console.error("Route error:", err.message);
    return res.status(500).json({ success: false });
  }
};

/* =======================================================
   ❤️ HEALTH
======================================================= */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "analytics",
    status: "ok",
    uptime: process.uptime(),
  });
});

/* =======================================================
   🔥 REMOVE THIS (IMPORTANT)
   ❌ DO NOT HANDLE TRACK HERE
   👉 tracking handled in /api/track routes
======================================================= */
// ❌ DELETE THIS COMPLETELY
// router.post("/track", rateLimiter, safe(trackEvent));

/* =======================================================
   📊 SUMMARY
======================================================= */
router.get(
  "/summary",
  optionalAuth,
  rateLimiter,
  validateSiteId,
  safe(getSummary)
);

/* =======================================================
   📄 PAGES
======================================================= */
router.get(
  "/pages/:siteId",
  optionalAuth,
  rateLimiter,
  safe(getPageAnalytics)
);

/* =======================================================
   🔴 LIVE EVENTS
======================================================= */
router.get(
  "/live",
  optionalAuth,
  rateLimiter,
  validateSiteId,
  safe(getLiveEvents)
);

/* =======================================================
   📈 CHARTS
======================================================= */
router.get(
  "/charts",
  optionalAuth,
  rateLimiter,
  validateSiteId,
  safe(getCharts)
);

/* =======================================================
   📊 DASHBOARD
======================================================= */
router.get(
  "/dashboard",
  optionalAuth,
  rateLimiter,
  validateSiteId,
  safe(getDashboardData)
);

/* =======================================================
   🧹 CLEAR
======================================================= */
router.delete(
  "/clear",
  auth,
  rateLimiter,
  validateSiteId,
  safe(clearAnalytics)
);

/* =======================================================
   ⚙️ SETUP STATUS
======================================================= */
router.get(
  "/setup/:siteId",
  optionalAuth,
  rateLimiter,
  safe(getSetupStatus)
);

module.exports = router;