(function () {
  try {
    if (window.__cookieai_loaded) return;
    window.__cookieai_loaded = true;

    const script = document.currentScript || document.querySelector("script[data-site-id]");
    const siteId = script?.getAttribute("data-site-id") || window.__COOKIEAI_SITE_ID || null;

    if (!siteId) return;

    let origin;
    try {
      origin = script?.src ? new URL(script.src).origin : "http://localhost:5000";
    } catch {
      origin = "http://localhost:5000";
    }

    const TRACK_API = `${origin}/api/track`;

    const sessionId =
      localStorage.getItem("cookieai_session") ||
      (() => {
        const id = Math.random().toString(36).slice(2);
        localStorage.setItem("cookieai_session", id);
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

    function trackPage() {
      fetch(TRACK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          sessionId,
          type: "page_view",
          path: window.location.pathname,
          device: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      }).catch(console.error);
    }

    /* ---------- SITE VALIDATION + START ---------- */
    function initTracking() {
      trackPage();

      // Track SPA navigation
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

      // Track visibility for instant active/inactive status
      document.addEventListener("visibilitychange", function () {
        // Use sendBeacon if available for better reliability when leaving
        const payload = JSON.stringify({
          type: document.hidden ? "user_hidden" : "user_visible",
          siteId: siteId,
          sessionId: sessionId,
          timestamp: Date.now()
        });
        
        if (document.hidden && navigator.sendBeacon) {
          navigator.sendBeacon(TRACK_API, payload);
        } else {
          fetch(TRACK_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
          }).catch(console.error);
        }
      });
    }

    // Check if site is still active before tracking
    fetch(`${origin}/api/site/status?siteId=${siteId}`)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.active) {
          initTracking();
        }
      })
      .catch(function () {
        // If status check fails, track anyway (network error, not deletion)
        initTracking();
      });

  } catch (err) {
    console.error("[CookieAI] Tracker Error:", err);
  }
})();