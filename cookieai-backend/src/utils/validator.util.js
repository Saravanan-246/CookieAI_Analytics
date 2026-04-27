const { URL } = require("url");

/* ---------- Validate URL ---------- */
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);

    // Only allow http / https
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/* ---------- Normalize URL ---------- */
const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url);

    // Remove trailing slash
    return parsed.href.replace(/\/$/, "");
  } catch {
    return url;
  }
};

/* ---------- Sanitize Input ---------- */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";

  return input.trim();
};

module.exports = {
  isValidUrl,
  normalizeUrl,
  sanitizeInput
};