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
      Session.countDocuments({
        siteId: realSiteId,
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
      }),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", device: { $first: "$device" } } },
        { $group: { _id: "$device", count: { $sum: 1 } } }
      ]), // 🔥 FROM VISIT
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", browser: { $first: "$browser" } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } }
      ]), // 🔥 FROM VISIT
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", country: { $first: "$country" } } },
        { $group: { _id: "$country", count: { $sum: 1 } } }
      ]), // 🔥 FROM VISIT
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $group: { _id: "$path", visitorsSet: { $addToSet: "$sessionId" }, pageViews: { $sum: 1 } } },
        { $project: { _id: 1, visitors: { $size: "$visitorsSet" }, pageViews: 1 } },
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
      Session.countDocuments({
        siteId: realSiteId,
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
      }),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", device: { $first: "$device" } } },
        { $group: { _id: "$device", count: { $sum: 1 } } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", browser: { $first: "$browser" } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", country: { $first: "$country" } } },
        { $group: { _id: "$country", count: { $sum: 1 } } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId, time: { $gte: startTime } } },
        { $group: { _id: "$path", visitorsSet: { $addToSet: "$sessionId" }, pageViews: { $sum: 1 } } },
        { $project: { _id: 1, visitors: { $size: "$visitorsSet" }, pageViews: 1 } },
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

    const [trafficRaw, devicesRaw, browsersRaw, countriesRaw] = await Promise.all([
      Event.aggregate([
        { $match: { siteId: realSiteId, type: "page_view", timestamp: { $gte: startTime } } },
        { 
          $group: { 
            _id: { $dateToString: { format: is24h ? "%Y-%m-%dT%H:00" : "%b %d", date: "$timestamp" } }, 
            visitors: { $addToSet: "$sessionId" },
            sessions: { $sum: 1 } // 🔥 simplified session approximation (can be refined)
          } 
        },
        { $project: { time: "$_id", visitors: { $size: "$visitors" }, sessions: 1 } }
      ]),
      Visit.aggregate([{ $match: { siteId: realSiteId } }, { $group: { _id: "$device", count: { $sum: 1 } } }]),
      Visit.aggregate([{ $match: { siteId: realSiteId } }, { $group: { _id: "$browser", count: { $sum: 1 } } }]),
      Visit.aggregate([{ $match: { siteId: realSiteId } }, { $group: { _id: "$country", count: { $sum: 1 } } }])
    ]);

    const now = new Date();
    const map = new Map(trafficRaw.map(t => [t.time, { v: t.visitors, s: t.sessions }]));
    const traffic = Array.from({ length: is24h ? 24 : 7 }).map((_, i) => {
      const d = is24h ? new Date(now.getTime() - (23 - i) * 3600000) : new Date(now.getTime() - (6 - i) * 86400000);
      const label = is24h ? d.toISOString().slice(0, 13) + ":00" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const entry = map.get(label) || { v: 0, s: 0 };
      return { time: label, visitors: entry.v, sessions: entry.s };
    });

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
      Session.countDocuments({
        siteId: realSiteId,
        isActive: true,
        lastSeen: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
      }),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", device: { $first: "$device" } } },
        { $group: { _id: "$device", count: { $sum: 1 } } }
      ]),
      Visit.aggregate([
        { $match: { siteId: realSiteId } },
        { $sort: { time: -1 } },
        { $group: { _id: "$sessionId", country: { $first: "$country" } } },
        { $group: { _id: "$country", count: { $sum: 1 } } }
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