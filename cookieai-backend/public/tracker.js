(function () {
  try {
    if (window.__cookieTrackerLoaded) return;
    window.__cookieTrackerLoaded = true;

    console.log("🚀 CookieAI Tracker Loaded");

    /* ================= DEVICE DETECTION ================= */
 const getDevice = () => {
  const ua = navigator.userAgent;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad/i.test(ua);

  if (isTablet) return "Tablet";
  if (isMobile) return "Mobile";

  return "Desktop";
};
    /* ================= CONFIGURATION ================= */
    const scriptTag = document.querySelector("script[data-site-id]");
    const siteId = scriptTag?.getAttribute("data-site-id");
    const USER_AGENT = navigator.userAgent;
    const DEVICE_TYPE = getDevice();

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
    const SESSION_HAS_STARTED = "cookie_session_started_" + siteId;
    
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    let isNewSession = false;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      isNewSession = true;
      sessionStorage.setItem(SESSION_KEY, sessionId);
      console.log("🆕 NEW SESSION (Tab):", sessionId);
    }

    /* ================= TRACKING STATE ================= */
    let isTrackingEnabled = true;
    let hasActivated = false;
    let heartbeatInterval = null;
    let sessionStartTimeRecorded = Date.now();

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

    /* ================= TIME MANAGEMENT ================= */
    let lastEventTime = 0;
    const getUniqueTime = () => {
      let now = Date.now();
      if (now <= lastEventTime) {
        now = lastEventTime + 1;
      }
      lastEventTime = now;
      return new Date(now).toISOString();
    };

    /* ================= BASE PAYLOAD ================= */
    const environment = (location.hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(location.hostname)) 
      ? "preview" 
      : "production";

    const basePayload = {
      siteId,
      sessionId,
      environment,
      userAgent: USER_AGENT,
      device: DEVICE_TYPE,
      language: navigator.language,
      screen: { w: screen.width, h: screen.height },
    };

    /* ================= BUILD EVENT ================= */
    const buildEvent = (eventType) => ({
      ...basePayload,
      eventType,
      time: getUniqueTime(),
      url: location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer || "",
      viewport: { w: innerWidth, h: innerHeight },
    });

    /* ================= SEND EVENT (QUEUED) ================= */
    const sendEvent = async (eventType, extra = {}) => {
      if (!isTrackingEnabled) return;

      const event = { ...buildEvent(eventType), ...extra };

      try {
        // 🔥 Instant delivery for critical events
        if (["page_view", "session_start", "session_end"].includes(eventType)) {
          await fetch(TRACK_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
          });
          console.log(`🔥 Instant ${eventType} sent:`, event.path);
          return;
        }

        // other events → queue
        eventQueue.push(event);
      } catch (err) {
        console.error(`❌ sendEvent error (${eventType}):`, err);
      }
    };

    /* ================= PAGE VIEW TRACKING ================= */
    let lastPath = "";
    let pageStartTime = Date.now();

    const trackPageView = async () => {
      const currentPath = location.pathname;
      if (currentPath === lastPath) return;

      lastPath = currentPath;
      pageStartTime = Date.now();

      console.log("📄 Page View Detected:", lastPath);
      await sendEvent("page_view");
      
      startPageTimeTracking();
    };

    /* ================= SESSION TRACKING ================= */
    const trackSessionStart = () => {
      const hasStarted = sessionStorage.getItem(SESSION_HAS_STARTED);
      if (hasStarted && !isNewSession) return;

      console.log("🧠 Session Start:", sessionId);
      sendEvent("session_start");
      sessionStorage.setItem(SESSION_HAS_STARTED, "true");
    };

    let ended = false;
    const trackSessionEnd = () => {
      if (ended) return;
      ended = true;

      const duration = Math.round((Date.now() - sessionStartTimeRecorded) / 1000);
      console.log("🧠 Session End:", sessionId, "Duration:", duration, "s");
      
      const event = {
        ...buildEvent("session_end"),
        duration: duration,
      };

      const blob = new Blob([JSON.stringify(event)], { type: "application/json" });
      navigator.sendBeacon(TRACK_API, blob);
    };

    /* ================= PAGE TIME TRACKING ================= */
    let pageTimeInterval = null;

    const trackPageTime = () => {
      const duration = Math.round((Date.now() - pageStartTime) / 1000);
      if (duration > 0) {
        console.log("⏱️ Page Time:", location.pathname, duration, "s");
        sendEvent("page_time", { duration });
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
    const handleRouteChange = () => {
      // Small delay to ensure title and URL are updated in the DOM
      setTimeout(trackPageView, 50);
    };

    const wrapHistory = (type) => {
      const original = history[type];
      return function () {
        const res = original.apply(this, arguments);
        handleRouteChange();
        return res;
      };
    };

    history.pushState = wrapHistory("pushState");
    history.replaceState = wrapHistory("replaceState");

    window.addEventListener("popstate", handleRouteChange);

    /* ================= VISIBILITY TRACKING ================= */
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        trackPageView();
      } else {
        trackPageTime(); // Send time spent before tab hidden
      }
    });

    /* ================= PAGE LIFECYCLE ================= */
    // Initial load
    trackSessionStart();
    trackPageView();
    startHeartbeat();

    // Page unload - send session duration
    window.addEventListener("pagehide", trackSessionEnd);
    window.addEventListener("beforeunload", trackSessionEnd);

    console.log("✅ CookieAI Tracker initialized successfully");

  } catch (err) {
    console.error("❌ CookieAI Tracker Error:", err);
  }
})();