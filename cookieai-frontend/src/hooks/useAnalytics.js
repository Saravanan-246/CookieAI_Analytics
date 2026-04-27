import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import analyticsService from "../services/analytics.service";
import { socketService } from "../services/socket.service";

export const useAnalytics = (siteId) => {
  const queryClient = useQueryClient();

  // 🔥 block invalid ids
  const validSiteId =
    siteId && siteId !== "dashboard" ? siteId : null;

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

  /* ================= SOCKET REAL-TIME ================= */
  useEffect(() => {
    if (!validSiteId) return;

    socketService.connect();
    socketService.join(validSiteId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({
        queryKey: ["analytics", validSiteId],
      });
    };

    socketService.on("analytics:update", handleUpdate);

    return () => {
      socketService.off("analytics:update", handleUpdate);
      socketService.leave(validSiteId);
    };
  }, [validSiteId, queryClient]);

  /* ================= SMART POLLING (FIXED) ================= */
  useEffect(() => {
    if (!validSiteId) return;

    const hasData =
      (query.data?.totalPageViews > 0) ||   // ✅ FIXED
      (query.data?.activeUsers > 0) ||
      (query.data?.traffic?.length > 0);

    // 🔥 stop polling if data exists
    if (hasData) return;

    const interval = setInterval(() => {
      query.refetch();
    }, 5000); // 🔥 FIXED (was 3000)

    return () => clearInterval(interval);
  }, [
    validSiteId,
    query.data?.totalPageViews,
    query.data?.activeUsers,
    query.data?.traffic,
    query.refetch,
  ]);

  return query;
};