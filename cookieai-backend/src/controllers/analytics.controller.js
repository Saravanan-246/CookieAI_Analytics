const Event = require("../models/event.model");
const Session = require("../models/session.model");
const Site = require("../models/site.model");

const mongoose = require("mongoose");

const validateSiteExists = async (siteId) => {
  let site = null;

  // 🔥 if valid Mongo ObjectId
  if (mongoose.Types.ObjectId.isValid(siteId)) {
    site = await Site.findOne({
      _id: siteId,
      isDeleted: false,
    }).lean();
  }

  // 🔥 fallback: custom siteId
  if (!site) {
    site = await Site.findOne({
      siteId: siteId,
      isDeleted: false,
    }).lean();
  }

  return site || null;
};

const formatMap = (arr = []) => {
  const obj = {};
  arr.forEach((i) => {
    if (i?._id) obj[i._id] = i.count;
  });
  return obj;
};

const buildTimeFilter = (gteDate) => {
  const dateObj = gteDate instanceof Date ? gteDate : new Date(gteDate);
  return {
    $or: [{ timestamp: { $gte: dateObj } }, { time: { $gte: dateObj } }],
  };
};

const buildTimeRangeFilter = (gteDate, ltDate) => {
  const dGte = gteDate instanceof Date ? gteDate : new Date(gteDate);
  const dLt = ltDate instanceof Date ? ltDate : new Date(ltDate);

  return {
    $or: [
      { timestamp: { $gte: dGte, $lt: dLt } },
      { time: { $gte: dGte, $lt: dLt } },
    ],
  };
};

