import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Globe, RefreshCw, BarChart3, ArrowRight, Zap, Sparkles,
  AlertCircle, Eye, Timer, TrendingDown, Users, Activity,
  Smartphone, Monitor, Tablet, MoreHorizontal, Compass,
  ArrowUpRight, ArrowDownRight, Layout
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import analyticsService from "../../services/analytics.service";
import siteService from "../../services/site.service";
import { socketService } from "../../services/socket.service";

import ScriptModal from "../../components/sites/ScriptModal";
import LiveSetupBanner from "../../components/analytics/LiveSetupBanner";
import TopPagesList from "./TopPagesList";
import LiveFeed from "../../dash_v2/components/realtime/LiveFeed";
import LiveUsers from "../../dash_v2/components/realtime/LiveUsers";
import KpiCard from "../../components/analytics/KpiCard";

// UI COMPONENTS
import EmptyDashboard from "../../components/ui/EmptyDashboard";
import SkeletonDashboard from "../../components/ui/SkeletonDashboard";
import DashboardPreview from "../../components/ui/DashboardPreview";

// INSTALL DETECTION KEY
const INSTALL_KEY = "cookieai_script_copied";
const HAS_DATA_KEY = "cookieai_has_data";

/* ================= TYPES & CONSTANTS ================= */
const EMPTY = {
  stats: {
    pageViews: 0,
    sessions: 0,
    activeUsers: 0,
    bounceRate: 0
  },
  traffic: [],
  devices: [],
  browsers: [],
  countries: [],
  pages: []
};

const CHART_COLORS = ["#000000", "#111111", "#222222", "#333333", "#444444"];
const PREMIUM_BLUE = "#3b82f6";
const PREMIUM_EMERALD = "#10b981";

const BROWSER_ICONS = {
  chrome: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg",
  firefox: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg",
  safari: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/safari/safari-original.svg",
  edge: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/edge/edge-original.svg"
};

/* ================= UTILS ================= */
const formatValue = (val, type = "number") => {
  if (val === undefined || val === null) return "0";
  if (type === "percent") return `${val}%`;
  if (type === "duration") return `${val}s`;
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(1) + "K";
  return val.toString();
};

/* ================= COMPONENTS ================= */


/* ─── FORMAT TIME (range-aware) ─── */
const formatChartTime = (value, is24h) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    if (is24h) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return ""; }
};

/* ─── PREMIUM TOOLTIP ─── */
const ChartTooltip = ({ active, payload, label, is24h }) => {
  if (!active || !payload?.length) return null;
  const date = new Date(label);
  const isValid = !isNaN(date.getTime());
  const timeLabel = isValid
    ? is24h
      ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
      : date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
    : "";
  const dateLabel = isValid && is24h
    ? date.toLocaleDateString([], { month: "short", day: "numeric" })
    : "";
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-gray-100/80 shadow-2xl rounded-2xl px-5 py-3.5" style={{ minWidth: 140 }}>
      {dateLabel && <p className="text-[10px] font-medium text-gray-300 uppercase tracking-wider mb-0.5">{dateLabel}</p>}
      <p className="text-[11px] font-medium text-gray-400 mb-1.5">{timeLabel}</p>
      <div className="flex items-end gap-1.5">
        <p className="text-2xl font-bold text-gray-900 leading-none">{Number(payload[0].value).toLocaleString()}</p>
        <span className="text-[10px] font-medium text-gray-400 mb-0.5">visitors</span>
      </div>
    </div>
  );
};

/**
 * Premium Traffic Chart — anti-flicker, range-aware
 */
