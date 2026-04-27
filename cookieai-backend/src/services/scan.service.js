const fastScan = require("./fast.service");
const deepScan = require("./deep.service");
const { detectTrackers } = require("./detect.service");
const { calculateRisk } = require("../utils/risk.util");

/* ---------- TIMEOUT WRAPPER ---------- */
const withTimeout = (promise, ms = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scan timeout")), ms)
    ),
  ]);

module.exports = async (url) => {
  let scripts = [];
  let cookies = [];
  let mode = "fast";

  try {
    /* ---------- FAST SCAN ---------- */
    const fast = await withTimeout(fastScan(url), 8000);

    scripts = fast?.scripts || [];
    cookies = fast?.cookies || [];

    /* ---------- FALLBACK ---------- */
    if (scripts.length < 3) {
      try {
        const deep = await withTimeout(deepScan(url), 12000);

        scripts = deep?.scripts || scripts;
        cookies = deep?.cookies || cookies;
        mode = "deep";
      } catch {
        // fallback fails → keep fast result
        mode = "fast-fallback";
      }
    }

    /* ---------- LIMIT (SAFETY) ---------- */
    scripts = scripts.slice(0, 100);
    cookies = cookies.slice(0, 50);

    /* ---------- DETECT ---------- */
    const trackers = detectTrackers(scripts);

    /* ---------- RISK ---------- */
    const risk = calculateRisk({
      scripts,
      cookies,
      trackers,
    });

    return {
      success: true,
      mode,
      totalScripts: scripts.length,
      trackers,
      cookiesDetected: cookies.length,
      riskScore: risk.score,
      level: risk.level,
      issues: risk.issues,
      insights: risk.insights,
    };
  } catch (err) {
    return {
      success: false,
      mode: "error",
      totalScripts: 0,
      trackers: [],
      cookiesDetected: 0,
      riskScore: 0,
      level: "unknown",
      issues: [],
      insights: [],
      error: err.message,
    };
  }
};