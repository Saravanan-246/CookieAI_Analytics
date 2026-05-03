const express = require("express");
const router = express.Router();
const { trackEvent, trackBatch } = require("../controllers/track.controller");

/* ================= VALIDATION ================= */
const ensureBody = (req, res, next) => {
  if (!req.body || (typeof req.body === "string" && req.body.trim() === "")) {
    return res.status(400).json({ success: false, message: "Empty body" });
  }
  next();
};

/* ================= SINGLE EVENT ================= */
router.post("/", ensureBody, trackEvent);

/* ================= BATCH EVENTS ================= */
router.post("/batch", ensureBody, trackBatch);

/* ================= HEALTH ================= */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "tracking",
    status: "ok",
    time: new Date()
  });
});

module.exports = router;