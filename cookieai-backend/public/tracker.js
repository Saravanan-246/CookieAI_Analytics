(function () {
  try {
    if (window.__cookieai_loaded) return;
    window.__cookieai_loaded = true;

    /* ---------- SCRIPT + SITE ---------- */
    const script =
      document.currentScript ||
      document.querySelector("script[data-site-id]");

    const siteId =
      script?.getAttribute("data-site-id") ||
      window.__COOKIEAI_SITE_ID ||
      null;

    if (!siteId) return;

    let origin;
    try {
      origin = script?.src
        ? new URL(script.src).origin
        : location.origin;
    } catch {
      origin = location.origin;
    }

    const TRACK_API = `${origin}/api/track`;

    /* ---------- SESSION ---------- */
    const SESSION_KEY = "cookieai_session";
    const sessionId =
      localStorage.getItem(SESSION_KEY) ||
      (() => {
        const id =
          Date.now().toString(36) +
          Math.random().toString(36).slice(2, 8);
        localStorage.setItem(SESSION_KEY, id);
        return id;
      })();

    /* ---------- DEVICE DETECTION ---------- */
    function getDeviceType() {
      const ua = navigator.userAgent;
      if (/Mobi|Android/i.test(ua)) return "Mobile";
      if (/Tablet|iPad/i.test(ua)) return "Tablet";
      return "Desktop";
    }

    function getBrowser() {
      const ua = navigator.userAgent;
      if (/edg/i.test(ua)) return "Edge";
      if (/opr|opera/i.test(ua)) return "Opera";
      if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
      if (/firefox/i.test(ua)) return "Firefox";
      if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
      return "Other";
    }

    function getOS() {
      const ua = navigator.userAgent;
      if (/windows/i.test(ua)) return "Windows";
      if (/mac/i.test(ua)) return "macOS";
      if (/android/i.test(ua)) return "Android";
      if (/iphone|ipad/i.test(ua)) return "iOS";
      return "Other";
    }

    /* ---------- SEND EVENT ---------- */
    function sendEvent(payload, useBeacon = false) {
      const body = JSON.stringify(payload);

      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_API, body);
        return;
      }

      fetch(TRACK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
    }

    /* ---------- PAGE VIEW ---------- */
    let lastTracked = 0;

    function trackPage() {
      const now = Date.now();

      // prevent rapid duplicate calls
      if (now - lastTracked < 300) return;
      lastTracked = now;

      sendEvent({
        type: "page_view",
        siteId,
        sessionId,
        path: location.pathname,
        url: location.href,
        referrer: document.referrer || null,
        device: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        userAgent: navigator.userAgent,
        timestamp: now
      });
    }

    /* ---------- INIT ---------- */
    function initTracking() {
      trackPage();

      // Prevent double patch
      if (!window.__cookieai_history_patched) {
        window.__cookieai_history_patched = true;

        const originalPush = history.pushState;
        history.pushState = function () {
          originalPush.apply(this, arguments);
          setTimeout(trackPage, 50);
        };

        const originalReplace = history.replaceState;
        history.replaceState = function () {
          originalReplace.apply(this, arguments);
          setTimeout(trackPage, 50);
        };

        window.addEventListener("popstate", trackPage);
      }

      /* ---------- VISIBILITY ---------- */
      document.addEventListener("visibilitychange", function () {
        const payload = {
          type: document.hidden ? "user_hidden" : "user_visible",
          siteId,
          sessionId,
          timestamp: Date.now()
        };

        sendEvent(payload, document.hidden);
      });
    }

    /* ---------- SITE STATUS CHECK ---------- */
    fetch(`${origin}/api/site/status?siteId=${siteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.active) {
          initTracking();
        }
      })
      .catch(() => {
        // fallback: track anyway
        initTracking();
      });

  } catch (err) {
    console.error("[CookieAI] Tracker Error:", err);
  }
})();