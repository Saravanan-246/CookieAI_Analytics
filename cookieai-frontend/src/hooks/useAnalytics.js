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

    const handleUpdate = (newData) => {
      console.log("⚡ Real-time update received:", newData);
      
      queryClient.setQueryData(["analytics", validSiteId], (oldData) => {
        if (!oldData) return newData;
        
        // Merge or replace data
        return {
          ...oldData,
          ...newData,
          // 🔥 ensure charts also update if they are in the payload
          traffic: newData.traffic || oldData.traffic,
          topPages: newData.topPages || oldData.topPages,
          topCountries: newData.topCountries || oldData.topCountries,
        };
      });
    };

    socketService.on("analytics:update", handleUpdate);

    return () => {
      socketService.off("analytics:update", handleUpdate);
      socketService.leave(validSiteId);
    };
  }, [validSiteId, queryClient]);

  /* ================= REMOVED POLLING ================= */

  return query;
};