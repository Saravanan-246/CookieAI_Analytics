import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import { getDashboardData } from "../services/dashboard.service";

export const useDashboardV2 = (siteId) => {

  const [data, setData] = useState({

    traffic: [],
    countries: [],
    devices: [],
    browsers: [],
    topPages: [],

    totalVisitors: 0,
    activeUsers: 0,
    pageViews: 0,
    sessions: 0,
    bounceRate: 0,

  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const isMounted =
    useRef(true);

  const fetchingRef =
    useRef(false);

  /* ───────────────── FETCH ───────────────── */

  const fetchData = useCallback(async () => {

    /* PREVENT DUPLICATE */
    if (fetchingRef.current) {
      return;
    }

    if (!siteId) {

      setData({

        traffic: [],
        countries: [],
        devices: [],
        browsers: [],
        topPages: [],

        totalVisitors: 0,
        activeUsers: 0,
        pageViews: 0,
        sessions: 0,
        bounceRate: 0,

      });

      setLoading(false);

      return;
    }

    try {

      fetchingRef.current = true;

      /* ONLY FIRST LOAD */
      if (!data?.traffic?.length) {
        setLoading(true);
      }

      setError(null);

      const res =
        await getDashboardData(siteId);

      if (!isMounted.current) {
        return;
      }

      /* SAFE DATA */
      const safeData =

        res || {

          traffic: [],
          countries: [],
          devices: [],
          browsers: [],
          topPages: [],

          totalVisitors: 0,
          activeUsers: 0,
          pageViews: 0,
          sessions: 0,
          bounceRate: 0,

        };

      /* ───────────────── TRAFFIC ───────────────── */

      const transformedTraffic =

        Array.isArray(
          safeData?.traffic
        )

          ? safeData.traffic.map(
              (item) => {

                const value = Number(

                  item?.visitors ||
                  item?.pageViews ||
                  item?.views ||
                  item?.count ||
                  0

                );

                return {

                  time:

                    item?.time ||
                    item?.date ||
                    item?.timestamp ||
                    item?.createdAt,

                  visitors:

                    !isNaN(value) &&
                    value >= 0

                      ? value

                      : 0,

                };

              }
            )

          : [];

      /* ───────────────── FINAL ───────────────── */

      setData({

        ...safeData,

        totalVisitors: Number(
          safeData?.totalVisitors || 0
        ),

        activeUsers: Number(
          safeData?.activeUsers || 0
        ),

        pageViews: Number(
          safeData?.pageViews || 0
        ),

        sessions: Number(
          safeData?.sessions || 0
        ),

        bounceRate: Number(
          safeData?.bounceRate || 0
        ),

        traffic: transformedTraffic,

        countries: Array.isArray(
          safeData?.countries
        )

          ? safeData.countries

          : [],

        devices: Array.isArray(
          safeData?.devices
        )

          ? safeData.devices

          : [],

        browsers: Array.isArray(
          safeData?.browsers
        )

          ? safeData.browsers

          : [],

        topPages: Array.isArray(
          safeData?.topPages
        )

          ? safeData.topPages

          : [],

      });

    } catch (err) {

      console.error(
        "Dashboard hook error:",
        err
      );

      if (isMounted.current) {

        setError(err);

      }

    } finally {

      fetchingRef.current = false;

      if (isMounted.current) {
        setLoading(false);
      }

    }

  }, [siteId, data?.traffic?.length]);

  /* ───────────────── EFFECT ───────────────── */

  useEffect(() => {

    isMounted.current = true;

    fetchData();

    /* AUTO REFRESH */
    const interval = setInterval(() => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        fetchData();

      }

    }, 30000);

    return () => {

      isMounted.current = false;

      clearInterval(interval);

    };

  }, [fetchData]);

  return {

    data,

    loading,

    error,

    refresh: fetchData,

  };

};