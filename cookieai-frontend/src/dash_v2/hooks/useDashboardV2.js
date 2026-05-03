import { useEffect, useState, useRef } from "react";
import { getDashboardData } from "../services/dashboard.service";
import { fallbackData } from "../data/fallback";

/**
 * Dashboard Data Hook
 * @param {string} siteId
 */
export const useDashboardV2 = (siteId) => {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // prevent duplicate calls
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!siteId) {
      setData(fallbackData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getDashboardData(siteId);

        if (!isMounted.current) return;

        if (res) {
          setData(res);
        } else {
          setData(fallbackData);
        }
      } catch (err) {
        console.error("Dashboard hook error:", err);
        if (isMounted.current) {
          setError(err);
          setData(fallbackData);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // 🔁 OPTIONAL: auto refresh every 30s
    const interval = setInterval(fetchData, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [siteId]);

  return { data, loading, error };
};