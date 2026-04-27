const TRACKERS = [
  { name: "Google Analytics", patterns: ["google-analytics", "gtag("] },
  { name: "Google Tag Manager", patterns: ["googletagmanager", "datalayer"] },
  { name: "Google Ads", patterns: ["doubleclick", "adsbygoogle"] },
  { name: "Facebook Pixel", patterns: ["fbq(", "connect.facebook.net"] },
  { name: "Hotjar", patterns: ["hotjar"] },
];

/* ---------- DETECT ---------- */
exports.detectTrackers = (scripts = []) => {
  if (!Array.isArray(scripts) || scripts.length === 0) return [];

  const found = new Set();

  for (const script of scripts) {
    // 🔥 only use src (fast + safe)
    const text = (script?.src || "").toLowerCase();

    if (!text) continue;

    for (const tracker of TRACKERS) {
      // skip if already found
      if (found.has(tracker.name)) continue;

      for (const pattern of tracker.patterns) {
        if (text.includes(pattern)) {
          found.add(tracker.name);
          break; // 🔥 stop checking patterns
        }
      }
    }

    // 🔥 early exit if all found
    if (found.size === TRACKERS.length) break;
  }

  return [...found];
};