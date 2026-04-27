/* ---------- Calculate Risk ---------- */
const calculateRisk = ({ scripts = [], cookies = [], trackers = [] }) => {
  let score = 0;
  const issues = [];
  const insights = [];

  const scriptCount = scripts.length;
  const cookieCount = cookies.length;
  const trackerCount = trackers.length;

  /* ---------- TRACKERS ---------- */
  if (trackerCount > 0) {
    score += 40;
    issues.push("Tracking scripts detected");
    insights.push(`Detected ${trackerCount} tracking tool(s)`);
  }

  /* ---------- COOKIES ---------- */
  if (cookieCount > 0) {
    score += 20;
    issues.push("Cookies are being set");
    insights.push(`Site sets ${cookieCount} cookie(s)`);
  }

  /* ---------- TOO MANY SCRIPTS ---------- */
  if (scriptCount > 10) {
    score += 20;
    issues.push("Too many scripts loaded");
  }

  /* ---------- HIDDEN TRACKING (IMPORTANT) ---------- */
  if (trackerCount === 0 && cookieCount > 0 && scriptCount > 5) {
    score += 20;
    issues.push("Potential hidden tracking");
    insights.push("Site may use first-party or hidden tracking mechanisms");
  }

  /* ---------- RISK LEVEL ---------- */
  let level = "Low";

  if (score > 60) level = "High";
  else if (score > 30) level = "Medium";

  /* ---------- EXTRA INSIGHTS ---------- */
  if (level === "High") {
    insights.push("High privacy risk — consider cookie consent banner");
  } else if (level === "Medium") {
    insights.push("Moderate tracking — review privacy practices");
  } else {
    insights.push("Low risk — minimal tracking detected");
  }

  return {
    score,
    level,
    issues,
    insights
  };
};

module.exports = {
  calculateRisk
};