const express = require("express");
const router = express.Router();

const siteController = require("../controllers/site.controller");
const auth = require("../middlewares/auth.middleware");
const rateLimiter = require("../middlewares/rateLimit.middleware");

/* ================= MIDDLEWARE ================= */
const secure = [auth];
const writeSecure = [auth, rateLimiter];

/* ================= VALIDATION ================= */
const validateSiteId = (req, res, next) => {
  const { siteId } = req.params;

  if (!siteId || typeof siteId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid siteId"
    });
  }

  next();
};

/* ================= SAFE WRAPPER ================= */
const safe = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    console.error("❌ Site route error:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= HEALTH ================= */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "sites",
    status: "ok",
    uptime: process.uptime()
  });
});

/* ================= CREATE SITE ================= */
router.post(
  ["/", "/create"],
  ...writeSecure,
  safe(siteController.createSite)
);

/* ================= GET ALL SITES ================= */
router.get(
  ["/", "/list"],
  ...secure,
  safe(siteController.getSites)
);

/* ================= GET SCRIPT ================= */
/* 🔥 KEEP BEFORE /:siteId */
router.get(
  "/:siteId/script",
  ...secure,
  validateSiteId,
  safe(siteController.getScript)
);

/* ================= GET STATUS ================= */
router.get(
  "/:siteId/status",
  ...secure,
  validateSiteId,
  safe(siteController.getSiteStatus)
);

/* ================= GET SINGLE SITE ================= */
/* 🔥 KEEP LAST (dynamic route) */
router.get(
  "/:siteId",
  ...secure,
  validateSiteId,
  safe(siteController.getSiteById)
);

/* ================= ACTIVATE (PUBLIC) ================= */
router.post(
  "/activate",
  rateLimiter,
  safe(siteController.activateSite)
);

/* ================= DELETE ================= */
router.delete(
  "/:siteId",
  ...writeSecure,
  validateSiteId,
  safe(siteController.deleteSite)
);

module.exports = router;