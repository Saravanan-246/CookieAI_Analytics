import {
  useEffect,
  useRef,
  useState,
} from "react";

import socketService from "../../services/socket.service";

export const useRealtime = (siteId) => {

  /* ───────────────── STATES ───────────────── */

  const [activeUsers, setActiveUsers] =
    useState(0);

  const [events, setEvents] =
    useState([]);

  const [analytics, setAnalytics] =
    useState(null);

  const [traffic, setTraffic] =
    useState([]);

  /* ───────────────── REFS ───────────────── */

  const MAX_EVENTS = 20;

  const seen = useRef(new Set());

  const mounted = useRef(false);

  /* ───────────────── EFFECT ───────────────── */

  useEffect(() => {

    if (!siteId) return;

    if (mounted.current) return;

    mounted.current = true;

    /* CONNECT */
    socketService.connect();

    socketService.join(siteId);

    /* ───────────────── ANALYTICS UPDATE ───────────────── */

    const onAnalyticsUpdate = (data) => {

      if (!data) return;

      setAnalytics(data);

      /* Socket payload structure: { stats: { pageViews, activeUsers, ... }, updatedAt } */
      const stats = data?.stats || data;

      /* ACTIVE USERS */
      const users = Number(
        stats?.activeUsers || 0
      );

      setActiveUsers(users);

      /* REALTIME TRAFFIC — read from stats (socket wraps under .stats) */
      const visits = Number(

        stats?.pageViews ??

        stats?.visitors ??

        stats?.totalVisitors ??

        stats?.activeUsers ??

        0

      );

      /* Bucket to the current minute for dedup */
      const now = new Date();
      now.setSeconds(0, 0);
      const bucketTime = now.toISOString();

      const realtimePoint = {

        time: bucketTime,

        visits:
          !isNaN(visits) &&
          visits >= 0

            ? visits

            : 0,

      };

      setTraffic((prev) => {

        const merged = [

          ...prev,

          realtimePoint,

        ];

        /* REMOVE DUPLICATES — keep latest value per time bucket */
        const unique = Array.from(

          new Map(

            merged.map((item) => [

              item.time,

              item,

            ])

          ).values()

        );

        /* KEEP LAST 60 for better graph density */
        return unique.slice(-60);

      });

    };

    /* ───────────────── VISITOR ONLINE ───────────────── */

    const onVisitorOnline = (e) => {

      if (!e) return;

      const id =

        e?.sessionId ||

        e?._id ||

        `${Date.now()}_${Math.random()}`;

      if (seen.current.has(id)) {
        return;
      }

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

    };

    /* ───────────────── VISITOR OFFLINE ───────────────── */

    const onVisitorOffline = ({
      sessionId,
    }) => {

      if (!sessionId) return;

      seen.current.delete(sessionId);

      setEvents((prev) =>

        prev.filter(

          (ev) =>

            ev?.sessionId !== sessionId

        )

      );

    };

    /* ───────────────── REMOVE OLD ───────────────── */

    socketService.off(
      "analytics:update"
    );

    socketService.off(
      "visitor-online"
    );

    socketService.off(
      "visitor-offline"
    );

    /* ───────────────── SUBSCRIBE ───────────────── */

    socketService.on(
      "analytics:update",
      onAnalyticsUpdate
    );

    socketService.on(
      "visitor-online",
      onVisitorOnline
    );

    socketService.on(
      "visitor-offline",
      onVisitorOffline
    );

    /* ───────────────── CLEANUP ───────────────── */

    return () => {

      mounted.current = false;

      socketService.leave(siteId);

      socketService.off(
        "analytics:update",
        onAnalyticsUpdate
      );

      socketService.off(
        "visitor-online",
        onVisitorOnline
      );

      socketService.off(
        "visitor-offline",
        onVisitorOffline
      );

      seen.current.clear();

    };

  }, [siteId]);

  /* ───────────────── RETURN ───────────────── */

  return {

    activeUsers,

    events,

    analytics,

    traffic,

  };

};