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
  success: true,

  totalVisitors: 0,
  visitorGrowth: 0,

  totalPageViews: 0,
  viewGrowth: 0,

  totalSessions: 0,
  activeUsers: 0,

  avgSessionDuration: 0,
  avgPagesPerSession: 0,
  bounceRate: 0,

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
  const rangeRef = useRef("7d");
  const envRef = useRef("all");
  const fetchingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const activeSiteIdRef = useRef(siteId);
  const lastUpdateRef = useRef(0);

  /* 🔥 keep refs updated */
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  useEffect(() => {
    envRef.current = env;
  }, [env]);

  useEffect(() => {
    activeSiteIdRef.current = siteId;
  }, [siteId]);


  /* ─────────────────────────────────────────────
     CORE FETCH
  ───────────────────────────────────────────── */
const fetchData = useCallback(
  async (isFirst = false) => {
    if (!isValidSiteId || fetchingRef.current) return;

    const currentSiteId = siteId;
    fetchingRef.current = true;

    if (isFirst) setLoading(true);

    try {
      const res = await analyticsService.getSummary(
        currentSiteId,
        rangeRef.current,
        envRef.current
      );

      // 🔒 prevent stale update
      if (activeSiteIdRef.current !== currentSiteId) return;

      // ✅ safe replace
      setData(
        res && typeof res === "object" ? res : EMPTY
      );

    } catch (err) {
      if (activeSiteIdRef.current === currentSiteId) {
        console.error("Analytics fetch error:", err);
        setData(EMPTY);
      }
    } finally {
      // 🔥 always release lock
      fetchingRef.current = false;

      if (activeSiteIdRef.current === currentSiteId && isFirst) {
        setLoading(false);
      }
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
    return; // ❌ removed stopPolling
  }

  let cancelled = false;

  const loadSite = async () => {
    try {
      const res = await siteService.getSiteById(siteId);

      if (!cancelled) {
        setSite(res ?? null);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("Site fetch error:", err);
        setSite(null);
      }
    }
  };

  loadSite();

  return () => {
    cancelled = true;
  };
}, [isValidSiteId, siteId]);

useEffect(() => {
  if (!isValidSiteId) return;

  let cancelled = false;

  // 🔥 reset state
  setData(EMPTY);
  initialLoadDone.current = false;
  fetchingRef.current = false;

  const load = async () => {
    await fetchData(true);

    // 🔒 prevent stale update
    if (!cancelled && activeSiteIdRef.current === siteId) {
      initialLoadDone.current = true;
    }
  };

  load();

  return () => {
    cancelled = true;
  };
}, [isValidSiteId, siteId, fetchData]);

/* 🔥 FIXED hasData */
const hasData = useMemo(() => {
  return (
    (data?.totalPageViews ?? 0) > 0 ||
    (data?.activeUsers ?? 0) > 0 ||
    (Array.isArray(data?.traffic) && data.traffic.length > 0)
  );
}, [data]);



/* ───────── SOCKET ───────── */
useEffect(() => {
  if (!isValidSiteId) return;

  const socket = socketService.connect();

  const joinCurrentSite = () => {
    console.log("📡 Joining socket room:", siteId);
    socketService.join(siteId);
  };

  const handleUpdate = (incoming) => {
    if (!incoming || typeof incoming !== "object") return;

    // 🔥 throttle (outside setState)
    const now = Date.now();
    if (now - lastUpdateRef.current < 500) return;
    lastUpdateRef.current = now;

    console.log("⚡ Real-time Update:", incoming.activeUsers);

    setData((prev) => ({
      ...prev,
      ...incoming,
    }));
  };

  // 🔥 CLEAN old listeners first (very important)
  socket.off("connect", joinCurrentSite);
  socketService.off("analytics:update", handleUpdate);

  // 🔥 attach listeners
  socket.on("connect", joinCurrentSite);
  socketService.on("analytics:update", handleUpdate);

  // 🔥 join immediately
  joinCurrentSite();

  return () => {
    socket.off("connect", joinCurrentSite);
    socketService.off("analytics:update", handleUpdate);
    socketService.leave(siteId);
  };
}, [isValidSiteId, siteId]);

  /* ─────────────────────────────────────────────
     HANDLERS
  ───────────────────────────────────────────── */
