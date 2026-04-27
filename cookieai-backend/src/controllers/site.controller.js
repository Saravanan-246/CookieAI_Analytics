const Site = require("../models/site.model");
const Visit = require("../models/visit.model");
const Event = require("../models/event.model");
const Session = require("../models/session.model");

const crypto = require("crypto");

/* ---------- HELPERS ---------- */
const generateId = () => crypto.randomBytes(8).toString("hex");
const generateKey = () => "ck_" + crypto.randomBytes(24).toString("hex");

const isValidDomain = (d) => {
  if (!d) return true;

  const cleaned = d.toLowerCase().trim();

  // allow localhost
  if (cleaned === "localhost") return true;

  // allow IP addresses (127.0.0.1, 192.168.1.1, etc.)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(cleaned)) return true;

  // allow domains (google.com, mysite.in, etc.)
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned);
};

/* ===================================================== */
/* ================= CREATE SITE ======================== */
/* ===================================================== */
exports.createSite = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("USER:", req.user);

    const userId = req.user?.id;
    const { name, domain } = req.body || {};

    console.log("DOMAIN RECEIVED:", domain);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Valid name is required (min 2 characters)",
      });
    }

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is required",
      });
    }

    if (!isValidDomain(domain)) {
      return res.status(400).json({
        success: false,
        message: "Invalid domain format",
      });
    }

    // Note: Multiple sites can have the same domain for the same user
    // Only siteId and apiKey must be unique

    const site = await Site.create({
      userId,
      name: name.trim(),
      domain: domain?.toLowerCase(),
      siteId: generateId(),
      apiKey: generateKey(),
    });

    return res.status(201).json({
      success: true,
      data: {
        id: site._id,
        name: site.name,
        domain: site.domain,
        siteId: site.siteId,
        apiKey: site.apiKey,
        createdAt: site.createdAt,
      },
    });
  } catch (err) {
    console.error("CreateSite Error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Create failed",
    });
  }
};

/* ===================================================== */
/* ================= GET SITES ========================== */
/* ===================================================== */
exports.getSites = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sites = await Site.find({
      userId,
      isDeleted: false,
    })
      .select("name domain siteId isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: sites,
    });
  } catch (err) {
    console.error("GetSites Error:", err);
    return res.status(500).json({
      success: false,
      message: "Fetch failed",
    });
  }
};

/* ===================================================== */
/* ================= GET SINGLE SITE ==================== */
/* ===================================================== */
exports.getSiteById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate siteId
    if (!siteId || siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    const site = await Site.findOne({
      siteId: siteId,
      userId,
      isDeleted: false,
    })
      .select("+apiKey")
      .lean();

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    return res.json({
      success: true,
      data: site,
    });
  } catch (err) {
    console.error("GetSite Error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Fetch failed",
    });
  }
};

/* ===================================================== */
/* ================= GET TRACKING SCRIPT ================ */
/* ===================================================== */
exports.getScript = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate siteId
    if (!siteId || siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    const site = await Site.findOne({
      siteId: siteId,
      userId,
      isDeleted: false,
    }).select("+apiKey");

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Generate tracking script
    // Use BASE_URL env var for production flexibility
    const BASE_URL = process.env.BASE_URL || process.env.TRACKER_URL || process.env.API_URL || "http://localhost:5000";
    
    const script = `<script defer data-site-id="${site.siteId}" src="${BASE_URL}/tracker.js"></script>`;

    return res.json({
      success: true,
      data: {
        siteId: site.siteId,
        script,
      },
    });
  } catch (err) {
    console.error("GetScript Error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Fetch failed",
    });
  }
};

/* ===================================================== */
/* ================= GET SITE STATUS ===================== */
/* ===================================================== */
exports.getSiteStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate siteId
    if (!siteId || siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    const site = await Site.findOne({
      siteId: siteId,
      userId,
      isDeleted: false,
    }).select("isTrackingActive lastEventAt");

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    return res.json({
      success: true,
      data: {
        isTrackingActive: site.isTrackingActive || false,
        lastEventAt: site.lastEventAt,
      },
    });
  } catch (err) {
    console.error("GetSiteStatus Error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Fetch failed",
    });
  }
};

/* ===================================================== */
/* ================= ACTIVATE SITE TRACKING (DEPRECATED) ============== */
/* ===================================================== */
// Auto-detection is now done in getSummary by checking Event count
// This endpoint is kept for backward compatibility but no longer used
exports.activateSite = async (req, res) => {
  try {
    const { siteId } = req.body;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: "siteId required",
      });
    }

    // Validate siteId
    if (siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    const site = await Site.findOne({
      siteId: siteId,
      isDeleted: false,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Check if any events exist for this site
    const eventCount = await Event.countDocuments({ siteId });
    
    // Mark tracking as installed if events exist
    site.trackingInstalled = eventCount > 0;
    site.isTrackingActive = eventCount > 0;
    site.lastEventAt = new Date();
    await site.save();

    return res.json({
      success: true,
      message: "Site tracking status updated",
      trackingInstalled: site.trackingInstalled,
    });
  } catch (err) {
    console.error("ActivateSite Error:", err);
    return res.status(500).json({
      success: false,
      message: "Activation failed",
    });
  }
};

/* ===================================================== */
/* ================= DELETE SITE (FIXED) ================= */
/* ===================================================== */
exports.deleteSite = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate siteId
    if (!siteId || siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    // 🔥 find site first
    const site = await Site.findOne({
      siteId: siteId,
      userId,
      isDeleted: false,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    const publicSiteId = site.siteId;

    // 🔥 soft delete
    site.isDeleted = true;
    await site.save();

    // 🔥 HARD DELETE ANALYTICS DATA (IMPORTANT)
    await Promise.all([
      Visit.deleteMany({ siteId: publicSiteId }),
      Event.deleteMany({ siteId: publicSiteId }),
      Session.deleteMany({ siteId: publicSiteId }),
    ]);

    return res.json({
      success: true,
      message: "Site and analytics data deleted",
    });
  } catch (err) {
    console.error("DeleteSite Error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};