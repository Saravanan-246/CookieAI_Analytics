const express = require("express");
const router = express.Router();

const { trackEvent } = require("../controllers/track.controller");

/* =======================================================
   🔥 SINGLE EVENT (DIRECT DB SAVE)
======================================================= */
router.post("/", trackEvent);

/* =======================================================
   🔥 BATCH EVENTS (Not strictly supported in new flow, but mapped to controller)
======================================================= */
// If batch is still needed, the controller now handles individual items anyway, 
// but to be safe we can point /batch to trackEvent if you update trackEvent to handle arrays,
// or just return 200 for now. For a fully clean slate, we map it directly:
router.post("/batch", trackEvent);

/* =======================================================
   🔥 HEALTH CHECK
======================================================= */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "tracking",
    status: "ok",
  });
});

module.exports = router;