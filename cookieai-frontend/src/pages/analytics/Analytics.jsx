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
import VisitedPagesCard from "../../components/analytics/VisitedPagesCard";
import LiveFeed from "../../dash_v2/components/realtime/LiveFeed";
import LiveUsers from "../../dash_v2/components/realtime/LiveUsers";
import KpiCard from "../../components/analytics/KpiCard";

// UI COMPONENTS
import EmptyDashboard from "../../components/ui/EmptyDashboard";
import SkeletonDashboard from "../../components/ui/SkeletonDashboard";
import DashboardPreview from "../../components/ui/DashboardPreview";

// INSTALL DETECTION KEY
const INSTALL_KEY = "cookieai_script_copied";

/* ================= TYPES & CONSTANTS ================= */
const EMPTY = {
  stats: {
    pageViews: 0,
    sessions: 0,
    activeUsers: 0,
    bounceRate: 0
  },
  charts: {
    traffic: [],
    devices: [],
    browsers: [],
    countries: []
  },
  tables: {
    pages: []
  }
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


/**
 * Premium Traffic Chart
 */
const TrafficOverview = memo(({ data, range, loading }) => {
  if (loading) return <div className="h-80 bg-gray-50 rounded-2xl animate-pulse" />;
  
  const is24h = range === "24h";
  
  return (
    <div className="h-80 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PREMIUM_BLUE} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={PREMIUM_BLUE} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#999" }}
            tickFormatter={(val) => is24h ? val.split("T")[1]?.slice(0, 5) || val : val}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#999" }} />
          <Tooltip 
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            labelStyle={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
          />
          <Area 
            type="monotone" 
            dataKey="visitors" 
            stroke={PREMIUM_BLUE} 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorVisits)" 
            animationDuration={1500}
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

  const refs = useRef({ fetching: false });

  /* ---------- DATA FETCH ---------- */
  const fetchData = useCallback(async (isSilent = false) => {
    if (!siteId || ["dashboard", "undefined", "null"].includes(siteId)) return;
    if (!isSilent && !refs.current.initialLoaded) setLoading(true);
    
    try {
      const [siteRes, summaryRes, chartsRes, setupRes] = await Promise.all([
        siteService.getSiteById(siteId),
        analyticsService.getSummary(siteId),
        analyticsService.getCharts(siteId, range),
        analyticsService.getSetupStatus(siteId)
      ]);

      setSite(siteRes);
      setData({
        stats: {
          pageViews: summaryRes?.stats?.pageViews || summaryRes?.pageViews || 0,
          sessions: summaryRes?.stats?.sessions || summaryRes?.sessions || 0,
          activeUsers: summaryRes?.stats?.activeUsers || summaryRes?.activeUsers || 0,
          bounceRate: summaryRes?.stats?.bounceRate || summaryRes?.bounceRate || 0,
        },
        charts: {
          traffic: chartsRes?.traffic || [],
          devices: chartsRes?.devices || [],
          browsers: chartsRes?.browsers || [],
          countries: chartsRes?.countries || [],
        },
        tables: {
          pages: summaryRes?.tables?.pages || []
        }
      });
      setSetup(setupRes);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      refs.current.initialLoaded = true;
      setLoading(false);
    }
  }, [siteId, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- REALTIME ---------- */
  const joinedRef = useRef(null);

  useEffect(() => {
    if (!siteId || siteId === "undefined") return;
    
    // ✅ JOIN ROOM ONLY ONCE (DEDUPED)
    if (joinedRef.current !== siteId) {
      socketService.connect();
      socketService.join(siteId);
      joinedRef.current = siteId;
      console.log(`[Socket] 📡 joined ${siteId}`);
    }

    socketService.on("analytics:update", (incoming) => {
      setData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          ...(incoming.stats || {})
        },
        charts: {
          traffic: incoming.charts?.traffic || prev.charts.traffic,
          devices: incoming.charts?.devices?.length ? incoming.charts.devices : prev.charts.devices,
          browsers: incoming.charts?.browsers?.length ? incoming.charts.browsers : prev.charts.browsers,
          countries: incoming.charts?.countries?.length ? incoming.charts.countries : prev.charts.countries
        },
        tables: {
          ...prev.tables,
          pages: incoming.charts?.pages?.length ? incoming.charts.pages : prev.tables.pages
        }
      }));
    });

    const socket = socketService.getInstance();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socketService.off("analytics:update");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [siteId]);

  // Leave only on actual component unmount or site change
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        socketService.leave(joinedRef.current);
        joinedRef.current = null;
      }
    };
  }, []);

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
    const hasAnyData = data.stats?.pageViews > 0 || setup.hasData;
    if (hasAnyData || loading) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [siteId, data.stats?.pageViews, setup.hasData, loading, fetchData]);

  /* ---------- INSTALL DETECTION: mark installed on script copy ---------- */
  const handleScriptOpen = useCallback(() => {
    setShowScript(true);
    try {
      localStorage.setItem(INSTALL_KEY, "true");
      setScriptCopied(true);
    } catch {}
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
    const raw = data.charts?.countries || [];
    const grouped = raw
      .filter(c => c && c.value > 0)
      .reduce((acc, cur) => {
        let name = cur.name === "Unknown" ? "Other" : cur.name;
        if (name === "Local (Dev)") name = "Local";
        
        if (!acc[name]) {
          acc[name] = { name, value: 0, code: cur.code };
        }
        acc[name].value += cur.value;
        return acc;
      }, {});
      
    return Object.values(grouped).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [data.charts?.countries]);

  /* ---------- RENDER STATES ---------- */
  const hasSite = Boolean(siteId && siteId !== "dashboard" && siteId !== "undefined");

  // Reliable hasData: check multiple signals
  const hasData = useMemo(() => {
    if (loading) return false;
    return (
      (data.stats?.pageViews || 0) > 0 ||
      (data.stats?.sessions || 0) > 0 ||
      (data.stats?.activeUsers || 0) > 0 ||
      setup.hasData === true
    );
  }, [data.stats?.pageViews, data.stats?.sessions, data.stats?.activeUsers, setup.hasData, loading]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
              <span>{site?.domain || "No domain"}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <SkeletonDashboard />
        ) : (
          <div className="space-y-8">
            <LiveSetupBanner
              site={{ ...site, installed: isInstalled }}
              hasData={hasData}
              socketConnected={socketConnected}
              openScript={handleScriptOpen}
              onCheckStatus={() => fetchData(true)}
            />
          </div>
        )}

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

      {!hasData ? (
        <div className="space-y-8">
          <LiveSetupBanner
            site={{ ...site, installed: isInstalled }}
            hasData={hasData}
            socketConnected={socketConnected}
            openScript={handleScriptOpen}
            onCheckStatus={() => fetchData(true)}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard label="Page Views" value={data.stats?.pageViews} icon={Eye} />
            <KpiCard label="Sessions" value={data.stats?.sessions} icon={Layout} />
            <KpiCard label="Active Users" value={data.stats?.activeUsers} icon={Users} color="emerald" />
            <KpiCard label="Bounce Rate" value={data.stats?.bounceRate} type="percent" icon={TrendingDown} color="amber" />
          </div>

          {/* MAIN CHART */}
          <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Traffic Analysis</h2>
              <div className="text-[10px] uppercase font-bold text-gray-300 tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Unique Visitors
              </div>
            </div>
            <TrafficOverview data={data.charts?.traffic} range={range} loading={loading} />
          </section>

          {/* DISTRIBUTION GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* BROWSERS */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Compass className="w-4 h-4 text-gray-400" /> Top Browsers
              </h3>
              <div className="space-y-4">
                {data.charts?.browsers?.slice(0, 5).map((b, i) => (
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
                {data.charts?.devices?.slice(0, 5).map((d, i) => (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Top Performing Pages
              </h2>
              <VisitedPagesCard pages={data.tables?.pages} loading={loading} />
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
      )}

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
