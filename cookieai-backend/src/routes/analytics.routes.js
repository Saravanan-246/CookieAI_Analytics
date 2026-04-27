const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const analyticsController = require("../controllers/analytics.controller");

const auth = require("../middlewares/auth.middleware");
const rateLimiter = require("../middlewares/rateLimit.middleware");

/* ---------- SAFE HANDLERS ---------- */
const getSummary = analyticsController.getSummary;
const getCharts = analyticsController.getCharts;
const clearAnalytics = analyticsController.clearAnalytics;

/* ---------- OPTIONAL AUTH ---------- */
const optionalAuth = (req, res, next) => {
  try {
    if (req.headers.authorization) {
      return auth(req, res, next);
    }
    return next();
  } catch (err) {
    return next();
  }
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

  // Reject invalid siteId values
  if (siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
    return res.status(400).json({
      success: false,
      message: "Invalid siteId",
    });
  }

  next();
};

/* ---------- SAFE ROUTE WRAPPER ---------- */
const safe = (handler) => (req, res, next) => {
  if (typeof handler !== "function") {
    return res.status(500).json({
      success: false,
      message: "Handler not found",
    });
  }
  return handler(req, res, next);
};

/* ---------- HEALTH ---------- */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "analytics",
    status: "ok",
    uptime: process.uptime(),
  });
});

/* ---------- SUMMARY ---------- */
router.get(
  "/summary",
  optionalAuth,
  rateLimiter,
  validateSiteId,
  safe(getSummary)
);

/* ---------- CHARTS ---------- */
router.get(
  "/charts",
  optionalAuth,
  rateLimiter,
  validateSiteId,
  safe(getCharts) // 
);

/* ---------- CLEAR ANALYTICS ---------- */
router.delete(
  "/clear",
  auth,
  rateLimiter,
  validateSiteId,
  safe(clearAnalytics)
);

module.exports = router;