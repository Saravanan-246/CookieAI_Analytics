const geoip = require("geoip-lite");

const Site = require("../models/site.model");
const Session = require("../models/session.model");
const Event = require("../models/event.model");
const { getIO } = require("../socket");

const { calculateSummary } = require("./analytics.controller");

/* ---------- DEBOUNCE CACHE ---------- */
const lastEmit = new Map();
const EMIT_DEBOUNCE = 1500; // 1.5 seconds

/* ---------- HELPERS ---------- */
const getDevice = (ua = "") => {
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
};

const getOS = (ua = "") => {
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/ipad|iphone|ipod/i.test(ua)) return "iOS";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
};

const getBrowser = (ua = "") => {
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edge/i.test(ua)) return "Edge";
  return "Unknown";
};

const getIP = (req) => {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "0.0.0.0";
};

const isBot = (ua = "") =>
  /bot|crawler|spider|crawling|preview/i.test(ua);

const getCountry = (ip) => {
  try {
    if (!ip || ip === "127.0.0.1" || ip === "::1") return "IN";
    const geo = geoip.lookup(ip);
    return geo?.country || "Unknown";
  } catch {
    return "Unknown";
  }
};

/* ---------- CONFIG ---------- */
const SESSION_TIMEOUT = 30 * 60 * 1000;

const ALLOWED_EVENT_TYPES = [
  "page_view",
  "heartbeat",
  "leave",
  "session_end",
  "page_time",
  "session_start"
];

/* ===================================================== */
/* ================= TRACK EVENT ======================== */
/* ===================================================== */
exports.trackEvent = async (req, res) => {
  try {
    console.log("📡 INCOMING BODY:", req.body);

    let {
      siteId,
      sessionId,
      eventType,
      path,
      url,
      device,
      userAgent,
      duration,
      environment
    } = req.body;

    const finalEnv = environment === "preview" ? "preview" : "production";

    /* ---------- VALIDATION ---------- */
    if (!siteId) {
      console.log("❌ MISSING SITE ID");
      return res.status(400).json({ success: false, message: "siteId required" });
    }

    /* ---------- DEFAULTS ---------- */
    eventType = eventType || "page_view";

    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      console.log("⚠️ INVALID EVENT TYPE:", eventType, "→ defaulting to page_view");
      eventType = "page_view";
    }

    const ua = userAgent || req.headers["user-agent"] || "";
    const finalDevice = getDevice(ua);

    if (isBot(ua)) {
      console.log("🤖 BOT DETECTED — IGNORE");
      return res.status(200).json({ success: true });
    }

    const ip = getIP(req);
    let country = "IN"; // fallback default

    if (ip !== "127.0.0.1" && ip !== "::1") {
      const geo = geoip.lookup(ip);
      country = geo?.country || "Unknown";
    }

    /* ---------- SESSION UPDATE ---------- */
    if (sessionId) {
      const sessionUpdate = {
        $set: {
          siteId,
          lastSeen: new Date(),
          device: finalDevice,
          country,
          environment: finalEnv
        }
      };

      // 🔥 only increment pages on actual page views
      if (eventType === "page_view") {
        sessionUpdate.$inc = { pageCount: 1 };
      }

      await Session.updateOne(
        { siteId, sessionId },
        sessionUpdate,
        { upsert: true }
      );

      console.log("🧠 SESSION UPDATED:", sessionId, "| TYPE:", eventType, "| ENV:", finalEnv);
    }

    /* ---------- SAVE EVENT ---------- */
    const saved = await Event.create({
      siteId: String(siteId),
      sessionId: String(sessionId || "anon"),
      type: eventType,
      path: path || "/",
      url: url || "",
      device: finalDevice,
      os: getOS(ua),
      browser: getBrowser(ua),
      userAgent: ua,
      country,
      environment: finalEnv,
      duration: duration ? Number(duration) : undefined,
      timestamp: new Date()
    });

    console.log("🔥 EVENT SAVED:", saved._id);
    console.log("📄 TYPE:", eventType, "| PATH:", path);

    /* ---------- SOCKET UPDATE ---------- */
    try {
      const io = getIO();
      
      // Live event is always immediate
      io.to(siteId).emit("live:event", {
        type: eventType,
        path: path || "/",
        device: finalDevice,
        country,
        timestamp: new Date()
      });

      // Debounce analytics summary updates
      const now = Date.now();
      const last = lastEmit.get(siteId) || 0;

      if (now - last > EMIT_DEBOUNCE) {
        lastEmit.set(siteId, now);
        
        // Use setImmediate to not block the response
        setImmediate(async () => {
          try {
            const summary = await calculateSummary(siteId);
            if (summary) {
              io.to(siteId).emit("analytics:update", summary);
              console.log("🚀 SOCKET EMITTED SUMMARY FOR:", siteId);
            }
          } catch (err) {
            console.error("⚠️ SUMMARY EMIT ERROR:", err);
          }
        });
      }
    } catch (e) {
      console.log("⚠️ SOCKET ERROR (ignored):", e.message);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("❌ TRACK ERROR:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};