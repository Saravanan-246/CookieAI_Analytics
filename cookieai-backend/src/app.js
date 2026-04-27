const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");

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
   🔥 SECURITY
======================================================= */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

/* =======================================================
   🔥 CORS (SMART + TRACKER SAFE)
======================================================= */
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (origin === clientUrl) {
        return callback(null, true);
      }

      return callback(null, true); // 🔥 allow tracker from ANY site
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

/* =======================================================
   🔥 BODY PARSING
======================================================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ---------- LOGGING ---------- */
app.use(morgan("dev"));

/* =======================================================
   🔥 TRACK FIX (VERY IMPORTANT)
======================================================= */

/* Accept ALL types (beacon + json + text) */
app.use("/api/track", express.text({ type: "*/*" }));

app.use("/api/track", (req, res, next) => {
  try {
    if (typeof req.body === "string" && req.body.length > 0) {
      req.body = JSON.parse(req.body);
    }

    /* 🔥 SUPPORT ARRAY (batch) */
    if (Array.isArray(req.body)) {
      req.body = req.body.filter(Boolean);
    }
  } catch (err) {
    console.error("Track parse error:", err.message);
    req.body = {};
  }

  next();
});

/* =======================================================
   🔥 STATIC (TRACKER FILE SERVE)
======================================================= */
const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

/* 🔥 FORCE tracker.js route (NO MORE 404 EVER) */
app.get("/tracker.js", (req, res) => {
  res.sendFile(path.join(publicPath, "tracker.js"));
});

/* ---------- RATE LIMIT ---------- */
app.use("/api/scan", rateLimiter);
app.use("/api/track", rateLimiter);

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sites", siteRoutes);

/* ---------- DEBUG ---------- */
const Event = require("./models/event.model");
app.get("/debug/events", async (req, res) => {
  const data = await Event.find().limit(10);
  res.json(data);
});

/* ---------- HEALTH ---------- */
app.get("/", (req, res) => {
  res.json({
    message: "CookieAI Backend Running 🚀",
    status: "OK",
  });
});

/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

/* ---------- ERROR ---------- */
app.use(errorHandler);

module.exports = app;