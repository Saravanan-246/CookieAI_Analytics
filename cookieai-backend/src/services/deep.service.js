const puppeteer = require("puppeteer");

module.exports = async (url) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // 🔥 fast load (skip images/fonts)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent("Mozilla/5.0");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // 🔥 no fixed wait → better
    await page.waitForSelector("body", { timeout: 5000 });

    /* ---------- SCRIPTS (LIMITED) ---------- */
    const scripts = await page.$$eval("script", (els) =>
      els.slice(0, 50).map((el) => ({
        src: el.src || null,
        inline: !!el.innerHTML,
      }))
    );

    /* ---------- COOKIES (SAFE) ---------- */
    const cookies = (await page.cookies()).map((c) => ({
      name: c.name,
      domain: c.domain,
      secure: c.secure,
      httpOnly: c.httpOnly,
    }));

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
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
};