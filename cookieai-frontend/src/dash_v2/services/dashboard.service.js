import api from "../../services/api";

/**
 * Get dashboard analytics
 * @param {string} siteId
 */
export const getDashboardData = async (siteId) => {

  try {

    if (!siteId) {
      return null;
    }

    /* ───────────────── FETCH ───────────────── */

    const [
      dashRes,
      chartRes,
      pagesRes,
    ] = await Promise.all([

      api.get("/analytics/dashboard", {
        params: { siteId },
      }),

      api.get("/analytics/charts", {
        params: { siteId },
      }),

      api.get(`/analytics/pages/${siteId}`),

    ]);

    /* ───────────────── SAFE DATA ───────────────── */

    const dash =
      dashRes?.data || {};

    const chart =
      chartRes?.data || {};

    const pages =
      pagesRes?.data?.data || [];

    /* ───────────────── RAW TRAFFIC ───────────────── */

    let rawTraffic =

      chart?.traffic ||
      chart?.data ||
      chart?.analytics ||
      chart?.points ||
      [];

    /* DEBUG */
    console.log(
      "CHART RESPONSE:",
      chart
    );

    console.log(
      "RAW TRAFFIC:",
      rawTraffic
    );

    /* SAFE ARRAY */
    if (!Array.isArray(rawTraffic)) {
      rawTraffic = [];
    }

    /* ───────────────── NORMALIZE ───────────────── */

    const traffic = rawTraffic.map(
      (item) => {

        const rawTime =

          item?.time ||
          item?.date ||
          item?.timestamp ||
          item?.createdAt;

        const visitors = Number(

          item?.visitors ||
          item?.views ||
          item?.pageViews ||
          item?.count ||
          item?.total ||
          0

        );

        return {

          time: rawTime
            ? new Date(rawTime).toISOString()
            : null,

          visitors:

            !isNaN(visitors) &&
            visitors >= 0

              ? visitors

              : 0,

        };

      }
    );

    /* ───────────────── CLEAN ───────────────── */

    const cleanTraffic = traffic.filter(
      (item) => {

        return (

          item?.time &&

          !isNaN(
            new Date(
              item.time
            ).getTime()
          )

        );

      }
    );

    console.log(
      "FINAL TRAFFIC:",
      cleanTraffic
    );

    /* ───────────────── RETURN ───────────────── */

    return {

      /* KPI */

      totalVisitors: Number(
        dash?.totalVisitors || 0
      ),

      activeUsers: Number(
        dash?.activeUsers || 0
      ),

      pageViews: Number(

        dash?.totalPageViews ||
        dash?.pageViews ||
        0

      ),

      sessions: Number(
        dash?.totalSessions || 0
      ),

      bounceRate: Number(
        dash?.bounceRate || 0
      ),

      /* REAL TRAFFIC ONLY */

      traffic: cleanTraffic,

      /* TABLES */

      devices: Array.isArray(
        dash?.devices ||
        chart?.devices
      )

        ? (
            dash?.devices ||
            chart?.devices
          )

        : [],

      countries: Array.isArray(
        dash?.countries ||
        chart?.countries
      )

        ? (
            dash?.countries ||
            chart?.countries
          )

        : [],

      browsers: Array.isArray(
        chart?.browsers
      )

        ? chart?.browsers

        : [],

      topPages: Array.isArray(
        pages
      )

        ? pages

        : [],

    };

  } catch (err) {

    console.error(
      "Dashboard API error:",
      err
    );

    return null;

  }

};