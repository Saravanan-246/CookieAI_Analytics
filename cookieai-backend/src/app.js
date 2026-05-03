const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

/* ---------- ROUTES ---------- */
const authRoutes = require("./routes/auth.routes");
const scanRoutes = require("./routes/scan.routes");
const trackRoutes = require("./routes/track.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const siteRoutes = require("./routes/site.routes");

/* ---------- MIDDLEWARE ---------- */
const rateLimiter = require("./middlewares/rateLimit.middleware");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

/* =======================================================
   🔐 SECURITY (LIGHT + SAFE)
======================================================= */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

/* =======================================================
   🌐 CORS (ALLOW TRACKING + FRONTEND)
======================================================= */
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: true, // 🔥 allow all (needed for tracker SaaS)
    credentials: true,
  })
);

/* =======================================================
   📦 BODY PARSER (OPTIMIZED)
======================================================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =======================================================
   📡 TRACK PARSER (CRITICAL FIX)
======================================================= */
app.use("/api/track", express.text({ type: "*/*" }));

app.use("/api/track", (req, res, next) => {
  try {
    if (typeof req.body === "string" && req.body.length > 0) {
      req.body = JSON.parse(req.body);
    }

    // ensure array safety
    if (Array.isArray(req.body)) {
      req.body = req.body.filter(Boolean);
    }

  } catch (err) {
    console.error("❌ Track parse error:", err.message);
    req.body = {};
  }

  next();
});

/* =======================================================
   📁 STATIC TRACKER (FAST SERVE)
======================================================= */
const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

app.get("/tracker.js", (req, res) => {
  res.sendFile(path.join(publicPath, "tracker.js"));
});

/* =======================================================
   📡 PUBLIC SITE STATUS (FOR TRACKER - NO AUTH)
======================================================= */
const Site = require("./models/site.model");
app.get("/api/site/status", rateLimiter, async (req, res) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.json({ active: false });

    const site = await Site.findOne({ siteId, isDeleted: { $ne: true } })
      .select("siteId isActive")
      .lean();

    return res.json({ active: Boolean(site && site.isActive !== false) });
  } catch {
    return res.json({ active: false });
  }
});

/* =======================================================
   🚦 RATE LIMIT (IMPORTANT)
======================================================= */
app.use("/api/track", rateLimiter);
app.use("/api/scan", rateLimiter);

/* =======================================================
   🔗 ROUTES
======================================================= */
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sites", siteRoutes);

/* =======================================================
   ❤️ HEALTH CHECK
======================================================= */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "CookieAI Backend",
    time: new Date(),
  });
});

/* =======================================================
   ❌ 404
======================================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =======================================================
   ⚠️ ERROR HANDLER
======================================================= */
app.use(errorHandler);

module.exports = app;