const TrafficOverview = memo(({ data, range, loading }) => {
  const lastGoodData = useRef([]);
  const hasEverHadData = useRef(false);

  const cleanedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((item) => {
        const t = item?.time;
        return t && !isNaN(new Date(t).getTime()) && typeof item?.visitors === "number";
      })
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [data]);

  if (cleanedData.length > 0) {
    lastGoodData.current = cleanedData;
    hasEverHadData.current = true;
  }

  const displayData = cleanedData.length > 0 ? cleanedData : lastGoodData.current;
  const hasChart = displayData.length > 0;
  const is24h = range === "24h";

  if (loading && !hasEverHadData.current) {
    return <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse" />;
  }

  if (!hasChart && !hasEverHadData.current) {
    return (
      <div className="h-80 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
        <BarChart3 className="w-6 h-6 text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-400">No traffic data yet</p>
        <p className="text-xs text-gray-300 mt-1">Live analytics will appear here</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={displayData}
          margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={PREMIUM_BLUE} stopOpacity={0.35} />
              <stop offset="45%"  stopColor={PREMIUM_BLUE} stopOpacity={0.12} />
              <stop offset="100%" stopColor={PREMIUM_BLUE} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 8"
            vertical={false}
            stroke="#f0f2f5"
          />

          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            minTickGap={is24h ? 44 : 52}
            tick={{ fontSize: 11, fill: "#b0b8c4", fontWeight: 500 }}
            tickMargin={10}
            tickFormatter={(val) => formatChartTime(val, is24h)}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#b0b8c4", fontWeight: 500 }}
            tickMargin={6}
            width={42}
          />

          <Tooltip
            content={<ChartTooltip is24h={is24h} />}
            cursor={{
              stroke: "#e2e8f0",
              strokeWidth: 1.5,
              strokeDasharray: "4 4",
            }}
            animationDuration={80}
          />

          <Area
            type="monotone"
            dataKey="visitors"
            stroke={PREMIUM_BLUE}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#trafficFill)"
            dot={(props) => {
              const { cx, cy } = props;
              if (cx == null || cy == null) return null;
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill={PREMIUM_BLUE}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              );
            }}
            activeDot={{
              r: 6,
              fill: PREMIUM_BLUE,
              stroke: "#fff",
              strokeWidth: 3,
              style: {
                filter: "drop-shadow(0 0 6px rgba(59,130,246,0.5))",
              },
            }}
            isAnimationActive={!hasEverHadData.current}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

/* ================= MAIN DASHBOARD ================= */
export default function Analytics() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [setup, setSetup] = useState({ installed: false, hasData: false });
  const [showScript, setShowScript] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(() => {
    try { return localStorage.getItem(INSTALL_KEY) === "true"; } catch { return false; }
  });
  const [chartData, setChartData] = useState([]);
  const prevRangeRef = useRef(range);

  const hasData = (
    (data?.stats?.pageViews || 0) > 0 ||
    (data?.stats?.sessions || 0) > 0 ||
    (data?.pages?.length || 0) > 0
  );

  const liveHasData =
    (data?.stats?.pageViews || 0) > 0 ||
    (data?.stats?.sessions || 0) > 0;

  /* ─── TRAFFIC NORMALIZATION & PERSISTENCE ─── */
  useEffect(() => {
    const rawTraffic = Array.isArray(data?.traffic) ? data.traffic : [];
    if (rawTraffic.length === 0 && prevRangeRef.current === range) return; // keep previous

    const is24h = range === "24h";
    const rangeChanged = prevRangeRef.current !== range;
    prevRangeRef.current = range;

    /* Bucket & normalize incoming traffic */
    const bucketMap = new Map();
    rawTraffic.forEach((item) => {
      const rawTime = item?.time || item?.date || item?.timestamp || item?.createdAt;
      if (!rawTime) return;
      const parsed = new Date(rawTime);
      if (isNaN(parsed.getTime())) return;

      const bucket = new Date(parsed);
      if (is24h) {
        bucket.setMinutes(0, 0, 0); // hour-level
      } else {
        bucket.setHours(0, 0, 0, 0); // day-level
      }
      const key = bucket.toISOString();
      /* Extract visitor count — API uses visitors, realtime may use visits/pageViews */
      const visitors = Number(
        item?.visitors ?? item?.visits ?? item?.views ??
        item?.pageViews ?? item?.count ?? 0
      );
      /* Backend sends cumulative total per bucket — latest value wins */
      bucketMap.set(key, Math.max(visitors, bucketMap.get(key) || 0));
    });

    const normalized = Array.from(bucketMap.entries())
      .map(([time, visitors]) => ({ time, visitors }))
      .filter((item) => !isNaN(new Date(item.time).getTime()))
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    if (rangeChanged || normalized.length === 0) {
      setChartData(normalized);
      return;
    }

    /* Merge with previous — socket sends total for current bucket, replace not add */
    setChartData((prev) => {
      const map = new Map(prev.map((p) => [p.time, p]));
      normalized.forEach((item) => map.set(item.time, item)); // overwrite bucket with latest total
      return Array.from(map.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
    });
  }, [data?.traffic, range]);

  const refs = useRef({ fetching: false });

  /* ---------- DATA FETCH ---------- */
  const fetchData = useCallback(async (isSilent = false) => {
    if (!siteId || ["dashboard", "undefined", "null"].includes(siteId)) return;

    if (!isSilent && !refs.current.initialLoaded) setLoading(true);
    if (refs.current.fetching) return;

    refs.current.fetching = true;

    /* DON'T clear traffic before fetch — prevents graph reset */
    // traffic is preserved until new data arrives

    try {
      const [siteRes, summaryRes, chartsRes, setupRes] = await Promise.all([
        siteService.getSiteById(siteId),
        analyticsService.getSummary(siteId, range),
        analyticsService.getCharts(siteId, range),
        analyticsService.getSetupStatus(siteId)
      ]);

      setSite(siteRes);

      console.log("API SUMMARY:", summaryRes);
      console.log("API CHARTS:", chartsRes);

      setData({
        stats: summaryRes?.stats || {},
        traffic: chartsRes?.traffic || [],
        devices: chartsRes?.devices || [],
        browsers: chartsRes?.browsers || [],
        countries: chartsRes?.countries || [],
        pages: summaryRes?.tables?.pages || summaryRes?.pages || []
      });

      setSetup((prev) => ({
        ...prev,
        ...setupRes
      }));

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      refs.current.fetching = false;
      refs.current.initialLoaded = true;
      setLoading(false);
    }
  }, [siteId, range]);

  useEffect(() => {
    if (!siteId || ["dashboard", "undefined", "null"].includes(siteId)) return;

    fetchData();

  }, [siteId, range]);

  /* ---------- REALTIME ---------- */
  const joinedRef = useRef(null);

  useEffect(() => {
    if (!siteId || joinedRef.current === siteId) return;

    socketService.connect();
    socketService.join(siteId, range);
    joinedRef.current = siteId;

    return () => socketService.leave(siteId);
  }, [siteId]);

  useEffect(() => {
    if (!siteId) return;
    socketService.leave(siteId);
    socketService.join(siteId, range);
  }, [range, siteId]);

  useEffect(() => {
    if (!siteId || siteId === "undefined") return;

    const handler = (incoming) => {
      if (!incoming || typeof incoming !== "object") return;

      console.log("SOCKET:", incoming);

      setData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          pageViews: incoming?.stats?.pageViews ?? prev.stats?.pageViews,
          activeUsers: incoming?.stats?.activeUsers ?? prev.stats?.activeUsers,
          sessions: incoming?.stats?.sessions ?? prev.stats?.sessions,
          visitors: incoming?.stats?.visitors ?? prev.stats?.visitors
        },
        traffic: (() => {
          /* If socket provides a traffic array, use it */
          if (incoming?.traffic?.length) return incoming.traffic;
          /* Otherwise, generate a realtime point from stats */
          const stats = incoming?.stats || incoming;
          const pv = Number(stats?.pageViews ?? stats?.visitors ?? 0);
          if (pv > 0) {
            const now = new Date();
            now.setMinutes(0, 0, 0); // hour bucket
            const point = { time: now.toISOString(), visitors: pv };
            const prevTraffic = Array.isArray(prev.traffic) ? prev.traffic : [];
            /* Merge: update existing bucket or append */
            const map = new Map(prevTraffic.map((p) => [p.time, p]));
            map.set(point.time, point);
            return Array.from(map.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
          }
          return prev.traffic ?? [];
        })(),
        devices: incoming?.devices?.length ? incoming.devices : prev.devices ?? [],
        browsers: incoming?.browsers?.length ? incoming.browsers : prev.browsers ?? [],
        countries: incoming?.countries?.length ? incoming.countries : prev.countries ?? [],
        pages: incoming?.pages?.length ? incoming.pages : prev.pages ?? []
      }));

      // Real data triggers a normal re-render, hasData is dynamically calculated
    };

    socketService.on("analytics:update", handler);

    const socket = socketService.getInstance();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socketService.off("analytics:update", handler);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [siteId]);



  /* ---------- SOCKET RECONNECT → AUTO-REFETCH ---------- */
  useEffect(() => {
    if (!siteId) return;
    const unsubscribe = socketService.onReconnect(() => {
      console.log("[Analytics] 🔄 Socket reconnected — refetching data");
      fetchData(true);
    });
    return unsubscribe;
  }, [siteId, fetchData]);

  /* ---------- CONDITIONAL POLLING (10s until data arrives) ---------- */
  useEffect(() => {
    if (!siteId || siteId === "dashboard") return;
    if (hasData || loading) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [siteId, hasData, loading, fetchData]);

  /* ---------- INSTALL DETECTION: mark installed on script copy ---------- */
  const handleScriptOpen = useCallback(() => {
    setShowScript(true);
    try {
      localStorage.setItem(INSTALL_KEY, "true");
      setScriptCopied(true);
    } catch { }
  }, []);

  const getFlag = (code) => {
    if (!code || code === "LOCAL" || code === "XX") return null;
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  };

  const formatCountry = (name) => {
    if (!name || name === "Unknown") return "Other";
    if (name.includes("Local")) return "Local";
    return name;
  };

  const countryList = useMemo(() => {
    const raw = data.countries || [];
    const grouped = raw.reduce((acc, cur) => {
      let name = cur.name === "Unknown" ? "Other" : cur.name;
      if (name === "Local (Dev)") name = "Local";

      if (!acc[name]) {
        acc[name] = { name, value: 0, code: cur.code };
      }
      acc[name].value += cur.value;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [data.countries]);

  /* ---------- RENDER STATES ---------- */
  const hasSite = Boolean(siteId && siteId !== "dashboard" && siteId !== "undefined");



  // Derived install state: script copied OR backend says installed
  const isInstalled = useMemo(() => {
    return scriptCopied || Boolean(site?.installed || site?.trackingInstalled || setup.installed);
  }, [scriptCopied, site?.installed, site?.trackingInstalled, setup.installed]);

  // 1. NO SITE SELECTED
  if (!hasSite) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
        <div className="absolute inset-0 opacity-40 blur-sm pointer-events-none mt-20">
          <DashboardPreview />
        </div>
        <EmptyDashboard />
      </div>
    );
  }

  // 2. SITE EXISTS BUT NO DATA (OR LOADING)
 if (hasSite && !hasData) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-gray-900">
              {site?.name || "Analytics"}
            </h1>

            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                socketConnected
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-gray-300"
                }`}
              />
              {socketConnected ? "Live" : "Offline"}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Globe className="w-3.5 h-3.5" />
            <span>{site?.domain || "No domain"}</span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      {loading ? (
        <SkeletonDashboard />
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 space-y-6">

          {/* EMPTY STATE */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Waiting for your first visitor
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Install the tracking script to start collecting data
            </p>
          </div>

          {/* BANNER */}
          <div className="w-full max-w-lg">
            <LiveSetupBanner
              siteId={siteId}
              site={{ ...site, installed: isInstalled }}
              hasData={liveHasData}
              socketConnected={socketConnected}
              openScript={handleScriptOpen}
              onCheckStatus={() => fetchData(true)}
            />
          </div>

        </div>
      )}

      {/* SCRIPT MODAL */}
      <ScriptModal
        isOpen={showScript}
        onClose={() => setShowScript(false)}
        scriptData={{
          script: site
            ? `<script defer data-site-id="${site.siteId}" src="${window.location.origin.replace(
                ":3000",
                ":5000"
              )}/tracker.js"></script>`
            : ""
        }}
        socketConnected={socketConnected}
        site={site}
      />
    </div>
  );
}

  // 3. REAL DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{site?.name || "Analytics"}</h1>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${socketConnected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
              {socketConnected ? "Live" : "Offline"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Globe className="w-3.5 h-3.5" />
            <a href={`https://${site?.domain}`} target="_blank" rel="noreferrer" className="hover:text-gray-600 transition-colors">
              {site?.domain}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {["24h", "7d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === r ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {r === "24h" ? "Last 24 Hours" : "Last 7 Days"}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-100 mx-1" />
          <button
            onClick={() => fetchData(true)}
            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="space-y-8">
        {/* SUCCESS BANNER — shows "Tracking Active 🎉" then auto-dismisses */}
        <LiveSetupBanner
          site={{ ...site, installed: isInstalled }}
          hasData={liveHasData}
        />

        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard label="Page Views" value={data.stats?.pageViews} icon={Eye} />
          <KpiCard label="Sessions" value={data.stats?.sessions} icon={Layout} />
          <KpiCard label="Active Users" value={data.stats?.activeUsers} icon={Users} color="emerald" />
          <KpiCard label="Bounce Rate" value={data.stats?.bounceRate} type="percent" icon={TrendingDown} color="amber" />
        </div>

{/* MAIN CHART */}
<section className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

  {/* HEADER */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    
    <div className="flex flex-col">
      <h2 className="text-sm font-semibold text-gray-900 leading-tight">
        Traffic
      </h2>
      <span className="text-xs text-gray-400 leading-none">
        Visitor activity
      </span>
    </div>

    {/* STATUS */}
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </div>

  </div>

  {/* CHART BODY */}
  <div className="px-4 sm:px-5 py-4 flex-1 flex flex-col">

    <div className="flex-1 min-h-[260px]">

      <TrafficOverview
        data={chartData}
        range={range}
        loading={loading}
      />

    </div>

  </div>

</section>
        {/* DISTRIBUTION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* BROWSERS */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Compass className="w-4 h-4 text-gray-400" /> Top Browsers
            </h3>
            <div className="space-y-4">
              {data.browsers?.slice(0, 5).map((b, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {BROWSER_ICONS[b.name?.toLowerCase()] ? (
                      <img
                        src={BROWSER_ICONS[b.name?.toLowerCase()]}
                        alt={b.name}
                        className="w-6 h-6 ml-1 mr-1"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                        {b.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{b.name || "Unknown"}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{Number(b.value || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DEVICES */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Smartphone className="w-4 h-4 text-gray-400" /> Device Types
            </h3>
            <div className="space-y-4">
              {data.devices?.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {d.name?.toLowerCase().includes("mobile") && <Smartphone className="w-4 h-4 text-gray-400" />}
                    {d.name?.toLowerCase().includes("desktop") && <Monitor className="w-4 h-4 text-gray-400" />}
                    {d.name?.toLowerCase().includes("tablet") && <Tablet className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-medium text-gray-700">{d.name || "Desktop"}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{Number(d.value || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COUNTRIES */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Globe className="w-4 h-4 text-gray-400" /> Geographic
            </h3>
            <div className="space-y-2">
              {countryList.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {getFlag(item.code) ? (
                      <img
                        src={getFlag(item.code)}
                        alt={item.name}
                        className="w-5 h-4 rounded-sm object-cover border"
                      />
                    ) : (
                      <div className="w-5 h-4 bg-gray-200 rounded-sm flex items-center justify-center">
                        <span className="text-[10px] grayscale">{item.code === "LOCAL" ? "🏠" : "🏳️"}</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {item.name}
                    </span>
                  </div>

                  <span className="text-sm font-medium text-gray-900 tabular-nums">
                    {Number(item.value || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABLES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">

              {/* TITLE */}
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-gray-900">
                  Top Pages
                </h2>
                <span className="text-xs text-gray-400 mt-0.5">
                  Most visited routes
                </span>
              </div>

              {/* ACTION */}
              <button
                onClick={() => {
                  const event = new CustomEvent("top-pages-expand");
                  window.dispatchEvent(event);
                }}
                disabled={!data?.pages?.length}
                className={`
          text-xs font-medium px-3 py-1.5 rounded-md transition
          ${!data?.pages?.length
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }
        `}
              >
                View all
              </button>
            </div>

            {/* BODY */}
            <div
              id="top-pages-list"
              className="px-6 py-4 max-h-[320px] overflow-y-auto"
            >
              <TopPagesList
                pages={data?.pages || []}
                loading={loading}
              />
            </div>

          </section>




          <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Live Events Feed
            </h2>
            <LiveFeed siteId={siteId} />
          </section>
        </div>

        {/* LIVE USERS DETAIL - LIGHT VERSION */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-500" />
                Real-time Active Users
              </h2>
              <p className="text-gray-400 text-xs mt-1">Instant updates of currently browsing sessions</p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center">
              <span className="text-emerald-600 text-sm font-bold">{data.stats?.activeUsers}</span>
              <span className="text-emerald-400 text-[10px] ml-2 uppercase font-black tracking-widest">Online</span>
            </div>
          </div>
          <LiveUsers siteId={siteId} />
        </section>
      </div>

      {/* SCRIPT MODAL */}
      <ScriptModal
        isOpen={showScript}
        onClose={() => setShowScript(false)}
        scriptData={{
          script: site
            ? `<script defer data-site-id="${site.siteId}" src="${window.location.origin.replace(':3000', ':5000')}/tracker.js"></script>`
            : ""
        }}
        socketConnected={socketConnected}
        site={site}
      />
    </div>
  );
}
