const Event = require("../models/event.model");
const Session = require("../models/session.model");
const Visit = require("../models/visit.model");
const Site = require("../models/site.model");
const mongoose = require("mongoose");
const { emitAnalyticsUpdate } = require("../socket");

const validateSiteExists = async (siteId) => {
  try {
    if (!siteId || typeof siteId !== "string") return null;
    const baseQuery = { isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(siteId)) {
      const site = await Site.findOne({ ...baseQuery, _id: siteId }).select("siteId _id").lean();
      if (site) return site;
    }
    return await Site.findOne({ ...baseQuery, siteId }).select("siteId _id").lean();
  } catch (err) { return null; }
};

/* ================= SUMMARY API ================= */
exports.getSummary = async (req, res) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ success: false, message: "siteId required" });

    const site = await validateSiteExists(siteId);
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const realSiteId = site.siteId;

    const [
      totalPageViews,
      totalSessions,
      uniqueVisitors,
      activeUsers,
      devicesRaw,
      browsersRaw,
      countriesRaw,
      pagesRaw
    ] = await Promise.all([
      Visit.countDocuments({ siteId: realSiteId }),      // 🔥 FROM VISIT
      Session.countDocuments({ siteId: realSiteId }),
      Event.distinct("sessionId", { siteId: realSiteId }), // 🔥 FROM EVENT (Unique Visitors)
      Session.distinct("sessionId", {
        siteId: realSiteId,
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 15 * 1000) }
      }).then(res => res.length),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$device", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]), // 🔥 UNIQUE SESSIONS per device
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$browser", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]), // 🔥 UNIQUE SESSIONS per browser
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$country", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]), // 🔥 UNIQUE SESSIONS per country
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$path", pageViews: { $sum: 1 }, visitors: { $addToSet: "$sessionId" } } },
        { $project: { path: "$_id", pageViews: 1, visitors: { $size: "$visitors" } } },
        { $sort: { pageViews: -1 } },
        { $limit: 10 }
      ])
    ]);

    return res.json({
      success: true,
      siteId: realSiteId,
      stats: {
        pageViews: totalPageViews,
        sessions: totalSessions,
        visitors: uniqueVisitors.length,
        activeUsers: activeUsers,
      },
      installed: totalPageViews > 0,
      hasData: totalPageViews > 0,
      charts: {
        devices: devicesRaw.map(d => ({ name: d._id || "Unknown", value: d.count })),
        browsers: browsersRaw.map(b => ({ name: b._id || "Unknown", value: b.count })),
        countries: countriesRaw.map(c => ({ name: c._id || "Unknown", value: c.count }))
      },
      tables: { pages: pagesRaw.map(p => ({ path: p._id || "/", visitors: p.visitors, pageViews: p.pageViews })) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= INTERNAL CALCULATE SUMMARY ================= */
const calculateSummary = async (siteId) => {
  try {
    const site = await validateSiteExists(siteId);
    if (!site) return null;

    const realSiteId = site.siteId;
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPageViews,
      totalSessions,
      uniqueVisitors,
      activeUsers,
      devicesRaw,
      browsersRaw,
      countriesRaw,
      topPagesRaw
    ] = await Promise.all([
      Visit.countDocuments({ siteId: realSiteId, time: { $gte: startTime } }),
      Session.countDocuments({ siteId: realSiteId }),
      Event.distinct("sessionId", { siteId: realSiteId }),
      Session.distinct("sessionId", {
        siteId: realSiteId,
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 15 * 1000) }
      }).then(res => res.length),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$device", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$browser", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$country", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId, time: { $gte: startTime } } },
        { $group: { _id: "$path", pageViews: { $sum: 1 }, visitors: { $addToSet: "$sessionId" } } },
        { $project: { path: "$_id", pageViews: 1, visitors: { $size: "$visitors" } } },
        { $sort: { pageViews: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      stats: {
        visitors: uniqueVisitors.length,
        sessions: totalSessions,
        pageViews: totalPageViews,
        activeUsers: activeUsers
      },
      charts: {
        devices: devicesRaw.map(d => ({ name: d._id || "Unknown", value: d.count })),
        browsers: browsersRaw.map(b => ({ name: b._id || "Unknown", value: b.count })),
        countries: countriesRaw.map(c => ({ name: c._id || "Unknown", value: c.count }))
      },
      tables: {
        pages: topPagesRaw.map(p => ({ path: p._id || "/", visitors: p.visitors, pageViews: p.pageViews }))
      },
      updatedAt: new Date(),
      isRealtime: true
    };
  } catch (err) { return null; }
};
exports.calculateSummary = calculateSummary;

/* ================= CHARTS API ================= */
exports.getCharts = async (req, res) => {
  try {
    const { siteId, range = "7d" } = req.query;
    const site = await validateSiteExists(siteId);
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const realSiteId = site.siteId;
    const is24h = range === "24h";
    const startTime = new Date(Date.now() - (is24h ? 24 : 7 * 24) * 60 * 60 * 1000);

    /* ─── TRAFFIC AGGREGATION ─── */
    /* Use $dateTrunc for proper UTC bucketing — guaranteed to match JS Date ISO keys */
    const [trafficRaw, devicesRaw, browsersRaw, countriesRaw] = await Promise.all([
      Visit.aggregate([
        { $match: { siteId: realSiteId, time: { $gte: startTime } } },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: "$time",
                unit: is24h ? "hour" : "day",
                timezone: "UTC"
              }
            },
            visitors: { $sum: 1 }          // cumulative page views per bucket
          }
        },
        { $project: { _id: 0, time: "$_id", visitors: 1 } },
        { $sort: { time: 1 } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$device", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$browser", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$country", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } }
      ])
    ]);

    /* ─── BUILD FULL TIMELINE ─── */
    /* Map from ISO bucket key → visitors count from DB */
    const dbMap = new Map(
      trafficRaw
        .filter(t => t.time instanceof Date && !isNaN(t.time))
        .map(t => [t.time.toISOString(), Number(t.visitors) || 0])
    );

    const now = new Date();
    const bucketCount = is24h ? 24 : 7;

    const traffic = Array.from({ length: bucketCount }).map((_, i) => {
      /* Build the exact bucket Date the DB would have produced */
      const offset = is24h
        ? (bucketCount - 1 - i) * 3600000   // hours ago
        : (bucketCount - 1 - i) * 86400000;  // days ago

      const d = new Date(now.getTime() - offset);

      /* Truncate to UTC hour or UTC day — same as $dateTrunc */
      const bucket = new Date(d);
      if (is24h) {
        bucket.setUTCMinutes(0, 0, 0);
      } else {
        bucket.setUTCHours(0, 0, 0, 0);
      }

      const isoKey = bucket.toISOString();
      const visitors = dbMap.get(isoKey) || 0;

      return { time: isoKey, visitors };
    });

    console.log(`[Charts] ${range} → ${traffic.filter(t => t.visitors > 0).length}/${bucketCount} non-zero buckets`);

    return res.json({
      success: true, siteId: realSiteId, range, traffic,
      devices: devicesRaw.map(d => ({ name: d._id || "Unknown", value: d.count })),
      browsers: browsersRaw.map(b => ({ name: b._id || "Unknown", value: b.count })),
      countries: countriesRaw.map(c => ({ name: c._id || "Unknown", value: c.count }))
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/* ================= DASHBOARD DATA API ================= */
exports.getDashboardData = async (req, res) => {
  try {
    const { siteId, range = "7d" } = req.query;
    const site = await validateSiteExists(siteId);
    if (!site) return res.status(404).json({ success: false, message: "Site not found" });

    const realSiteId = site.siteId;
    const startTime = new Date(Date.now() - (range === "24h" ? 24 : 7 * 24) * 60 * 60 * 1000);

    const [totalPageViews, totalSessions, uniqueVisitors, activeUsersCount, devicesRaw, countriesRaw] = await Promise.all([
      Visit.countDocuments({ siteId: realSiteId, time: { $gte: startTime } }),
      Session.countDocuments({ siteId: realSiteId }),
      Event.distinct("sessionId", { siteId: realSiteId }),
      Session.distinct("sessionId", {
        siteId: realSiteId,
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 15 * 1000) }
      }).then(res => res.length),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$device", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$country", sessions: { $addToSet: "$sessionId" } } },
        { $project: { _id: 1, count: { $size: "$sessions" } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return res.json({
      success: true, siteId: realSiteId, totalVisitors: uniqueVisitors.length,
      totalSessions, totalPageViews, activeUsers: activeUsersCount,
      devices: devicesRaw.map(d => ({ name: d._id || "Unknown", value: d.count })),
      countries: countriesRaw.map(c => ({ name: c._id || "Unknown", value: c.count })),
      range, updatedAt: new Date()
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/* ================= EXTRA ================= */
exports.getPageAnalytics = async (req, res) => {
  const site = await validateSiteExists(req.params.siteId);
  if (!site) return res.status(404).json({ success: false, message: "Site not found" });
  const pages = await Visit.aggregate([
    { $match: { siteId: site.siteId } },
    { $group: { _id: "$path", visitorsSet: { $addToSet: "$sessionId" }, pageViews: { $sum: 1 } } },
    { $project: { _id: 1, visitors: { $size: "$visitorsSet" }, pageViews: 1 } },
    { $sort: { pageViews: -1 } },
    { $limit: 10 }
  ]);
  res.json({ success: true, data: pages.map(p => ({ path: p._id, visitors: p.visitors, pageViews: p.pageViews })) });
};

exports.getLiveEvents = async (req, res) => {
  const site = await validateSiteExists(req.query.siteId);
  if (!site) return res.status(404).json({ success: false, message: "Site not found" });
  const events = await Event.find({ siteId: site.siteId }).sort({ timestamp: -1 }).limit(20).lean();
  res.json({ success: true, data: events.map(e => ({ id: e._id, type: e.type, path: e.path, time: e.timestamp })) });
};

exports.clearAnalytics = async (req, res) => {
  if (req.query.confirm !== "true") return res.status(400).json({ success: false, message: "Confirm with ?confirm=true" });
  const site = await validateSiteExists(req.query.siteId);
  if (!site) return res.status(404).json({ success: false, message: "Site not found" });
  await Promise.all([Event.deleteMany({ siteId: site.siteId }), Session.deleteMany({ siteId: site.siteId }), Visit.deleteMany({ siteId: site.siteId })]);
  res.json({ success: true, message: "Cleared" });
};

exports.getSetupStatus = async (req, res) => {
  const site = await validateSiteExists(req.params.siteId);
  if (!site) return res.status(404).json({ success: false, message: "Site not found" });
  const [total, views] = await Promise.all([Event.countDocuments({ siteId: site.siteId }), Visit.countDocuments({ siteId: site.siteId })]);
  res.json({ success: true, installed: total > 0, hasData: views > 0, pageViews: views });
};