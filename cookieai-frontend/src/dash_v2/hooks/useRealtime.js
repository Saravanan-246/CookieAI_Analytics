import { useEffect, useRef, useState } from "react";
import socketService from "../../services/socket.service";

export const useRealtime = (siteId) => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const MAX_EVENTS = 20;
  const seen = useRef(new Set());

  useEffect(() => {
    if (!siteId) return;

    /* 🔥 CONNECT + JOIN */
    socketService.connect();
    socketService.join(siteId);

    /* ---------- HANDLERS ---------- */

    // 🔴 FULL DASHBOARD UPDATE
    const onAnalyticsUpdate = (data) => {
      if (!data) return;
      setAnalytics(data);

      if (typeof data.activeUsers === "number") {
        setActiveUsers(data.activeUsers);
      }
    };

    // 🔴 NEW USER ONLINE
    const onVisitorOnline = (e) => {
      if (!e) return;

      const id =
        e.sessionId || `${Date.now()}_${Math.random()}`;

      if (seen.current.has(id)) return;
      seen.current.add(id);

      setEvents((prev) => {
        const next = [
          {
            ...e,
            _id: id,
            type: "online",
          },
          ...prev,
        ];
        return next.slice(0, MAX_EVENTS);
      });

      setActiveUsers((prev) => prev + 1);
    };

    // 🔴 USER OFFLINE
    const onVisitorOffline = ({ sessionId }) => {
      if (!sessionId) return;

      setEvents((prev) =>
        prev.filter((ev) => ev.sessionId !== sessionId)
      );

      setActiveUsers((prev) => Math.max(prev - 1, 0));
    };

    /* ---------- SUBSCRIBE ---------- */

    socketService.on("analytics:update", onAnalyticsUpdate);
    socketService.on("visitor-online", onVisitorOnline);
    socketService.on("visitor-offline", onVisitorOffline);

    /* ---------- CLEANUP ---------- */
    return () => {
      socketService.leave(siteId);

      socketService.off("analytics:update", onAnalyticsUpdate);
      socketService.off("visitor-online", onVisitorOnline);
      socketService.off("visitor-offline", onVisitorOffline);

      seen.current.clear();
    };
  }, [siteId]);

  return {
    activeUsers,
    events,
    analytics, // 🔥 full dashboard data
  };
};