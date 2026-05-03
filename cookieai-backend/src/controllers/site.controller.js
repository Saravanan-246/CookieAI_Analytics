const Site = require("../models/site.model");
const Visit = require("../models/visit.model");
const Event = require("../models/event.model");
const Session = require("../models/session.model");

const crypto = require("crypto");

/* ================= HELPERS ================= */
const generateId = () => crypto.randomBytes(8).toString("hex");
const generateKey = () => "ck_" + crypto.randomBytes(24).toString("hex");

const cleanDomain = (d) => {
  if (!d) return "";
  return d
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase()
    .trim();
};

const isValidDomain = (d) => {
  if (!d) return false;

  if (d === "localhost") return true;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(d)) return true;

  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d);
};

const invalidSite = (siteId) =>
  !siteId ||
  ["dashboard", "undefined", "null"].includes(siteId);

/* ===================================================== */
/* ================= CREATE SITE ======================== */
/* ===================================================== */
exports.createSite = async (req, res) => {
  try {
    const userId = req.user?.id;
    let { name, domain } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Invalid name" });
    }

    domain = cleanDomain(domain);

    // Domain is optional — only validate if provided
    if (domain && !isValidDomain(domain)) {
      return res.status(400).json({ success: false, message: "Invalid domain" });
    }

    const site = await Site.create({
      userId,
      name: name.trim(),
      domain,
      siteId: generateId(),
      apiKey: generateKey(),
    });

    return res.status(201).json({
      success: true,
      data: site,
    });

  } catch (err) {
    console.error("CreateSite Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Create failed",
    });
  }
};

/* ===================================================== */
/* ================= GET SITES ========================== */
/* ===================================================== */
exports.getSites = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false });

    const sites = await Site.find({
      userId,
      isDeleted: false,
    })
      .select("name domain siteId isTrackingActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: sites });

  } catch (err) {
    console.error("GetSites Error:", err.message);
    return res.status(500).json({ success: false });
  }
};

/* ===================================================== */
/* ================= GET SINGLE ========================= */
/* ===================================================== */
exports.getSiteById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId || invalidSite(siteId)) {
      return res.status(400).json({ success: false });
    }

    const site = await Site.findOne({
      siteId,
      userId,
      isDeleted: false,
    }).select("+apiKey");

    if (!site) {
      return res.status(404).json({ success: false });
    }

    return res.json({ success: true, data: site });

  } catch (err) {
    console.error("GetSite Error:", err.message);
    return res.status(500).json({ success: false });
  }
};

/* ===================================================== */
/* ================= SCRIPT ============================= */
/* ===================================================== */
exports.getScript = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId || invalidSite(siteId)) {
      return res.status(400).json({ success: false });
    }

    const site = await Site.findOne({
      siteId,
      userId,
      isDeleted: false,
    });

    if (!site) {
      return res.status(404).json({ success: false });
    }

    const BASE_URL =
      process.env.BASE_URL ||
      `http://localhost:${process.env.PORT || 5000}`;

    const script = `<script defer data-site-id="${site.siteId}" src="${BASE_URL}/tracker.js"></script>`;

    return res.json({
      success: true,
      data: { script },
    });

  } catch (err) {
    console.error("GetScript Error:", err.message);
    return res.status(500).json({ success: false });
  }
};

/* ===================================================== */
/* ================= STATUS ============================= */
/* ===================================================== */
exports.getSiteStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId || invalidSite(siteId)) {
      return res.status(400).json({ success: false });
    }

    const eventCount = await Event.countDocuments({ siteId });

    return res.json({
      success: true,
      data: {
        isTrackingActive: eventCount > 0,
        totalEvents: eventCount,
      },
    });

  } catch (err) {
    console.error("Status Error:", err.message);
    return res.status(500).json({ success: false });
  }
};

/* ===================================================== */
/* ================= DELETE ============================= */
/* ===================================================== */
exports.deleteSite = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { siteId } = req.params;

    if (!userId || invalidSite(siteId)) {
      return res.status(400).json({ success: false });
    }

    const site = await Site.findOne({
      siteId,
      userId,
      isDeleted: false,
    });

    if (!site) {
      return res.status(404).json({ success: false });
    }

    site.isDeleted = true;
    await site.save();

    await Promise.all([
      Visit.deleteMany({ siteId }),
      Event.deleteMany({ siteId }),
      Session.deleteMany({ siteId }),
    ]);

    return res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (err) {
    console.error("Delete Error:", err.message);
    return res.status(500).json({ success: false });
  }
};