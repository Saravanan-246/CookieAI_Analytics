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

const calculateSummary = async (siteId, range = "7d", environment = "all") => {
  // Validate site
  const site = await validateSiteExists(siteId);

  // Always return empty structure if no site
  if (!site) {
    return {
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
      os: []
    };
  }

  // 🔥 ALWAYS USE REAL MONGO _id
  const realSiteId = site._id;

  /* ---------- FILTERS ---------- */
  const rangeMap = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const duration = rangeMap[range] || rangeMap["7d"];
  const now = Date.now();

  const currentFilter = {
    siteId: realSiteId,
    timestamp: { $gte: new Date(now - duration) },
    ...(environment !== "all" && { environment })
  };

  const sessionFilter = {
    siteId: realSiteId,
    lastSeen: { $gte: new Date(now - duration) },
    ...(environment !== "all" && { environment })
  };

  const prevFilter = {
    siteId: realSiteId,
    timestamp: {
      $gte: new Date(now - 2 * duration),
      $lt: new Date(now - duration)
    },
    ...(environment !== "all" && { environment })
  };

  /* ---------- GROWTH ---------- */
  const [currVisitors, prevVisitors, currViews, prevViews] = await Promise.all([
    Session.countDocuments(sessionFilter),
    Session.countDocuments({
      siteId: realSiteId,
      lastSeen: {
        $gte: new Date(now - 2 * duration),
        $lt: new Date(now - duration)
      },
      ...(environment !== "all" && { environment })
    }),
    Event.countDocuments({ ...currentFilter, type: "page_view" }),
    Event.countDocuments({ ...prevFilter, type: "page_view" })
  ]);

  const calcGrowth = (curr, prev) => {
    if (!prev) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const visitorGrowth = calcGrowth(currVisitors, prevVisitors);
  const viewGrowth = calcGrowth(currViews, prevViews);

  /* ---------- AGGREGATIONS ---------- */
  const [
    activeUsers,
    devices,
    traffic,
    sessionsAgg,
    topPages,
    topCountries,
    os
  ] = await Promise.all([
    Session.countDocuments({
      siteId: realSiteId,
      isActive: true,
      lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      ...(environment !== "all" && { environment })
    }),

    Event.aggregate([
      { $match: { ...currentFilter, type: "page_view" } },
      { $group: { _id: "$device", count: { $sum: 1 } } }
    ]),

    Event.aggregate([
      { $match: { ...currentFilter, type: "page_view" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          visits: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    Session.aggregate([
      { $match: sessionFilter },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: { $subtract: ["$lastSeen", "$createdAt"] } },
          totalPageCount: { $sum: "$pageCount" },
          count: { $sum: 1 },
          bounces: {
            $sum: { $cond: [{ $eq: ["$pageCount", 1] }, 1, 0] }
          }
        }
      }
    ]),

    Event.aggregate([
      {
        $match: {
          ...currentFilter,
          type: "page_view",
          path: { $ne: null, $ne: "" }
        }
      },
      {
        $project: {
          cleanPath: {
            $arrayElemAt: [{ $split: ["$path", "?"] }, 0]
          }
        }
      },
      {
        $group: {
          _id: "$cleanPath",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    Event.aggregate([
      { $match: { ...currentFilter, type: "page_view" } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    Event.aggregate([
      { $match: { ...currentFilter, type: "page_view" } },
      {
        $project: {
          os: {
            $cond: [
              { $regexMatch: { input: "$os", regex: /Windows/i } },
              "Windows",
              {
                $cond: [
                  { $regexMatch: { input: "$os", regex: /Mac|OS X/i } },
                  "macOS",
                  {
                    $cond: [
                      { $regexMatch: { input: "$os", regex: /Android/i } },
                      "Android",
                      {
                        $cond: [
                          { $regexMatch: { input: "$os", regex: /iOS|iPhone|iPad/i } },
                          "iOS",
                          { $ifNull: ["$os", "Unknown"] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$os",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const stats = sessionsAgg[0] || {
    totalDuration: 0,
    totalPageCount: 0,
    count: 0,
    bounces: 0
  };

  const totalSessions = stats.count;
  const avgSessionDuration = totalSessions
    ? stats.totalDuration / totalSessions / 1000
    : 0;

  const bounceRate = totalSessions
    ? Math.round((stats.bounces / totalSessions) * 100)
    : 0;

  const avgPagesPerSession = totalSessions
    ? parseFloat((stats.totalPageCount / totalSessions).toFixed(1))
    : 0;

  return {
    totalVisitors: currVisitors,
    visitorGrowth,
    totalPageViews: currViews,
    viewGrowth,
    totalSessions,
    activeUsers,
    avgSessionDuration,
    bounceRate,
    avgPagesPerSession,
    devices,
    traffic,
    topPages,
    topCountries,
    os
  };
};

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

    // Delete all analytics data for the site
    await Promise.all([
      Event.deleteMany({ siteId }),
      Session.deleteMany({ siteId }),
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