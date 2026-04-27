const scanService = require("../services/scan.service");
const {
  isValidUrl,
  sanitizeInput,
  normalizeUrl,
} = require("../utils/validator.util");

const dns = require("dns").promises;
const net = require("net");

/* ===================================================== */
/* 🔒 BLOCK PRIVATE / LOCAL IPS (SECURITY) */
/* ===================================================== */
const isPrivateIP = (ip) => {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("172.") // optional stricter check
  );
};

const isLocalhost = (host) =>
  host === "localhost" || host === "127.0.0.1";

/* ===================================================== */
/* ⏱️ TIMEOUT WRAPPER */
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
/* 🚀 SCAN WEBSITE */
/* ===================================================== */
exports.scanWebsite = async (req, res, next) => {
  try {
    let { url } = req.body || {};

    /* ---------- BASIC VALIDATION ---------- */
    if (!url || typeof url !== "string" || url.length > 2048) {
      const err = new Error("Invalid URL");
      err.statusCode = 400;
      return next(err);
    }

    /* ---------- SANITIZE ---------- */
    url = normalizeUrl(sanitizeInput(url));

    if (!isValidUrl(url)) {
      const err = new Error("Invalid URL format");
      err.statusCode = 400;
      return next(err);
    }

    const parsed = new URL(url);

    /* ---------- BLOCK LOCALHOST ---------- */
    if (isLocalhost(parsed.hostname)) {
      const err = new Error("Localhost scanning not allowed");
      err.statusCode = 403;
      return next(err);
    }

    /* ---------- DNS RESOLVE ---------- */
    let ip;
    try {
      const result = await dns.lookup(parsed.hostname);
      ip = result.address;
    } catch {
      const err = new Error("Unable to resolve domain");
      err.statusCode = 400;
      return next(err);
    }

    /* ---------- BLOCK PRIVATE IP ---------- */
    if (!net.isIP(ip) || isPrivateIP(ip)) {
      const err = new Error("Private IP scanning blocked");
      err.statusCode = 403;
      return next(err);
    }

    /* ---------- SCAN ---------- */
    const result = await withTimeout(scanService(url), 15000);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("Scan Error:", err.message);

    if (err.message === "Scan timeout") {
      err.statusCode = 504;
    }

    next(err);
  }
};