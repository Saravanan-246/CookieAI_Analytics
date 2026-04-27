/* ---------- ADVANCED RATE LIMITER ---------- */

const store = new Map();

const DEFAULT_LIMIT = 100;        // normal APIs
const TRACK_LIMIT = 300;          // 🔥 higher for tracking
const TIME_WINDOW = 60 * 1000;    // 1 min

const getIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

const rateLimiter = (req, res, next) => {
  const ip = getIP(req);
  const now = Date.now();

  // 🔥 Dynamic limit (important)
  const limit = req.originalUrl.startsWith("/api/track")
    ? TRACK_LIMIT
    : DEFAULT_LIMIT;

  let data = store.get(ip);

  if (!data) {
    store.set(ip, { count: 1, start: now });
    return next();
  }

  // 🔁 Reset window
  if (now - data.start > TIME_WINDOW) {
    store.set(ip, { count: 1, start: now });
    return next();
  }

  data.count++;

  // 🔥 Headers (debug + frontend use)
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(limit - data.count, 0));

  if (data.count > limit) {
    return res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  }

  next();
};

/* ---------- CLEANUP (MEMORY SAFE) ---------- */
setInterval(() => {
  const now = Date.now();

  for (const [ip, data] of store.entries()) {
    if (now - data.start > TIME_WINDOW) {
      store.delete(ip);
    }
  }
}, TIME_WINDOW);

module.exports = rateLimiter;