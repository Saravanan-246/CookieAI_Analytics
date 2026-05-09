import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../dash_v2/app/DashboardLayout";

import KpiGrid from "../../dash_v2/components/cards/KpiGrid";
import TrafficChart from "../../dash_v2/components/charts/TrafficChart";
import BrowserDeviceMiniCards from "../../dash_v2/components/charts/BrowserDeviceMiniCards";
import InsightsPanel from "../../dash_v2/components/cards/InsightsPanel";
import TopCountries from "../../dash_v2/components/tables/TopCountries";

import LiveActivity from "../../dash_v2/components/realtime/LiveActivity";
import LiveUsers from "../../dash_v2/components/realtime/LiveUsers";

import VisitedPagesCard from "../../components/analytics/VisitedPagesCard";
import LiveSetupBanner from "../../components/analytics/LiveSetupBanner";

// UI COMPONENTS
import EmptyDashboard from "../../components/ui/EmptyDashboard";
import SkeletonDashboard from "../../components/ui/SkeletonDashboard";

// PREMIUM UI COMPONENTS
import GlowCard from "../../dash_v2/components/premium/GlowCard";
import GlassPanel from "../../dash_v2/components/premium/GlassPanel";
import SectionHeader from "../../dash_v2/components/premium/SectionHeader";
import LiveBadge from "../../dash_v2/components/premium/LiveBadge";
import GradientButton from "../../dash_v2/components/premium/GradientButton";

import { colors, radii, shadows, gradients } from "../../dash_v2/styles/theme";

import { useDashboardV2 } from "../../dash_v2/hooks/useDashboardV2";
import { useRealtime } from "../../dash_v2/hooks/useRealtime";

import { getActiveSiteId, setActiveSiteId } from "../../utils/siteState";
import { siteService } from "../../services/site.service";
import {
  Globe,
  Users,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowUpRight
} from "lucide-react";

