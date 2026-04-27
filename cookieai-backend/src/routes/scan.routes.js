const express = require("express");
const router = express.Router();

const { scanWebsite } = require("../controllers/scan.controller");
const rateLimiter = require("../middlewares/rateLimit.middleware");

/* ---------- VALIDATION ---------- */
const validateUrl = (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL is required",
    });
  }

  try {
    new URL(url); // 🔥 built-in validation
    next();
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid URL",
    });
  }
};

/* ---------- ROUTES ---------- */

// 🔍 Scan a website (safe)
router.post(
  "/",
  rateLimiter,     // 🔥 prevent abuse
  validateUrl,     // 🔥 validate input
  scanWebsite
);

// ❤️ Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "scan",
    status: "ok",
    uptime: process.uptime(),
  });
});

module.exports = router;