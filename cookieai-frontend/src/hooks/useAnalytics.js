import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import analyticsService from "../services/analytics.service";
import { socketService } from "../services/socket.service";

/**
 * Enhanced analytics hook with:
 * - Reliable hasData detection
 * - Socket reconnection awareness
 * - Install detection (script copied OR first event)
 * - Conditional polling (10s until data arrives, then stops)
 * - Memoized derived state
 */
export const useAnalytics = (siteId) => {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);
  const [receivedRealData, setReceivedRealData] = useState(false);
  const socketSetupRef = useRef(null);

  // 🔥 block invalid ids
  const validSiteId =
    siteId && siteId !== "dashboard" && siteId !== "undefined" && siteId !== "null"
      ? siteId
      : null;

  /* ================= QUERY ================= */
  const query = useQuery({
    queryKey: ["analytics", validSiteId],
    queryFn: () => analyticsService.getSummary(validSiteId),
    enabled: !!validSiteId,
    staleTime: 30000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /* ================= DERIVED: hasData (memoized) ================= */
  const hasData = useMemo(() => {
    const d = query.data;
    if (!d) return false;

    const stats = d.stats || d;
    return (
      (stats.totalVisitors || 0) > 0 ||
      (stats.totalPageViews || 0) > 0 ||
      (stats.pageViews || 0) > 0 ||
      (stats.visitors || 0) > 0 ||
      (stats.sessions || 0) > 0 ||
      (stats.activeUsers || 0) > 0 ||
      receivedRealData
    );
  }, [query.data, receivedRealData]);

  /* ================= CONDITIONAL POLLING (10s until data arrives) ================= */
  useEffect(() => {
    if (!validSiteId || hasData) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["analytics", validSiteId] });
    }, 10000);

    return () => clearInterval(interval);
  }, [validSiteId, hasData, queryClient]);

  /* ================= SOCKET CONNECTION ================= */
  useEffect(() => {
    if (!validSiteId) return;

    // Prevent duplicate socket setup for same siteId
    if (socketSetupRef.current === validSiteId) return;
    socketSetupRef.current = validSiteId;

    socketService.connect();

    const handleUpdate = (newData) => {
      console.log("⚡ Real-time update received:", newData);

      // Mark that we received real data from socket
      setReceivedRealData(true);

      queryClient.setQueryData(["analytics", validSiteId], (oldData) => {
        if (!oldData) return newData;
        return {
          ...oldData,
          stats: newData.stats ?? oldData.stats,
          traffic: newData.traffic?.length ? newData.traffic : oldData.traffic,
          devices: newData.devices?.length ? newData.devices : oldData.devices,
          browsers: newData.browsers?.length ? newData.browsers : oldData.browsers,
          countries: newData.countries?.length ? newData.countries : oldData.countries,
          pages: newData.pages?.length ? newData.pages : oldData.pages,
          tables: newData.tables ?? oldData.tables,
          charts: newData.charts ?? oldData.charts,
        };
      });
    };

    socketService.on("analytics:update", handleUpdate);

    // Track socket connection state
    const socket = socketService.getInstance();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socketService.off("analytics:update", handleUpdate);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socketSetupRef.current = null;
    };
  }, [validSiteId, queryClient]);

  /* ================= SOCKET JOIN/LEAVE ================= */
  useEffect(() => {
    if (!validSiteId) return;

    socketService.join(validSiteId);

    return () => {
      socketService.leave(validSiteId);
    };
  }, [validSiteId]);

  /* ================= FORCE REFRESH ================= */
  const refetch = useCallback(() => {
    if (validSiteId) {
      queryClient.invalidateQueries({ queryKey: ["analytics", validSiteId] });
    }
  }, [validSiteId, queryClient]);

  /* ================= RETURN ================= */
  return {
    ...query,
    hasData,
    socketConnected,
    receivedRealData,
    refetch,
  };
};