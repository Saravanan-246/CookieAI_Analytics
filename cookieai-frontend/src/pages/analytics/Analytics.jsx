import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Globe, RefreshCw } from "lucide-react";

import analyticsService from "../../services/analytics.service";
import siteService from "../../services/site.service";
import { socketService } from "../../services/socket.service";

import TrafficChart from "../../components/charts/TrafficChart";
import Filters from "./Filters";
import ScriptModal from "../../components/sites/ScriptModal";

/* ───────────────────────────────────────────────
   EMPTY STATE CONSTANT
─────────────────────────────────────────────── */
const EMPTY = {
  totalPageViews: 0,
  activeUsers: 0,
  bounceRate: 0,
  avgSessionDuration: 0,
  traffic: [],
  topCountries: [],
  topPages: [],
  devices: [],
  os: [],
};

/* ───────────────────────────────────────────────
   COMPONENT
─────────────────────────────────────────────── */
export default function Analytics() {
  const { siteId } = useParams();
  const isValidSiteId = Boolean(siteId && siteId !== "dashboard");

  /* ── state ── */
  const [site, setSite] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("7d");
  const [env, setEnv] = useState("all");

  /* ── script modal state ── */
  const [showScript, setShowScript] = useState(false);
  const [scriptData, setScriptData] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  /* ── refs ── */
  const rangeRef = useRef(range);
  const envRef = useRef(env);
  const pollingRef = useRef(null);
  const fetchingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const activeSiteIdRef = useRef(siteId);

  rangeRef.current = range;
  envRef.current = env;
  activeSiteIdRef.current = siteId;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /* ─────────────────────────────────────────────
     CORE FETCH
  ───────────────────────────────────────────── */
  const fetchData = useCallback(
    async (isFirst = false) => {
      if (!isValidSiteId || fetchingRef.current) return;

      const currentSiteId = siteId;
      fetchingRef.current = true;

      if (isFirst) {
        setLoading(true);
      }

      try {
        const res = await analyticsService.getSummary(
          currentSiteId,
          rangeRef.current,
          envRef.current
        );

        if (activeSiteIdRef.current !== currentSiteId) return;

        setData(res && typeof res === "object" ? res : EMPTY);
      } catch (err) {
        if (activeSiteIdRef.current === currentSiteId) {
          console.error("Analytics fetch error:", err);
          setData(EMPTY);
        }
      } finally {
        if (activeSiteIdRef.current === currentSiteId && isFirst) {
          setLoading(false);
        }

        fetchingRef.current = false;
      }
    },
    [isValidSiteId, siteId]
  );

  /* ─────────────────────────────────────────────
     EFFECTS
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isValidSiteId) {
      setSite(null);
      setData(EMPTY);
      setLoading(false);
      initialLoadDone.current = false;
      fetchingRef.current = false;
      stopPolling();
      return;
    }

    let cancelled = false;

    siteService
      .getSiteById(siteId)
      .then((res) => {
        if (!cancelled) {
          setSite(res ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setSite(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isValidSiteId, siteId, stopPolling]);

  useEffect(() => {
    if (!isValidSiteId) return;

    setData(EMPTY);
    initialLoadDone.current = false;
    fetchingRef.current = false;

    fetchData(true).finally(() => {
      if (activeSiteIdRef.current === siteId) {
        initialLoadDone.current = true;
      }
    });
  }, [isValidSiteId, siteId, fetchData]);

/* 🔥 FIXED hasData */
const hasData =
  data.totalPageViews > 0 ||
  data.activeUsers > 0 ||
  (data.traffic && data.traffic.length > 0);

/* ───────── POLLING ───────── */
useEffect(() => {
  if (!isValidSiteId) {
    stopPolling();
    return;
  }

  if (hasData) {
    stopPolling();
    return;
  }

  if (!pollingRef.current) {
    pollingRef.current = setInterval(() => {
      fetchData(false);
    }, 5000); // 🔥 FIXED (was 3000)
  }

  return stopPolling;
}, [isValidSiteId, hasData, fetchData, stopPolling]);

/* ───────── FILTER CHANGE ───────── */
useEffect(() => {
  if (!isValidSiteId || !initialLoadDone.current) return;

  const timer = setTimeout(() => {
    fetchData(false);
  }, 400);

  return () => clearTimeout(timer);
}, [isValidSiteId, range, env, fetchData]);

/* ───────── SOCKET ───────── */
useEffect(() => {
  if (!isValidSiteId) return;

  const socket = socketService.connect();

  const joinCurrentSite = () => {
    socketService.join(siteId);
  };

  const handleUpdate = (incoming) => {
    // 🔥 ONLY update state (NO fetchData)
    setData((prev) => ({ ...prev, ...incoming }));
  };

  if (socket.connected) {
    joinCurrentSite();
  }

  socket.on("connect", joinCurrentSite);
  socketService.on("analytics:update", handleUpdate);

  return () => {
    socket.off("connect", joinCurrentSite);
    socketService.off("analytics:update", handleUpdate);
    socketService.leave(siteId);
  };
}, [isValidSiteId, siteId]); // 🔥 FIXED (removed fetchData)

  /* ─────────────────────────────────────────────
     HANDLERS
  ───────────────────────────────────────────── */
  const openScript = async () => {
    if (!isValidSiteId) return;

    try {
      setShowScript(true);
      setScriptLoading(true);
      const res = await siteService.getScript(siteId);
      setScriptData(res);
    } catch {
      alert("Failed to load script");
      setShowScript(false);
    } finally {
      setScriptLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  if (!isValidSiteId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-[70vh]">
        <h2 className="text-xl font-bold text-gray-900 mb-2">No project selected</h2>
        <p className="text-sm text-gray-500">Please select a project from the sidebar to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        {/* LEFT */}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
            {site?.name || "Analytics"}
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 mt-1 min-w-0">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{site?.domain || "No domain"}</span>
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">

          {/* FILTERS */}
          <div className="w-full sm:w-auto">
            <Filters
              range={range}
              setRange={setRange}
              environment={env}
              setEnvironment={setEnv}
            />
          </div>

          {/* REFRESH */}
          <button
            onClick={() => fetchData(false)}
            title="Refresh"
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition bg-white shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      {!hasData ? (
        /* ===== NO DATA ===== */
        <div className="py-10 sm:py-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Waiting for your first visitor
            </h2>

            <p className="text-sm text-gray-500 mb-6 flex items-center justify-center">
              Tracking is active
              <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full ml-2 animate-pulse"></span>
            </p>

            <p className="text-sm text-gray-600 mb-6">
              After installing the tracking script, open your website and browse a few pages.
            </p>

            <button
              onClick={openScript}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              View Tracking Script
            </button>

          </div>
        </div>
      ) : (
        /* ===== REAL ANALYTICS ===== */
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Stat label="Active Users" value={data?.activeUsers || 0} />
            <Stat label="Page Views" value={data?.totalPageViews || 0} />
            <Stat label="Bounce Rate" value={`${data?.bounceRate || 0}%`} />
            <Stat label="Avg Session" value={`${data?.avgSessionDuration || 0}s`} />
          </div>

          {/* CHART */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            <TrafficChart data={data?.traffic || []} />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <PagesCard data={data?.topPages || []} />
            <DataCard title="Countries" data={data?.topCountries || []} type="country" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <DataCard title="Devices" data={data?.devices || []} type="device" />
            <DataCard title="Operating Systems" data={data?.os || []} type="os" />
          </div>
        </>
      )}

      {/* SCRIPT MODAL */}
      <ScriptModal
        isOpen={showScript}
        onClose={() => setShowScript(false)}
        scriptData={scriptData}
        loading={scriptLoading}
      />

    </div>
  );
}

/* ───────────────────────────────────────────────
   LOADING SKELETON
─────────────────────────────────────────────── */
function LoadingSkeleton() {
 return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

    {/* ===== HEADER ===== */}
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

      <div className="space-y-2">
        <div className="h-6 sm:h-7 w-36 sm:w-48 skeleton rounded-lg" />
        <div className="h-3 sm:h-4 w-24 sm:w-32 skeleton rounded" />
      </div>

      <div className="h-9 w-full sm:w-52 skeleton rounded-xl" />
    </div>

    {/* ===== STATS ===== */}
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div className="h-3 w-16 sm:w-20 skeleton rounded" />
          <div className="h-6 sm:h-8 w-12 sm:w-16 skeleton rounded" />
        </div>
      ))}
    </div>

    {/* ===== CHART ===== */}
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="h-[220px] sm:h-[300px] skeleton rounded-xl" />
    </div>

    {/* ===== TABLES ===== */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <div className="h-4 w-28 skeleton rounded mb-6" />

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((__, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="h-3 w-2/3 skeleton rounded" />
                <div className="h-3 w-10 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

  </div>
);
}

/* ───────────────────────────────────────────────
   STAT CARD
─────────────────────────────────────────────── */
const Stat = ({ label, value }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
    <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-slate-600 transition-colors">{label}</p>
    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2">{value ?? 0}</h3>
  </div>
);

/* ───────────────────────────────────────────────
   DATA CARD (Vercel-style Boxed Panel)
─────────────────────────────────────────────── */
const DataCard = ({ title, data = [], type }) => {
  const regionNames = useMemo(
    () => new Intl.DisplayNames(["en"], { type: "region" }),
    []
  );

  const formatLabel = (label) => {
    if (type === "country") {
      try {
        return regionNames.of(label.toUpperCase()) || label;
      } catch {
        return label;
      }
    }
    return label;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Visitors
        </span>
      </div>

      {/* Panel Body (Internal Scroll) */}
      <div className="p-5 max-h-[280px] overflow-y-auto custom-scroll">
        {data.length > 0 ? (
          <div className="space-y-1">
            {data.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm py-2 group/row"
              >
                <span className="truncate max-w-[70%] text-gray-700 font-medium">
                  {formatLabel(item._id)}
                </span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────────
   PAGES CARD (Vercel-style Boxed Panel)
─────────────────────────────────────────────── */
const PagesCard = ({ data = [] }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Most Visited Pages</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Views
        </span>
      </div>

      {/* Panel Body (Internal Scroll) */}
      <div className="p-5 max-h-[280px] overflow-y-auto custom-scroll">
        {data.length > 0 ? (
          <div className="space-y-1">
            {data.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm py-2 group/row"
              >
                <span className="truncate max-w-[70%] text-gray-600 font-medium hover:text-indigo-600 cursor-pointer transition-colors">
                  {item._id?.startsWith("/") ? item._id : `/${item._id}`}
                </span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">No page views yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