const calculateSummary = async (siteId, range = "7d", environment = "all") => {
  try {
    const site = await validateSiteExists(siteId);
    if (!site) return emptySummary();

    /* ---------- TIME ---------- */
    const rangeMap = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const duration = rangeMap[range] || rangeMap["7d"];
    const now = Date.now();

    const envFilter =
      environment && environment !== "all" ? { environment } : {};

    const siteIdStr = site.siteId || String(site._id);

    /* ---------- FILTERS ---------- */
    const currentFilter = {
      siteId: siteIdStr,
      ...buildTimeFilter(new Date(now - duration)),
      ...envFilter,
    };

    const prevEventFilter = {
      siteId: siteIdStr,
      ...buildTimeRangeFilter(
        new Date(now - 2 * duration),
        new Date(now - duration)
      ),
      ...envFilter,
    };

    const sessionFilter = {
      siteId: siteIdStr,
      lastSeen: { $gte: new Date(now - duration) },
      ...envFilter,
    };

    const prevSessionFilter = {
      siteId: siteIdStr,
      lastSeen: {
        $gte: new Date(now - 2 * duration),
        $lt: new Date(now - duration),
      },
      ...envFilter,
    };

    console.log("🔍 FILTER:", JSON.stringify(currentFilter));

    /* ---------- ONLY PAGE VIEW ---------- */
    const eventMatchFilter = {
      ...currentFilter,
      type: "page_view", // 🔥 KEY FIX
    };

    /* ---------- GROWTH ---------- */
    const [currVisitors, prevVisitors, currViews, prevViews] =
      await Promise.all([
        Session.countDocuments(sessionFilter),
        Session.countDocuments(prevSessionFilter),

        Event.countDocuments(eventMatchFilter),

        Event.countDocuments({
          ...prevEventFilter,
          type: "page_view",
        }),
      ]);

    const calcGrowth = (curr, prev) =>
      prev ? Math.round(((curr - prev) / prev) * 100) : 0;

    /* ---------- AGGREGATIONS ---------- */
 const [
  activeUsers,
  devices,
  traffic,
  sessionsAgg,
  topPages,
  topCountries,
  os,
] = await Promise.all([

  /* ---------- ACTIVE USERS ---------- */
  Session.countDocuments({
    siteId: siteIdStr,
    isActive: true,
    lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    ...envFilter,
  }),

  /* ---------- DEVICES (SESSION BASED) ---------- */
  Session.aggregate([
    { $match: sessionFilter },
    {
      $group: {
        _id: "$device",
        count: { $sum: 1 },
      },
    },
  ]),

  /* ---------- TRAFFIC (FIXED 🔥) ---------- */
  Event.aggregate([
    { $match: eventMatchFilter },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%H:%M", // 🔥 IMPORTANT FIX
            date: {
              $ifNull: ["$timestamp", { $toDate: "$time" }],
            },
          },
        },
        visits: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]),

  /* ---------- SESSION STATS ---------- */
  Session.aggregate([
    { $match: sessionFilter },
    {
      $group: {
        _id: null,
        totalDuration: {
          $sum: {
            $subtract: ["$lastSeen", "$createdAt"],
          },
        },
        totalPageCount: { $sum: "$pageCount" },
        count: { $sum: 1 },
        bounces: {
          $sum: {
            $cond: [{ $eq: ["$pageCount", 1] }, 1, 0],
          },
        },
      },
    },
  ]),

  /* ---------- TOP PAGES ---------- */
  Event.aggregate([
    {
      $match: {
        ...eventMatchFilter,
        path: { $exists: true, $ne: "" },
      },
    },
    {
      $project: {
        cleanPath: {
          $arrayElemAt: [{ $split: ["$path", "?"] }, 0],
        },
      },
    },
    {
      $group: {
        _id: "$cleanPath",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]),

  /* ---------- COUNTRIES (FIXED 🔥 SESSION BASED) ---------- */
  Session.aggregate([
    { $match: sessionFilter },
    {
      $group: {
        _id: "$country",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]),

  /* ---------- OS (SESSION BASED) ---------- */
  Session.aggregate([
    { $match: sessionFilter },
    {
      $group: {
        _id: "$os",
        count: { $sum: 1 },
      },
    },
  ]),
]);

/* ---------- SAFE DEFAULT ---------- */
const stats = sessionsAgg[0] || {
  totalDuration: 0,
  totalPageCount: 0,
  count: 0,
  bounces: 0,
};

const totalSessions = stats.count;
    return {
      totalVisitors: currVisitors,
      visitorGrowth: calcGrowth(currVisitors, prevVisitors),

      totalPageViews: currViews,
      viewGrowth: calcGrowth(currViews, prevViews),

      totalSessions,
      activeUsers,

      avgSessionDuration: totalSessions
        ? stats.totalDuration / totalSessions / 1000
        : 0,

      bounceRate: totalSessions
        ? Math.round((stats.bounces / totalSessions) * 100)
        : 0,

      avgPagesPerSession: totalSessions
        ? Number((stats.totalPageCount / totalSessions).toFixed(1))
        : 0,

      devices,
      traffic,
      topPages,
      topCountries,
      os,
    };
  } catch (error) {
    console.error("SUMMARY ERROR:", error);
    return emptySummary();
  }
};

/* ---------- EMPTY ---------- */
const emptySummary = () => ({
  totalVisitors: 0,
  visitorGrowth: 0,
  totalPageViews: 0,
  viewGrowth: 0,
  totalSessions: 0,
  activeUsers: 0,
  avgSessionDuration: 0,
  bounceRate: 0,
  avgPagesPerSession: 0,
  devices: [],
  traffic: [],
  topPages: [],
  topCountries: [],
  os: [],
});

exports.calculateSummary = calculateSummary;

/* ===================================================== */
/* 🔥 SUMMARY API */
/* ===================================================== */
exports.getSummary = async (req, res) => {
  try {
    const { siteId, range = "7d", environment = "all" } = req.query;

    if (!siteId) {
      return res.status(400).json({ success: false, message: "siteId required" });
    }

    const summary = await calculateSummary(siteId, range, environment);
    
 if (!summary) {
  return res.json({
    success: true,
    totalVisitors: 0,
    visitorGrowth: 0,
    totalPageViews: 0,
    viewGrowth: 0,
    totalSessions: 0,
    activeUsers: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    avgPagesPerSession: 0,
    devices: [],
    traffic: [],
    topPages: [],
    topCountries: [],
    os: [],
    sessions: []
  });
}

    return res.json({
      success: true,
      ...summary
    });
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    return res.status(500).json({ success: false });
  }
};

/* ===================================================== */
/* 🔥 CLEAR ANALYTICS DATA */
/* ===================================================== */
exports.clearAnalytics = async (req, res) => {
  try {
    const { siteId } = req.query;

    if (!siteId) {
      return res.status(400).json({ success: false, message: "siteId required" });
    }

    // 🔥 Ensure siteId is a string for matching stored data
    const filterSiteId = String(siteId);

    // Delete all analytics data for the site
    await Promise.all([
      Event.deleteMany({ siteId: filterSiteId }),
      Session.deleteMany({ siteId: filterSiteId }),
    ]);

    return res.json({
      success: true,
      message: "Analytics data cleared successfully",
    });
  } catch (err) {
    console.error("CLEAR ANALYTICS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to clear analytics" });
  }
};