export default function DashboardV2() {
  const navigate = useNavigate();
  const siteId = getActiveSiteId();

  const [trafficRange, setTrafficRange] = useState("24h");
  const [sites, setSites] = useState([]);

  useEffect(() => {
    const loadSites = async () => {
      try {
        const list = await siteService.getSites();
        setSites(list || []);
      } catch (err) {
        console.error("Failed to load sites:", err);
      }
    };
    loadSites();
  }, []);

/* ✅ HOOKS ALWAYS RUN */
const {
  data,
  loading,
} = useDashboardV2(siteId || null);

const {
  activeUsers,
  events,
  analytics,
  traffic: realtimeTraffic,
} = useRealtime(siteId || null);

/* ✅ MERGED REAL DATA */
const mergedData = {
  ...data,
  activeUsers: typeof activeUsers === "number" ? activeUsers : Number(data?.activeUsers || 0),
  traffic: Array.isArray(data?.traffic) ? data.traffic : [],
  sessions: Number(data?.sessions || 0),
  pageViews: Number(data?.pageViews || 0),
  totalVisitors: Number(data?.totalVisitors || 0),
  bounceRate: Number(data?.bounceRate || 0),
};

const hasSite = Boolean(siteId);
const hasData = hasSite && (
  Number(mergedData?.totalVisitors || 0) > 0 ||
  Number(mergedData?.pageViews || 0) > 0 ||
  Number(mergedData?.sessions || 0) > 0 ||
  (Array.isArray(mergedData?.traffic) && mergedData.traffic.length > 0) ||
  (Array.isArray(realtimeTraffic) && realtimeTraffic.length > 0)
);

const activeSite = sites.find((s) => s?.siteId === siteId) || sites.find((s) => s?._id === siteId);
const activeSiteName = activeSite?.name || "Select Project";

const handleSiteChange = (e) => {
  const newId = e.target.value;
  if (!newId) return;
  const selected = sites.find((s) => s?._id === newId || s?.siteId === newId);
  const idToUse = selected?.siteId || selected?._id || newId;
  setActiveSiteId(idToUse);
  navigate(`/analytics/${idToUse}`);
};

const getNormalizedTraffic = () => {
  const rawTraffic = [
    ...(Array.isArray(mergedData?.traffic) ? mergedData.traffic : []),
    ...(Array.isArray(realtimeTraffic) ? realtimeTraffic : []),
  ];

  const trafficMap = new Map();
  const now = Date.now();

  rawTraffic.forEach((item) => {
    const rawDate = item?.time || item?.date || item?.timestamp || item?.createdAt;
    if (!rawDate) return;
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return;
    const diff = now - parsed.getTime();
    if (trafficRange === "24h" && diff > 25 * 60 * 60 * 1000) return;
    if (trafficRange === "7d" && diff > 8 * 24 * 60 * 60 * 1000) return;

    const visits = Number(item?.visitors ?? item?.visits ?? item?.views ?? item?.pageViews ?? item?.count ?? item?.totalVisitors ?? item?.activeUsers ?? 0);
    const bucket = new Date(parsed);
    if (trafficRange === "24h") bucket.setMinutes(0, 0, 0);
    else bucket.setHours(0, 0, 0, 0);

    const key = bucket.toISOString();
    trafficMap.set(key, Math.max(visits, trafficMap.get(key) || 0));
  });

  return Array.from(trafficMap.entries())
    .map(([time, visits]) => ({ time, visits }))
    .filter((item) => item?.time && !isNaN(new Date(item.time).getTime()) && typeof item.visits === "number")
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

const [persistentTraffic, setPersistentTraffic] = useState([]);
const prevRangeRef = useRef(trafficRange);

useEffect(() => {
  const normalized = getNormalizedTraffic();
  const rangeChanged = prevRangeRef.current !== trafficRange;
  prevRangeRef.current = trafficRange;

  if (rangeChanged) {
    setPersistentTraffic(normalized);
    return;
  }

  if (normalized.length > 0) {
    setPersistentTraffic((prev) => {
      const map = new Map(prev.map((item) => [item.time, item]));
      normalized.forEach((item) => map.set(item.time, item));
      return Array.from(map.values()).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    });
  }
}, [mergedData?.traffic, realtimeTraffic, trafficRange]);

const finalTrafficData = Array.isArray(persistentTraffic)
  ? persistentTraffic.filter((item) => item?.time && !isNaN(new Date(item.time).getTime()) && typeof item?.visits === "number")
  : [];

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10 space-y-10">

        {/* ───────────────── PREMIUM HEADER ───────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-black/[0.05]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-black text-white shadow-lg"
                style={{ borderRadius: radii.md }}
              >
                <LayoutDashboard size={20} />
              </div>
              <div className="h-4 w-px bg-black/10 mx-1" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/[0.03] rounded-lg border border-black/[0.05]">
                <Globe size={14} className="text-black/40" />
                <span className="text-[13px] font-bold text-black/70 tracking-tight">
                  {activeSiteName}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-black tracking-[-0.03em]">
                Project Overview
              </h1>
              <p className="text-[15px] text-black/40 font-medium">
                Live monitoring and traffic analytics for your domain.
              </p>
            </div>
          </div>

          {hasSite && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={siteId || ""}
                  onChange={handleSiteChange}
                  className="
                    appearance-none h-11 pl-4 pr-10
                    rounded-xl border border-black/[0.08]
                    bg-white text-[13px] font-bold text-black
                    outline-none shadow-sm hover:border-black/20
                    transition-all cursor-pointer min-w-[200px]
                  "
                >
                  <option value="" disabled>Switch Project</option>
                  {sites.map((site) => (
                    <option key={site.siteId || site._id} value={site.siteId || site._id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
              <LiveBadge label="Realtime" connected={true} />
            </div>
          )}
        </div>

        {/* ───────────────── NO SITE ───────────────── */}
        {!hasSite && <EmptyDashboard />}

        {/* ───────────────── SETUP BANNER ───────────────── */}
        {hasSite && !hasData && !loading && (
          <GlassPanel className="border-violet-100 shadow-violet-100/20">
            <LiveSetupBanner
              socketConnected={true}
              hasData={false}
              events={events || []}
            />
          </GlassPanel>
        )}

        {/* ───────────────── MAIN DASHBOARD ───────────────── */}
        {hasSite && (
          <div className="space-y-10">

            {/* ── KPI GRID ── */}
            <div className="relative">
               <KpiGrid data={mergedData} loading={loading} />
            </div>

            {/* ── TRAFFIC + INSIGHTS ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

              {/* TRAFFIC CHART */}
              <GlowCard
                noPadding
                className="xl:col-span-8 group"
                glowColor="rgba(124,58,237,0.06)"
              >
                <div className="p-8">
                  <SectionHeader
                    title="Traffic Distribution"
                    subtitle="Visitor counts aggregated by time"
                    badge={<LiveBadge label="Live" />}
                    action={
                      <div className="flex p-1 bg-black/[0.03] rounded-xl border border-black/[0.03]">
                        <GradientButton
                          active={trafficRange === "24h"}
                          onClick={() => setTrafficRange("24h")}
                          size="sm"
                          className="!rounded-lg"
                        >
                          24 Hours
                        </GradientButton>
                        <GradientButton
                          active={trafficRange === "7d"}
                          onClick={() => setTrafficRange("7d")}
                          size="sm"
                          className="!rounded-lg"
                        >
                          7 Days
                        </GradientButton>
                      </div>
                    }
                  />

                  <div className="mt-10 h-[320px]">
                    <TrafficChart
                      data={finalTrafficData}
                      loading={loading}
                      range={trafficRange}
                    />
                  </div>
                </div>
              </GlowCard>

              {/* INSIGHTS */}
              <div className="xl:col-span-4">
                <GlowCard className="h-full !p-0 overflow-hidden border-none shadow-xl shadow-black/[0.02]">
                  <InsightsPanel data={mergedData} loading={loading} />
                </GlowCard>
              </div>

            </div>

            {/* ── TOP PAGES + LIVE ACTIVITY ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* TOP PAGES */}
              <GlowCard noPadding className="h-[480px] flex flex-col group" glowColor="rgba(59,130,246,0.04)">
                <div className="px-8 pt-8 pb-6 border-b border-black/[0.03]">
                  <SectionHeader
                    title="Popular Destinations"
                    subtitle="Most frequently visited page paths"
                    badge={
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-black/50">
                        {mergedData?.topPages?.length || 0}
                      </span>
                    }
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
                  <VisitedPagesCard
                    pages={mergedData?.topPages || []}
                    loading={loading}
                  />
                </div>
              </GlowCard>

              {/* LIVE ACTIVITY */}
              <GlowCard noPadding className="h-[480px] flex flex-col group" glowColor="rgba(16,185,129,0.04)">
                <div className="px-8 pt-8 pb-6 border-b border-black/[0.03]">
                  <SectionHeader
                    title="Real-time Stream"
                    subtitle="Incoming event signals and user actions"
                    badge={<LiveBadge label="Pulse" />}
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
                  <LiveActivity siteId={siteId} />
                </div>
              </GlowCard>

            </div>

            {/* ── COUNTRIES + DEVICES ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

              {/* COUNTRIES */}
              <GlowCard className="xl:col-span-5 !p-8" glowColor="rgba(59,130,246,0.04)">
                <SectionHeader
                  title="Global Presence"
                  subtitle="Visitor distribution by country"
                  className="mb-8"
                />
                <TopCountries
                  countries={mergedData?.countries || []}
                  loading={loading}
                />
              </GlowCard>

              {/* DEVICES + BROWSERS */}
              <div className="xl:col-span-7">
                <BrowserDeviceMiniCards
                  devices={mergedData?.devices || []}
                  browsers={mergedData?.browsers || []}
                  loading={loading}
                />
              </div>

            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
