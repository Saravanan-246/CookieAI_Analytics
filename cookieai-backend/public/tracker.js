(function () {
  try {
    if (window.__cookieTrackerLoaded) return;
    window.__cookieTrackerLoaded = true;

    console.log("🚀 CookieAI Tracker Loaded");

    /* ================= CONFIGURATION ================= */
    const scriptTag = document.querySelector("script[data-site-id]");
    const siteId = scriptTag?.getAttribute("data-site-id");

    if (!siteId) {
      console.error("❌ CookieAI: data-site-id attribute missing");
      return;
    }

    // Dynamic API base from script src
    const scriptSrc = scriptTag?.src || "";
    const API_BASE = window.COOKIE_API || 
      (scriptSrc ? scriptSrc.replace(/\/[^/]*$/, "/api") : "http://localhost:5000/api");
    const TRACK_API = `${API_BASE}/track`;
    const ACTIVATE_API = `${API_BASE}/sites/activate`;

    console.log("✅ CookieAI: Tracking site", siteId);
    console.log("📡 API Base:", API_BASE);

    /* ================= SESSION MANAGEMENT ================= */
    const SESSION_KEY = "cookie_session_" + siteId;
    const SESSION_TIME = "cookie_session_time_" + siteId;
    const SESSION_START_KEY = "cookie_session_start_" + siteId;
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    let sessionId = localStorage.getItem(SESSION_KEY);
    let lastTime = parseInt(localStorage.getItem(SESSION_TIME) || "0");
    let sessionStartTime = parseInt(localStorage.getItem(SESSION_START_KEY) || "0");
    const now = Date.now();

    // Check if session expired
    if (!sessionId || now - lastTime > SESSION_DURATION) {
      sessionId = crypto.randomUUID();
      sessionStartTime = now;
      localStorage.setItem(SESSION_KEY, sessionId);
      localStorage.setItem(SESSION_TIME, now);
      localStorage.setItem(SESSION_START_KEY, now);
      console.log("🆕 NEW SESSION:", sessionId);
    } else {
      localStorage.setItem(SESSION_TIME, now);
    }



    /* ================= TRACKING STATE ================= */
    let isTrackingEnabled = true;
    let hasActivated = false;
    let heartbeatInterval = null;
    let sessionStartTimeRecorded = sessionStartTime;

    /* ================= EVENT QUEUE SYSTEM ================= */
    const eventQueue = [];
    const MAX_QUEUE_SIZE = 50;
    const RETRY_DELAY = 5000;
    const MAX_RETRIES = 3;

    const flushQueue = async () => {
      if (eventQueue.length === 0 || !isTrackingEnabled) return;

      const eventsToSend = eventQueue.splice(0, MAX_QUEUE_SIZE);

      for (const event of eventsToSend) {
        try {
          const response = await fetch(TRACK_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
          });

          const data = await response.json();

          if (!data.success && data.code === "INVALID_SITE") {
            isTrackingEnabled = false;
            console.warn("⚠️ Tracking stopped: invalid or deleted site");
            return;
          }

          if (data.success && !hasActivated) {
            hasActivated = true;
            // Trigger activate endpoint
            fetch(ACTIVATE_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ siteId }),
            }).catch(() => {});
          }

          console.log("✅ Event sent:", event.eventType, event.path);
        } catch (err) {
          console.error("❌ Send error:", err);
          event._retry = (event._retry || 0) + 1;
          if (event._retry < MAX_RETRIES) {
            eventQueue.push(event);
          }
        }
      }
    };

    // Flush queue periodically as a fallback
    setInterval(flushQueue, 10000);

    /* ================= BASE PAYLOAD ================= */
    const environment = (location.hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(location.hostname)) 
      ? "preview" 
      : "production";

    const basePayload = {
      siteId,
      sessionId,
      environment,
      userAgent: navigator.userAgent,
      device: navigator.userAgent,
      language: navigator.language,
      screen: { w: screen.width, h: screen.height },
    };

    /* ================= BUILD EVENT ================= */
    const buildEvent = (eventType) => ({
      ...basePayload,
      eventType,
      time: new Date().toISOString(),
      url: location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer || "",
      viewport: { w: innerWidth, h: innerHeight },
    });

    /* ================= SEND EVENT (QUEUED) ================= */
    const sendEvent = (eventType) => {
      if (!isTrackingEnabled) return;

      const event = buildEvent(eventType);
      eventQueue.push(event);

      // Only flush immediately for page views to ensure they are captured before navigation
      if (eventType === "page_view") {
        flushQueue();
      }

      console.log("📡 Queued:", eventType, event.path);
    };

    /* ================= ACTIVATION (handled inline in flushQueue) ================= */

    /* ================= PAGE VIEW TRACKING ================= */
    let lastPath = "";

    const trackPageView = () => {
      if (location.pathname === lastPath) return;
      lastPath = location.pathname;

      pageStartTime = Date.now(); // Reset page time on new page view

      console.log("📄 Page View:", lastPath);
      sendEvent("page_view");
      startPageTimeTracking(); // Start page time tracking
    };

    /* ================= SESSION TRACKING ================= */
    const trackSessionStart = () => {
      console.log("🧠 Session Start:", sessionId);
      sendEvent("session_start");
    };

    let ended = false;
    const trackSessionEnd = () => {
      if (ended) return;
      ended = true;

      const duration = Date.now() - sessionStartTimeRecorded;
      console.log("🧠 Session End:", sessionId, "Duration:", Math.round(duration / 1000), "s");
      
      // Use sendBeacon for reliable delivery on page unload
      const event = {
        ...buildEvent("session_end"),
        duration: Math.round(duration / 1000),
      };

      const blob = new Blob([JSON.stringify(event)], { type: "application/json" });
      navigator.sendBeacon(TRACK_API, blob);
    };

    /* ================= PAGE TIME TRACKING ================= */
    let pageStartTime = Date.now();
    let pageTimeInterval = null;

    const trackPageTime = () => {
      const duration = Math.round((Date.now() - pageStartTime) / 1000);
      if (duration > 0) {
        console.log("⏱️ Page Time:", location.pathname, duration, "s");
        const event = buildEvent("page_time");
        event.duration = duration;
        eventQueue.push(event);
        pageStartTime = Date.now(); // Reset for next interval
      }
    };

    const startPageTimeTracking = () => {
      if (pageTimeInterval) clearInterval(pageTimeInterval);
      pageTimeInterval = setInterval(trackPageTime, 60000); // Every 60 seconds
    };

    /* ================= HEARTBEAT TRACKING ================= */
    const startHeartbeat = () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      
      heartbeatInterval = setInterval(() => {
        if (document.visibilityState === "visible" && isTrackingEnabled) {
          sendEvent("heartbeat");
        }
      }, 60000); // 60 seconds
    };

    /* ================= SPA ROUTE TRACKING ================= */
    const wrapHistory = (type) => {
      const original = history[type];

      return function () {
        original.apply(this, arguments);
        setTimeout(trackPageView, 200);
      };
    };

    history.pushState = wrapHistory("pushState");
    history.replaceState = wrapHistory("replaceState");

    window.addEventListener("popstate", () => {
      setTimeout(trackPageView, 200);
    });

    /* ================= VISIBILITY TRACKING ================= */
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // Track page view when tab becomes visible
        trackPageView();
      }
    });

    /* ================= PAGE LIFECYCLE ================= */
    // Initial page load
    trackSessionStart();
    trackPageView();
    startHeartbeat();

    // Page unload - send session duration
    window.addEventListener("pagehide", trackSessionEnd);
    window.addEventListener("beforeunload", trackSessionEnd);

    console.log(" CookieAI Tracker initialized successfully");

  } catch (err) {
    console.error(" CookieAI Tracker Error:", err);
  }
})();