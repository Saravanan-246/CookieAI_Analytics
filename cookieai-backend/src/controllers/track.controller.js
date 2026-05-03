const Event = require("../models/event.model");
const Session = require("../models/session.model");
const Visit = require("../models/visit.model");
const Site = require("../models/site.model");
const geoip = require("geoip-lite");
const axios = require("axios");
const mongoose = require("mongoose");
const {
  emitAnalyticsUpdate,
  emitLiveFeedEvent
} = require("../socket");

const lastEmit = new Map();
const EMIT_DEBOUNCE = 500;

/* ---------- PAGE VIEW DEDUP CACHE ---------- */
const recentPageViews = new Map();
const PV_DEDUP_WINDOW = 3000; // 3 seconds

// Auto-clean stale entries every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentPageViews) {
    if (now - ts > 10000) recentPageViews.delete(key);
  }
}, 30000);

const isValidEvent = (type) => typeof type === "string" && type.length > 0;

const canEmit = (siteId) => {
  const now = Date.now();
  const last = lastEmit.get(siteId) || 0;
  if (now - last < EMIT_DEBOUNCE) return false;
  lastEmit.set(siteId, now);
  return true;
};

/* ================= INTERNAL PROCESSOR ================= */
const processEvent = async (data, reqInfo) => {
  try {
    const {
      siteId, sessionId: sid, userId, type, path, title, url, referrer,
      language, screen, meta, userAgent: clientUa, timestamp,
      browser: clientBrowser, os: clientOs, device: clientDevice
    } = data;

    const finalType = String(type || "page_view").toLowerCase().trim();

    /* ---------- 1. ACTIVITY EVENTS (LIGHTWEIGHT FAST PATH) ---------- */
    const ACTIVITY_TYPES = ["user_idle", "user_active", "user_hidden", "user_visible"];
    if (ACTIVITY_TYPES.includes(finalType)) {
      if (!siteId) return;

      let site = await Site.findOne({ siteId });
      if (!site && mongoose.Types.ObjectId.isValid(siteId)) {
        site = await Site.findById(siteId);
      }
      if (!site) return;

      const realSiteId = site.siteId;
      const sessionId = sid || "anon";
      const eventTime = timestamp ? new Date(timestamp) : new Date();

      const isNowActive = finalType === "user_active" || finalType === "user_visible";

      // Update session active state + lastSeen (lightweight, no Event/Visit created)
      await Session.updateOne(
        { siteId: realSiteId, sessionId },
        {
          $set: {
            isActive: isNowActive,
            lastSeen: eventTime
          }
        }
      ).catch(() => {});

      console.log(`${isNowActive ? "\u2705" : "\ud83d\udca4"} ${finalType} | session: ${sessionId.slice(0, 8)}`);

      // Emit updated activeUsers count on state change
      if (canEmit(realSiteId)) {
        const activeUsers = await Session.countDocuments({
          siteId: realSiteId,
          isActive: true,
          lastSeen: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
        });
        emitAnalyticsUpdate(realSiteId, { stats: { activeUsers } });
      }

      return; // Done — no heavy processing needed
    }

    /* ---------- 2. EVENT SPAM FILTER (CRITICAL) ---------- */
    const ALLOWED = ["page_view", "session_start", "route_change"];
    if (!ALLOWED.includes(finalType)) {
      return; // Skip DB save and heavy logic for heartbeats/noise
    }

    const { headers } = reqInfo;

    /* ---------- 4. GEO OPTIMIZATION (RESOLVE ONCE) ---------- */
    const rawIp =
      (headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() ||
      reqInfo.ip ||
      "";

    const ip = rawIp.includes("::ffff:")
      ? rawIp.split("::ffff:")[1]
      : rawIp;

    let country = "Other";
    let countryCode = "XX";

    try {
      if (!ip || ip.includes("127") || ip.includes("::1") || ip.includes("localhost")) {
        country = "India";
        countryCode = "IN";
      } else {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        if (res.data?.status === "success") {
          country = res.data.country;
          countryCode = res.data.countryCode;
        } else {
          const geo = geoip.lookup(ip);
          if (geo?.country) {
            country = geo.country;
            countryCode = geo.country;
          }
        }
      }
    } catch (err) {
      const geo = geoip.lookup(ip);
      if (geo?.country) {
        country = geo.country;
        countryCode = geo.country;
      }
    }

    if (!country || country === "Unknown") country = "Other";
    if (!countryCode || countryCode === "Unknown") countryCode = "XX";

    if (!siteId) return;

    /* ---------- SITE RESOLUTION ---------- */
    let site = await Site.findOne({ siteId });
    if (!site && mongoose.Types.ObjectId.isValid(siteId)) {
      site = await Site.findById(siteId);
    }

    if (!site) return;

    const rawOrigin = headers["origin"] || headers["referer"] || "";
    const requestDomain = rawOrigin.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    const dashboardDomain = process.env.CLIENT_URL?.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

    if (dashboardDomain && requestDomain === dashboardDomain) return;

    const realSiteId = site.siteId;
    const sessionId = sid || "anon_" + Math.random().toString(36).slice(2, 10);
    const finalPath = path || "/";
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const uaStr = clientUa || headers["user-agent"] || "";

    const device = clientDevice || (
      /Mobi|Android/i.test(uaStr) ? "Mobile" : 
      /Tablet|iPad/i.test(uaStr) ? "Tablet" : 
      "Desktop"
    );

    const browser = clientBrowser || (() => {
      if (/edg/i.test(uaStr)) return "Edge";
      if (/opr|opera/i.test(uaStr)) return "Opera";
      if (/chrome/i.test(uaStr) && !/edg/i.test(uaStr)) return "Chrome";
      if (/firefox/i.test(uaStr)) return "Firefox";
      if (/safari/i.test(uaStr) && !/chrome/i.test(uaStr)) return "Safari";
      return "Other";
    })();

    const os = clientOs || (() => {
      if (/windows/i.test(uaStr)) return "Windows";
      if (/mac/i.test(uaStr)) return "macOS";
      if (/android/i.test(uaStr)) return "Android";
      if (/iphone|ipad/i.test(uaStr)) return "iOS";
      return "Other";
    })();

    /* ---------- 3. CLEAN LOGGING (FIRE EVENT) ---------- */
    console.log(`🔥 EVENT: ${finalType} SITE: ${realSiteId}`);

    /* ---------- SAVE CORE EVENT ---------- */

    /* ---------- PAGE_VIEW DEDUP (server-side safety net) ---------- */
    if (finalType === "page_view") {
      const dedupKey = `${sessionId}::${finalPath}`;
      const lastPvTs = recentPageViews.get(dedupKey) || 0;

      if (Date.now() - lastPvTs < PV_DEDUP_WINDOW) {
        console.log(`⏭️ DEDUP: skipped duplicate page_view ${dedupKey}`);
        // Still update session lastSeen so session stays active
        await Session.updateOne(
          { siteId: realSiteId, sessionId },
          { $set: { lastSeen: eventTime, isActive: true } }
        ).catch(() => {});
        return;
      }

      recentPageViews.set(dedupKey, Date.now());
    }

    await Event.create({
      siteId: realSiteId, sessionId, userId, type: finalType,
      path: finalPath, title: title || "", url: url || "",
      referrer: referrer || "", device, browser, os, country,
      timestamp: eventTime, time: eventTime,
      meta: data.pageViewId ? { pageViewId: data.pageViewId, ...(data.meta || {}) } : (data.meta || {})
    });

    /* ---------- 2. PROCESS FLOW (PAGE VIEW LOGIC) ---------- */
    const isPageView = finalType === "page_view" || finalType === "route_change";
    const existingSession = await Session.findOne({ siteId: realSiteId, sessionId });
    const isNewPage = !existingSession || existingSession.lastPath !== finalPath;

    // EVERY page_view must create a Visit record
    if (isPageView) {
      await Visit.create({
        siteId: realSiteId, sessionId, path: finalPath,
        url: url || "", title: title || "", referrer: referrer || "",
        device, browser, os, country, countryCode, time: eventTime
      });

      /* ---------- 3. CLEAN LOGGING (VISIT) ---------- */
      console.log(`📊 VISIT: ${finalPath} ${device} ${country}`);

      /* ---------- 5. REALTIME EMIT (ONLY ON PAGE VIEW) ---------- */
      if (canEmit(realSiteId)) {
        const activeUsers = await Session.countDocuments({
          siteId: realSiteId,
          isActive: true,
          lastSeen: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
        });

        const pageViews = await Visit.countDocuments({ siteId: realSiteId });

        const [devices, browsers, countries, pages] = await Promise.all([
          Visit.aggregate([
            { $match: { siteId: realSiteId } },
            { $sort: { time: -1 } },
            {
              $group: {
                _id: "$sessionId",
                device: { $first: "$device" }
              }
            },
            {
              $group: {
                _id: "$device",
                value: { $sum: 1 }
              }
            },
            { $sort: { value: -1 } }
          ]),
          Visit.aggregate([
            { $match: { siteId: realSiteId } },
            {
              $group: {
                _id: {
                  browser: "$browser",
                  sessionId: "$sessionId"
                }
              }
            },
            {
              $group: {
                _id: "$_id.browser",
                value: { $sum: 1 }
              }
            },
            { $sort: { value: -1 } }
          ]),
          Visit.aggregate([
            { $match: { siteId: realSiteId } },
            {
              $group: {
                _id: {
                  country: "$country",
                  code: "$countryCode",
                  sessionId: "$sessionId"
                }
              }
            },
            {
              $group: {
                _id: "$_id.country",
                code: { $first: "$_id.code" },
                value: { $sum: 1 }
              }
            },
            { $sort: { value: -1 } }
          ]),
          Visit.aggregate([
            { $match: { siteId: realSiteId } },
            {
              $group: {
                _id: "$path",
                visitorsSet: { $addToSet: "$sessionId" },
                pageViews: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 1,
                visitors: { $size: "$visitorsSet" },
                pageViews: 1
              }
            },
            { $sort: { pageViews: -1 } },
            { $limit: 10 }
          ])
        ]);

        console.log("📊 DEVICES:", devices);
        console.log("🌍 COUNTRIES:", countries);

        emitAnalyticsUpdate(realSiteId, {
          activeUsers,
          pageViews,
          devices: devices.map(d => ({ name: d._id || "Unknown", value: d.value })),
          browsers: browsers.map(b => ({ name: b._id || "Unknown", value: b.value })),
          countries: countries.map(c => ({ name: c._id || "Unknown", code: c.code || "XX", value: c.value })),
          pages: pages.map(p => ({ path: p._id || "/", visitors: p.visitors, pageViews: p.pageViews }))
        });
      }
    }

    /* ---------- SESSION UPDATE ---------- */
    await Session.updateOne(
      { siteId: realSiteId, sessionId },
      {
        $set: { 
          device, browser, os, country,
          lastPath: finalPath,
          lastSeen: eventTime, 
          isActive: true 
        },
        $inc: (isPageView && isNewPage) ? { pageCount: 1 } : {},
        $setOnInsert: { siteId: realSiteId, userId, sessionId, startTime: eventTime }
      },
      { upsert: true }
    );

    await Site.updateOne({ siteId: realSiteId }, { $set: { isTrackingActive: true, trackingInstalled: true, lastEventAt: eventTime } });

    emitLiveFeedEvent(realSiteId, {
      type: finalType, path: finalPath, country, device, timestamp: eventTime
    });

  } catch (err) {
    console.error("❌ PROCESS ERROR:", err.message);
  }
};

/* ================= TRACK EVENT ================= */
exports.trackEvent = async (req, res) => {
  try {
    let data = req.body;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { return res.status(400).json({ success: false }); }
    }
    if (!data || typeof data !== "object") return res.status(400).json({ success: false });

    res.status(200).json({ success: true });

    const reqInfo = {
      ip: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "",
      headers: req.headers
    };

    processEvent(data, reqInfo);

  } catch (err) {
    console.error("❌ TRACK ERROR:", err);
    if (!res.headersSent) res.status(500).json({ success: false });
  }
};

/* ================= TRACK BATCH ================= */
exports.trackBatch = async (req, res) => {
  try {
    let payload = req.body;
    if (typeof payload === "string") {
      try { payload = JSON.parse(payload); } catch { return res.status(400).json({ success: false }); }
    }
    
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.json({ success: true, processed: 0 });
    }

    res.json({ success: true, processed: payload.length });

    const reqInfo = {
      ip: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "",
      headers: req.headers
    };

    (async () => {
      for (const item of payload) {
        await processEvent(item, reqInfo);
      }
    })();

  } catch (err) {
    console.error("❌ BATCH ERROR:", err);
    if (!res.headersSent) res.status(500).json({ success: false });
  }
};