const scanService = require("../services/scan.service");
const {
  isValidUrl,
  sanitizeInput,
  normalizeUrl,
} = require("../utils/validator.util");

const dns = require("dns").promises;
const net = require("net");

/* ===================================================== */
/* 🔒 PRIVATE / LOCAL IP BLOCK (STRONG) */
/* ===================================================== */
const isPrivateIP = (ip) => {
  if (!ip) return true;

  // IPv4 private ranges
  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    ip.startsWith("169.254.") ||
    (ip.startsWith("172.") &&
      Number(ip.split(".")[1]) >= 16 &&
      Number(ip.split(".")[1]) <= 31)
  ) {
    return true;
  }

  // IPv6 local / private
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }

  return false;
};

const isLocalhost = (host) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1";

/* ===================================================== */
/* ⏱️ TIMEOUT */
/* ===================================================== */
const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        const e = new Error("Scan timeout");
        e.statusCode = 504;
        reject(e);
      }, ms)
    ),
  ]);

/* ===================================================== */
/* 🌐 RESOLVE SAFE IP */
/* ===================================================== */
const resolveSafeIP = async (hostname) => {
  const records = await dns.lookup(hostname, { all: true });

  if (!records || records.length === 0) {
    throw new Error("DNS resolution failed");
  }

  // pick first valid public IP
  for (const r of records) {
    if (net.isIP(r.address) && !isPrivateIP(r.address)) {
      return r.address;
    }
  }

  throw new Error("Blocked private IP");
};

/* ===================================================== */
/* 🚀 SCAN WEBSITE */
/* ===================================================== */
exports.scanWebsite = async (req, res, next) => {
  try {
    let { url } = req.body || {};

    /* ---------- BASIC VALIDATION ---------- */
    if (!url || typeof url !== "string" || url.length > 2048) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    /* ---------- SANITIZE ---------- */
    url = normalizeUrl(sanitizeInput(url));

    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format",
      });
    }

    const parsed = new URL(url);

    /* ---------- PROTOCOL CHECK ---------- */
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Only HTTP/HTTPS allowed",
      });
    }

    /* ---------- BLOCK LOCALHOST ---------- */
    if (isLocalhost(parsed.hostname)) {
      return res.status(403).json({
        success: false,
        message: "Localhost not allowed",
      });
    }

    /* ---------- BLOCK CUSTOM PORTS (OPTIONAL) ---------- */
    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      return res.status(403).json({
        success: false,
        message: "Custom ports blocked",
      });
    }

    /* ---------- DNS + IP VALIDATION ---------- */
    let ip;
    try {
      ip = await resolveSafeIP(parsed.hostname);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: err.message || "Unsafe target",
      });
    }

    /* ---------- FINAL SECURITY CHECK ---------- */
    if (!net.isIP(ip) || isPrivateIP(ip)) {
      return res.status(403).json({
        success: false,
        message: "Private IP blocked",
      });
    }

    /* ---------- SCAN ---------- */
    const result = await withTimeout(scanService(url), 15000);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("❌ Scan Error:", err.message);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Scan failed",
    });
  }
};