const express = require("express");
const router = express.Router();

const siteController = require("../controllers/site.controller");
const auth = require("../middlewares/auth.middleware");
const rateLimiter = require("../middlewares/rateLimit.middleware");

/* ---------- MIDDLEWARE STACK ---------- */
const secure = [auth];                 // 🔐 required auth
const writeSecure = [auth, rateLimiter]; // 🔥 heavy ops protection

/* ---------- HEALTH ---------- */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "sites",
    status: "ok",
    uptime: process.uptime(),
  });
});

/* ---------- CREATE SITE ---------- */
/* 🔥 supports BOTH / and /create */
router.post(
  ["/", "/create"],
  ...writeSecure,
  siteController.createSite
);

/* ---------- GET ALL SITES ---------- */
/* 🔥 supports BOTH / and /list */
router.get(
  ["/", "/list"],
  ...secure,
  siteController.getSites
);

/* ---------- GET SINGLE SITE ---------- */
/* ⚠️ KEEP AFTER /list to avoid conflict */
router.get(
  "/:siteId",
  ...secure,
  siteController.getSiteById
);

/* ---------- GET TRACKING SCRIPT ---------- */
router.get(
  "/:siteId/script",
  ...secure,
  siteController.getScript
);

/* ---------- GET SITE STATUS ---------- */
router.get(
  "/:siteId/status",
  ...secure,
  siteController.getSiteStatus
);

/* ---------- ACTIVATE SITE TRACKING (PUBLIC) ---------- */
router.post(
  "/activate",
  siteController.activateSite
);

/* ---------- DELETE SITE ---------- */
router.delete(
  "/:siteId",
  ...writeSecure,
  siteController.deleteSite
);

module.exports = router;