const openScript = async () => {
  if (!isValidSiteId) return;

  setShowScript(true);
  setScriptLoading(true);

  try {
    const res = await siteService.getScript(siteId);

    if (res && typeof res === "object") {
      setScriptData(res);
    } else {
      setScriptData(null);
    }

  } catch (err) {
    console.error("Script load error:", err);

    // 🔥 better UX than alert
    setScriptData(null);
  } finally {
    setScriptLoading(false);
  }
};

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
if (!isValidSiteId) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-md w-full">

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No project selected
        </h2>

        <p className="text-sm text-gray-500">
          Select a project from the sidebar to view analytics data.
        </p>

      </div>
    </div>
  );
}

 if (loading && !initialLoadDone.current) {
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

          {/* 🔥 LIVE INDICATOR */}
          <span className="ml-2 flex items-center text-green-600 text-xs font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Live
          </span>
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
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition bg-white shadow-sm active:scale-95"
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
      <>
        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <Stat label="Active Users" value={data?.activeUsers ?? 0} />
          <Stat label="Page Views" value={data?.totalPageViews ?? 0} />
          <Stat label="Bounce Rate" value={`${data?.bounceRate ?? 0}%`} />
          <Stat label="Avg Session" value={`${data?.avgSessionDuration ?? 0}s`} />
        </div>

        {/* ===== CHART ===== */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
          <TrafficChart data={Array.isArray(data?.traffic) ? data.traffic : []} />
        </div>

        {/* ===== GRID ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <PagesCard data={Array.isArray(data?.topPages) ? data.topPages : []} />
          <DataCard
            title="Countries"
            data={Array.isArray(data?.topCountries) ? data.topCountries : []}
            type="country"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <DataCard
            title="Devices"
            data={Array.isArray(data?.devices) ? data.devices : []}
            type="device"
          />
          <DataCard
            title="Operating Systems"
            data={Array.isArray(data?.os) ? data.os : []}
            type="os"
          />
        </div>
      </>
    )}

    {/* ===== SCRIPT MODAL ===== */}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-pulse">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        <div className="space-y-2">
          <div className="h-6 sm:h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-3 sm:h-4 w-28 bg-gray-200 rounded" />
        </div>

        <div className="h-9 w-full sm:w-52 bg-gray-200 rounded-xl" />
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
          >
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 sm:h-8 w-16 bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* ===== CHART ===== */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="h-[220px] sm:h-[300px] bg-gray-200 rounded-xl" />
      </div>

      {/* ===== TABLES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm"
          >
            <div className="h-4 w-28 bg-gray-200 rounded mb-6" />

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-3 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-10 bg-gray-300 rounded" />
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
const Stat = ({ label, value }) => {
  const displayValue = value ?? 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group">

      <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
        {label}
      </p>

      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2 tabular-nums">
        {displayValue}
      </h3>

      {/* 🔥 subtle bottom accent */}
      <div className="h-[2px] mt-3 bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition" />

    </div>
  );
};
/* ───────────────────────────────────────────────
   DATA CARD (Vercel-style Boxed Panel)
─────────────────────────────────────────────── */
const DataCard = ({ title, data = [], type }) => {
  const regionNames = useMemo(
    () => new Intl.DisplayNames(["en"], { type: "region" }),
    []
  );

  const safeData = Array.isArray(data) ? data : [];

  const formatLabel = (label) => {
    if (!label) return "Unknown";

    if (type === "country") {
      try {
        return regionNames.of(String(label).toUpperCase()) || label;
      } catch {
        return label;
      }
    }

    return label;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">

      {/* ===== HEADER ===== */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Visitors
        </span>
      </div>

      {/* ===== BODY ===== */}
      <div className="p-5 max-h-[280px] overflow-y-auto">

        {safeData.length > 0 ? (
          <div className="space-y-1">

            {safeData.map((item, i) => (
              <div
                key={item?._id || i}
                className="flex justify-between items-center text-sm py-2 group/row hover:bg-gray-50 rounded-lg px-2 transition"
              >
                <span className="truncate max-w-[70%] text-gray-700 font-medium">
                  {formatLabel(item?._id)}
                </span>

                <span className="font-semibold text-gray-900 tabular-nums">
                  {(item?.count ?? 0).toLocaleString()}
                </span>
              </div>
            ))}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">
              No data available
            </p>
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
  const safeData = Array.isArray(data) ? data : [];

  const formatPath = (path) => {
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">

      {/* ===== HEADER ===== */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Most Visited Pages
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Views
        </span>
      </div>

      {/* ===== BODY ===== */}
      <div className="p-5 max-h-[280px] overflow-y-auto">

        {safeData.length > 0 ? (
          <div className="space-y-1">

            {safeData.map((item, i) => (
              <div
                key={item?._id || i}
                className="flex justify-between items-center text-sm py-2 px-2 rounded-lg hover:bg-gray-50 transition"
              >
                <span className="truncate max-w-[70%] text-gray-600 font-medium hover:text-indigo-600 cursor-pointer transition-colors">
                  {formatPath(item?._id)}
                </span>

                <span className="font-semibold text-gray-900 tabular-nums">
                  {(item?.count ?? 0).toLocaleString()}
                </span>
              </div>
            ))}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">
              No page views yet
            </p>
          </div>
        )}

      </div>
    </div>
  );
};