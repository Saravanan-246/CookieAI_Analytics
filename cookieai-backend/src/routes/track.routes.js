const express = require("express");
const router = express.Router();
const { trackEvent, trackBatch } = require("../controllers/track.controller");

const TRACKING_ENABLED = process.env.TRACKING_ENABLED !== "false";

const guardTracking = (req, res, next) => {
  if (!TRACKING_ENABLED) return res.status(204).end();
  next();
};

/* ================= VALIDATION ================= */
const ensureBody = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({ success: false, message: "Empty body" });
  }
  next();
};

/* ================= SINGLE EVENT ================= */
router.post("/", guardTracking, ensureBody, trackEvent);

/* ================= BATCH EVENTS (MAIN) ================= */
router.post("/batch", guardTracking, ensureBody, trackBatch);

/* ================= HEALTH ================= */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "tracking",
    status: "ok"
  });
});

module.exports = router;