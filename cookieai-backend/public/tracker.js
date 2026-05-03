(function () {
  try {
    if (window.__cookieTrackerLoaded) return;
    window.__cookieTrackerLoaded = true;

    /* ================= DEBUG MODE ================= */
    const DEBUG = window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1";

    const log = (...args) => { if (DEBUG) console.log("[CookieAI]", ...args); };
    const warn = (...args) => { if (DEBUG) console.warn("[CookieAI]", ...args); };

    /* ================= CONFIG ================= */
    const script =
      document.currentScript ||
      document.querySelector("script[data-site-id]");

    const siteId =
      script?.getAttribute("data-site-id") ||
      window.__COOKIEAI_SITE_ID ||
      null;

    log("🚀 TRACKER INIT siteId:", siteId);

    if (!siteId || siteId.length > 20) {
      console.error("[CookieAI] ❌ Invalid or missing siteId:", siteId);
      if (siteId && siteId.length > 20) {
        console.error("[CookieAI] ⚠️ Looks like Mongo _id — use the short siteId from your dashboard.");
      }
      return;
    }

    let origin;
    try {
      origin = script?.src
        ? new URL(script.src).origin
        : window.location.origin;
    } catch {
      origin = window.location.origin;
    }

    const TRACK_API = `${origin}/api/track`;
    const BATCH_API = `${origin}/api/track/batch`;
    const FETCH_TIMEOUT = 8000;

    /* ================= PATH TRACKING (ENHANCED) ================= */
    const getPath = () => window.location.pathname + window.location.search;
    const getFullUrl = () => window.location.href;
    const getHash = () => window.location.hash || "";

    /* ================= UNIQUE PAGE VIEW ID ================= */
    const generatePageViewId = () =>
      "pv_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

    let currentPageViewId = generatePageViewId();

    /* ================= DEVICE META ================= */
    const ua = navigator.userAgent || "";
    const getMeta = () => ({
      device: /Tablet|iPad/i.test(ua) ? "Tablet" : /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop",
      browser: (() => {
        if (/edg/i.test(ua)) return "Edge";
        if (/opr|opera/i.test(ua)) return "Opera";
        if (/chrome/i.test(ua)) return "Chrome";
        if (/firefox/i.test(ua)) return "Firefox";
        if (/safari/i.test(ua)) return "Safari";
        return "Other";
      })(),
      os: (() => {
        if (/windows/i.test(ua)) return "Windows";
        if (/mac/i.test(ua)) return "macOS";
        if (/android/i.test(ua)) return "Android";
        if (/iphone|ipad/i.test(ua)) return "iOS";
        return "Other";
      })(),
      lang: navigator.language || "en",
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });

    const getUserId = () => {
      let id = localStorage.getItem("cookieai_uid");
      if (!id) {
        id = "uid_" + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem("cookieai_uid", id);
      }
      return id;
    };

    /* ================= SESSION ================= */
    const SESSION_KEY = `cookie_session_${siteId}`;
    const SESSION_SS_KEY = `cookie_ss_${siteId}`;
    const SESSION_FLAG = `cookie_session_flag_${siteId}`;
    const SESSION_TS_KEY = `cookie_session_ts_${siteId}`;
    const QUEUE_KEY = `cookie_queue_${siteId}`;
    const LAST_PATH_KEY = `cookie_lastpath_${siteId}`;
    const LAST_PV_TS_KEY = `cookie_lastpv_ts_${siteId}`;
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    /* Session logic:
     * - sessionStorage keeps session across refreshes within same tab
     * - localStorage stores last activity timestamp for 30-min timeout
     * - New session only if: new tab OR idle > 30 minutes
     */
    const generateSessionId = () => Math.random().toString(36).slice(2) + Date.now();

    let sessionId = sessionStorage.getItem(SESSION_SS_KEY);
    const lastActivityTs = parseInt(localStorage.getItem(SESSION_TS_KEY) || "0", 10);
    const isExpired = lastActivityTs > 0 && (Date.now() - lastActivityTs > SESSION_TIMEOUT);

    if (!sessionId || isExpired) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_SS_KEY, sessionId);
      // Clear the session flag so session_start fires for the new session
      sessionStorage.removeItem(SESSION_FLAG);
    }

    // Keep localStorage in sync (backward compat)
    localStorage.setItem(SESSION_KEY, sessionId);
    localStorage.setItem(SESSION_TS_KEY, String(Date.now()));

    /* ================= SESSION QUALITY TRACKING ================= */
    const sessionStartTime = Date.now();
    let totalEvents = 0;

    /* ================= QUEUE ================= */
    let queue = [];
    let sending = false;
    let retryCount = 0;

    try {
      const saved = localStorage.getItem(QUEUE_KEY);
      if (saved) queue = JSON.parse(saved) || [];
    } catch {
      queue = [];
    }

    const saveQueue = () => {
      try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(0, 50)));
      } catch {}
    };

    /* ================= FLUSH WITH EXPONENTIAL BACKOFF ================= */
    const flushQueue = async () => {
      if (sending || queue.length === 0) return;
      sending = true;
      const batch = queue.slice(0, 15);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const res = await fetch(BATCH_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          keepalive: true,
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          queue.splice(0, batch.length);
          saveQueue();
          retryCount = 0;
          log("✅ Queue flushed:", batch.length, "events");
        } else {
          throw new Error("Batch response not ok");
        }
      } catch {
        retryCount++;
        warn("⚠️ Queue flush failed, retry:", retryCount);
      } finally {
        sending = false;
        if (queue.length > 0) {
          const delay = Math.min(30000, Math.pow(2, retryCount) * 1000);
          setTimeout(flushQueue, delay);
        }
      }
    };

    const enqueue = (payload) => {
      if (!payload || !payload.siteId || !payload.type) return;
      queue.push(payload);
      if (queue.length > 100) queue.shift();
      saveQueue();
      flushQueue();
    };

    /* ================= NETWORK RESILIENCE — RECONNECT FLUSH ================= */
    window.addEventListener("online", () => {
      log("🌐 Back online — flushing queue");
      retryCount = 0;
      flushQueue();
    });

    /* ================= PAYLOAD (ENHANCED) ================= */
    const buildPayload = (type, extraMeta = {}) => {
      if (!siteId || !type) return null;
      const m = getMeta();
      totalEvents++;
      return {
        siteId,
        sessionId,
        userId: getUserId(),
        pageViewId: currentPageViewId,
        type,
        path: getPath(),
        fullUrl: getFullUrl(),
        hash: getHash(),
        title: document.title || "Untitled",
        url: window.location.href,
        referrer: document.referrer || "",
        timestamp: new Date().toISOString(),
        device: m.device,
        browser: m.browser,
        os: m.os,
        language: m.lang,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight
        },
        meta: extraMeta
      };
    };

    /* ================= FETCH WITH TIMEOUT ================= */
    const fetchWithTimeout = (url, options, timeoutMs = FETCH_TIMEOUT) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      return fetch(url, { ...options, signal: controller.signal })
        .then(res => { clearTimeout(timeout); return res; })
        .catch(err => { clearTimeout(timeout); throw err; });
    };

    /* ================= SEND ================= */
    const send = (type, beacon = false, extraMeta = {}) => {
      if (!type) return;

      const payload = buildPayload(type, extraMeta);
      if (!payload) return;

      log("TRACK EVENT:", type, payload.path);

      if (type === "page_view") {
        fetchWithTimeout(TRACK_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {
          // Fallback: enqueue if direct send fails
          warn("⚠️ page_view direct send failed, queuing");
          enqueue(payload);
        });
        return;
      }

      // Production-grade batch list
      const batchTypes = [
        "click", "scroll", "user_inactive", "user_active",
        "scroll_25", "scroll_50", "scroll_75",
        "user_idle", "user_hidden", "user_visible",
        "error", "performance"
      ];
      if (batchTypes.includes(type)) {
        enqueue(payload);
        return;
      }

      if (beacon && navigator.sendBeacon) {
        try {
          navigator.sendBeacon(TRACK_API, JSON.stringify(payload));
        } catch {}
        return;
      }

      fetchWithTimeout(TRACK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {
        enqueue(payload);
      });
    };

    /* ================= PAGE VIEW WITH RETRY ================= */
    let pageViewRetries = 0;
    const MAX_PV_RETRIES = 2;

    const sendPageView = () => {
      const payload = buildPayload("page_view");
      if (!payload) return;

      log("📄 PAGE VIEW:", payload.path);

      fetchWithTimeout(TRACK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).then(res => {
        if (res.ok) {
          pageViewRetries = 0;
          log("✅ page_view delivered");
        } else {
          throw new Error("page_view response not ok");
        }
      }).catch(() => {
        if (pageViewRetries < MAX_PV_RETRIES) {
          pageViewRetries++;
          warn(`⚠️ page_view retry ${pageViewRetries}/${MAX_PV_RETRIES}`);
          setTimeout(sendPageView, 1000 * pageViewRetries);
        } else {
          warn("❌ page_view failed after retries, queuing");
          enqueue(payload);
          pageViewRetries = 0;
        }
      });
    };

    /* ================= SPA DEBOUNCED PAGE VIEW ================= */
    let pvTimer = null;

    // Persist lastTrackedPath in sessionStorage so refresh doesn't re-fire
    const PAGE_KEY = "cookie_lastpath_" + siteId;
    let lastTrackedPath = sessionStorage.getItem(PAGE_KEY) || "";

    const isDuplicatePageView = (path) => {
      // 🚫 prevent duplicate on refresh
      return path === lastTrackedPath;
    };

    function trackPageView() {
      const currentPath = getPath();

      // Avoid duplicate page_view for the same path within dedup window
      if (isDuplicatePageView(currentPath)) {
        log("⏭️ Duplicate page_view skipped:", currentPath);
        return;
      }

      clearTimeout(pvTimer);
      pvTimer = setTimeout(() => {
        lastTrackedPath = currentPath;
        sessionStorage.setItem(PAGE_KEY, currentPath);
        currentPageViewId = generatePageViewId();
        sendPageView();
        startTime = Date.now();
        scrollThresholds = { 25: false, 50: false, 75: false };
      }, 200);
    }

    /* ================= SPA HASH CHANGE TRACKING ================= */
    window.addEventListener("hashchange", () => {
      log("🔗 Hash changed:", getHash());
      trackPageView();
    });

    /* ================= PRODUCTION TRACKING STATE ================= */
    let startTime = Date.now();
    let scrollThresholds = { 25: false, 50: false, 75: false };

    /* ================= LISTENERS ================= */
    const init = () => {
      // Update activity timestamp
      localStorage.setItem(SESSION_TS_KEY, String(Date.now()));

      if (!sessionStorage.getItem(SESSION_FLAG)) {
        send("session_start");
        sessionStorage.setItem(SESSION_FLAG, "1");
      }

      const currentPath = getPath();
      if (!isDuplicatePageView(currentPath)) {
        lastTrackedPath = currentPath;
        sessionStorage.setItem(PAGE_KEY, currentPath);
        currentPageViewId = generatePageViewId();
        sendPageView();
      } else {
        log("⏭️ Init page_view skipped (refresh dedup)");
      }

      startTime = Date.now();
      scrollThresholds = { 25: false, 50: false, 75: false };

      // Flush any queued events from previous sessions
      flushQueue();

      // Capture performance metrics once the page has loaded
      capturePerformance();

      log("✅ Tracker initialized");
    };

    /* ================= SPA NAVIGATION ================= */
    const originalPush = history.pushState;
    history.pushState = function () {
      originalPush.apply(this, arguments);
      setTimeout(() => {
        trackPageView();
      }, 50);
    };

    const originalReplace = history.replaceState;
    history.replaceState = function () {
      originalReplace.apply(this, arguments);
      setTimeout(() => {
        trackPageView();
      }, 50);
    };

    window.addEventListener("popstate", () => {
      trackPageView();
    });

    /* ================= INTERACTION TRACKING ================= */
    window.addEventListener("click", (e) => {
      const target = e.target.closest("a, button, input[type='submit']");
      if (target) {
        send("click", false, {
          element: target.tagName.toLowerCase(),
          text: (target.innerText || target.value || "").slice(0, 50).trim(),
          id: target.id || null
        });
      }
    }, true);

    // Track visibility (hidden/visible)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        send("user_hidden");
      } else {
        send("user_visible");
        // Also mark active on return
        if (isIdle) {
          isIdle = false;
          lastActiveSent = Date.now();
          send("user_active", false, { trigger: "tab_visible" });
        }
        flushQueue();
      }
    });

    // Track scroll depth
    window.addEventListener("scroll", () => {
      const docHeight = document.body.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scroll = Math.round((window.scrollY / docHeight) * 100);
      [25, 50, 75].forEach(t => {
        if (scroll >= t && !scrollThresholds[t]) {
          scrollThresholds[t] = true;
          send(`scroll_${t}`);
        }
      });
    }, { passive: true });

    /* ================= IDLE / ACTIVE DETECTION ================= */
    const IDLE_TIMEOUT_MS = 120000; // 2 minutes
    const ACTIVE_THROTTLE_MS = 30000; // Throttle: max 1 user_active per 30s
    let idleTimer = null;
    let isIdle = false;
    let lastActiveSent = 0;

    const resetIdleTimer = () => {
      // If user was idle, mark active again (with throttle)
      if (isIdle) {
        isIdle = false;
        lastActiveSent = Date.now();
        send("user_active", false, { trigger: "interaction_after_idle" });
        log("👤 User active again");
      } else if (Date.now() - lastActiveSent > ACTIVE_THROTTLE_MS) {
        // Periodic heartbeat: confirm still active (throttled)
        lastActiveSent = Date.now();
        send("user_active", false, { trigger: "heartbeat" });
      }

      // Update session activity timestamp
      try { localStorage.setItem(SESSION_TS_KEY, String(Date.now())); } catch {}

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!isIdle) {
          isIdle = true;
          send("user_idle", false, { idleAfter: IDLE_TIMEOUT_MS });
          log("💤 User idle after 2min");
        }
      }, IDLE_TIMEOUT_MS);
    };

    ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach(evt => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // Start the idle timer immediately
    lastActiveSent = Date.now();
    resetIdleTimer();

    /* ================= ERROR TRACKING ================= */
    window.addEventListener("error", (e) => {
      send("error", false, {
        errorType: "runtime",
        message: (e.message || "Unknown error").slice(0, 200),
        source: (e.filename || "").slice(0, 200),
        line: e.lineno || null,
        col: e.colno || null
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      let message = "Unhandled Promise Rejection";
      try {
        if (e.reason) {
          message = typeof e.reason === "string"
            ? e.reason
            : (e.reason.message || e.reason.toString());
        }
      } catch {}
      send("error", false, {
        errorType: "unhandledrejection",
        message: message.slice(0, 200)
      });
    });

    /* ================= PERFORMANCE TRACKING ================= */
    const capturePerformance = () => {
      // Use a small delay to ensure performance entries are populated
      setTimeout(() => {
        try {
          const nav = performance.getEntriesByType("navigation")[0];
          if (nav) {
            send("performance", false, {
              pageLoad: Math.round(nav.loadEventEnd - nav.startTime),
              domLoad: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
              domInteractive: Math.round(nav.domInteractive - nav.startTime),
              ttfb: Math.round(nav.responseStart - nav.requestStart),
              redirectTime: Math.round(nav.redirectEnd - nav.redirectStart),
              dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
              connectionTime: Math.round(nav.connectEnd - nav.connectStart)
            });
            log("⚡ Performance captured");
          } else if (performance.timing) {
            // Fallback for older browsers
            const t = performance.timing;
            send("performance", false, {
              pageLoad: t.loadEventEnd - t.navigationStart,
              domLoad: t.domContentLoadedEventEnd - t.navigationStart,
              domInteractive: t.domInteractive - t.navigationStart,
              ttfb: t.responseStart - t.navigationStart
            });
            log("⚡ Performance captured (legacy)");
          }
        } catch (e) {
          warn("⚠️ Performance capture failed:", e);
        }
      }, 1000);
    };

    /* ================= SESSION END + PAGE LEAVE ================= */
    // Track page duration + flush queue on exit
    window.addEventListener("beforeunload", () => {
      flushQueue();
      send("page_leave", true, {
        duration: Date.now() - startTime
      });
      // Send session quality data
      send("session_end", true, {
        duration: Date.now() - sessionStartTime,
        totalEvents
      });
    });

    window.addEventListener("pagehide", () => {
      flushQueue();
      send("user_leave", true, {
        duration: Date.now() - startTime
      });
    });

    /* ================= START ================= */
    if (document.readyState === "complete") {
      init();
    } else {
      window.addEventListener("load", init, { once: true });
    }

  } catch (err) {
    console.error("[CookieAI] Tracker Error:", err);
  }
})();