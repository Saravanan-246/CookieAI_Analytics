const geoip = require("geoip-lite");

const Site = require("../models/site.model");
const Session = require("../models/session.model");
const Event = require("../models/event.model");
const { getIO } = require("../socket");

const { calculateSummary } = require("./analytics.controller");

/* ---------- DEBOUNCE CACHE ---------- */
const lastEmit = new Map();
const EMIT_DEBOUNCE = 1500;

/* ---------- HELPERS ---------- */
const getDevice = (ua = "") => {
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
};

const getOS = (ua = "") => {
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
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

/* ---------- CONFIG ---------- */
const ALLOWED_EVENT_TYPES = [
  "page_view",
  "session_start",
  "session_end"
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
      userAgent,
      duration,
      environment
    } = req.body;

    const finalEnv = environment === "preview" ? "preview" : "production";

    if (!siteId) {
      return res.status(400).json({ success: false, message: "siteId required" });
    }

    eventType = eventType || "page_view";

    // 🔥 ignore unwanted events
    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      return res.status(200).json({ success: true });
    }

    const ua = userAgent || req.headers["user-agent"] || "";
    if (isBot(ua)) return res.status(200).json({ success: true });

    const device = getDevice(ua);
    const os = getOS(ua);

    const ip = getIP(req);
    let country = "IN";

    if (ip !== "127.0.0.1" && ip !== "::1") {
      const geo = geoip.lookup(ip);
      country = geo?.country || "Unknown";
    }

    /* ---------- SESSION UPDATE ---------- */
    if (sessionId) {
      const update = {
        $set: {
          siteId,
          lastSeen: new Date(),
          device,
          os,          // 🔥 FIXED
          country,
          environment: finalEnv
        }
      };

      if (eventType === "page_view") {
        update.$inc = { pageCount: 1 };
      }

      await Session.updateOne(
        { siteId, sessionId },
        update,
        { upsert: true }
      );

      console.log("🧠 SESSION UPDATED:", sessionId, "|", eventType);
    }

    /* ---------- SAVE EVENT (ONLY IMPORTANT ONES) ---------- */
    if (eventType === "page_view") {
      const saved = await Event.create({
        siteId: String(siteId),
        sessionId: String(sessionId || "anon"),
        type: eventType,
        path: path || "/",
        url: url || "",
        device,
        os,
        browser: getBrowser(ua),
        userAgent: ua,
        country,
        environment: finalEnv,
        timestamp: new Date()
      });

      console.log("🔥 EVENT SAVED:", saved._id);
    }

    /* ---------- SOCKET UPDATE ---------- */
    try {
      const io = getIO();

      io.to(siteId).emit("live:event", {
        type: eventType,
        path: path || "/",
        device,
        country,
        timestamp: new Date()
      });

      const now = Date.now();
      const last = lastEmit.get(siteId) || 0;

      if (now - last > EMIT_DEBOUNCE) {
        lastEmit.set(siteId, now);

        setImmediate(async () => {
          try {
            const summary = await calculateSummary(siteId);
            if (summary) {
              io.to(siteId).emit("analytics:update", summary);
              console.log("🚀 REALTIME UPDATE:", siteId);
            }
          } catch (err) {
            console.error("SUMMARY ERROR:", err);
          }
        });
      }
    } catch (e) {}

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("TRACK ERROR:", err);
    return res.status(500).json({ success: false });
  }
};