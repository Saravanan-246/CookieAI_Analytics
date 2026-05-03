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

import { useDashboardV2 } from "../../dash_v2/hooks/useDashboardV2";
import { useRealtime } from "../../dash_v2/hooks/useRealtime";

import { getActiveSiteId } from "../../utils/siteState";
import { RefreshCw, Filter, Globe, Users } from "lucide-react";

export default function DashboardV2() {
  const siteId = getActiveSiteId();

  /* ✅ HOOKS ALWAYS RUN */
  const { data, loading, refresh } = useDashboardV2(siteId || null);
  const { activeUsers, events } = useRealtime(siteId || null);

  const mergedData = {
    ...data,
    activeUsers: activeUsers ?? data?.activeUsers ?? 0,
  };

  const hasSite = Boolean(siteId);
  const hasData = mergedData && (mergedData.totalVisitors > 0 || mergedData.pageViews > 0) && !loading;

  /* ================= DERIVED (UI ONLY) ================= */
  const topCountryName = mergedData?.countries?.[0]?.name || mergedData?.countries?.[0]?.country || "No data yet";
  const sessionsToday = Number(mergedData?.sessions || mergedData?.totalVisitors) || 0;
  const activeCount = mergedData?.activeUsers ?? 0;

return (
  <DashboardLayout>
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

      {/* ───────────────── HEADER ───────────────── */}
      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Overview
          </h1>

          <div className="h-4 w-[1px] bg-gray-200" />

          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate max-w-[160px]">
            {siteId || "Select Site"}
          </span>

          {hasSite && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-[10px] font-medium text-emerald-600 rounded-md border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh?.()}
            className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <Filter size={12} />
            Filters
          </button>
        </div>
      </div>

      {/* ───────────────── NO SITE ───────────────── */}
      {!hasSite && <EmptyDashboard />}

      {/* ───────────────── LOADING / NO DATA ───────────────── */}
      {hasSite && !hasData && (
        <div className="space-y-6">
          <LiveSetupBanner
            socketConnected={true}
            hasData={false}
            events={events || []}
          />
          <SkeletonDashboard />
        </div>
      )}

      {/* ───────────────── MAIN DASHBOARD ───────────────── */}
      {hasSite && hasData && (
        <div className="space-y-6">

          {/* ───── HERO STRIP ───── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Real-time Summary
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Live performance insights
              </p>
            </div>

            <div className="flex items-center gap-4">

              {/* ACTIVE */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {mergedData?.activeUsers ?? 0}
                  </p>
                  <p className="text-[10px] text-gray-400">Active</p>
                </div>
              </div>

              {/* SESSIONS */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <Users size={14} className="text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {(mergedData?.sessions || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400">Sessions</p>
                </div>
              </div>

              {/* COUNTRY */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <Globe size={14} className="text-violet-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[80px]">
                    {mergedData?.countries?.[0]?.name || "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">Top Country</p>
                </div>
              </div>

            </div>
          </div>

          {/* ───── KPI GRID ───── */}
          <KpiGrid data={mergedData} loading={loading} />

          {/* ───── CHART + INSIGHTS ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Traffic Overview
              </h3>

              <TrafficChart
                data={mergedData?.traffic || []}
                loading={loading}
              />
            </div>

            <InsightsPanel data={mergedData} loading={loading} />
          </div>

          {/* ───── TOP + LIVE ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white border border-gray-100 rounded-2xl p-5 h-[380px] flex flex-col shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Top Pages
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <VisitedPagesCard
                  pages={mergedData?.topPages || []}
                  loading={loading}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 h-[380px] flex flex-col shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Live Activity
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <LiveActivity siteId={siteId} />
              </div>
            </div>
          </div>

          {/* ───── GEO + DEVICE ───── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
                Countries
              </h4>
              <TopCountries
                countries={mergedData?.countries || []}
                loading={loading}
              />
            </div>

            <div className="md:col-span-2">
              <BrowserDeviceMiniCards
                devices={mergedData?.devices || []}
                browsers={mergedData?.browsers || []}
                loading={loading}
              />
            </div>
          </div>

          {/* ───── LIVE STRIP ───── */}
          <LiveUsers siteId={siteId} variant="strip" />

        </div>
      )}
    </div>
  </DashboardLayout>
);
}