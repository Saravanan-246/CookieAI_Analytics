const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

/* ---------- NORMALIZE ---------- */
const normalizeUrl = (src, base) => {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
};

module.exports = async (url) => {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 8000,
      maxRedirects: 3,
      validateStatus: (s) => s >= 200 && s < 500, // avoid throw
    });

    const html = res.data || "";
    const $ = cheerio.load(html);

    /* ---------- COOKIES (SAFE) ---------- */
    const cookies = (res.headers["set-cookie"] || []).map((c) =>
      c.split(";")[0] // only name=value
    );

    /* ---------- SCRIPTS (LIMITED) ---------- */
    const scripts = [];

    $("script").each((_, el) => {
      if (scripts.length >= 50) return false; // 🔥 limit

      const src = $(el).attr("src");

      scripts.push({
        src: src ? normalizeUrl(src, url) : null,
        inline: !!$(el).html(), // 🔥 no heavy content
      });
    });

    return {
      success: true,
      scripts,
      cookies,
    };
  } catch (err) {
    return {
      success: false,
      scripts: [],
      cookies: [],
      error: err.message,
    };
  }
};