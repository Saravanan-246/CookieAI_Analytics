import React from "react";
import {
  Sparkles,
  TrendingUp,
  Globe,
  MousePointer2,
  Activity,
  Smartphone,
  AlertTriangle,
  Clock3,
} from "lucide-react";

/* ================= ITEM ================= */
const InsightItem = ({
  icon: Icon,
  text,
  color,
  badge,
}) => (
  <div
    className="
      group relative overflow-hidden
      rounded-2xl border border-gray-100
      bg-gradient-to-b from-white to-gray-50/70
      p-4 transition-all duration-300
      hover:shadow-md hover:-translate-y-0.5
    "
  >
    <div className="flex items-start gap-3">

      <div
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center
          ${color} shrink-0
        `}
      >
        <Icon size={16} />
      </div>

      <div className="flex-1">

        <div className="flex items-center justify-between gap-2 mb-1">

          <p className="text-[13px] font-medium text-gray-700 leading-snug">
            {text}
          </p>

          {badge && (
            <span className="
              text-[10px] font-semibold
              px-2 py-1 rounded-full
              bg-gray-100 text-gray-500
              whitespace-nowrap
            ">
              {badge}
            </span>
          )}

        </div>

      </div>

    </div>
  </div>
);

/* ================= MAIN ================= */
export default function InsightsPanel({
  data = {},
  loading = false,
}) {

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="
        rounded-3xl border border-gray-100
        bg-white p-5 animate-pulse
      ">

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gray-100" />
          <div className="h-3 w-32 rounded bg-gray-100" />
        </div>

        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gray-100"
            />
          ))}
        </div>

      </div>
    );
  }

  /* ================= SAFE DATA ================= */
  const views = Number(data?.pageViews) || 0;
  const prevViews = Number(data?.prevPageViews) || 0;

  const topPage =
    data?.topPages?.[0]?.path || null;

  const topCountry =
    data?.countries?.[0]?.name || null;

  const mobile =
    Number(data?.mobileUsers) || 0;

  const bounceRate =
    Number(data?.bounceRate) || 0;

  const avgDuration =
    Number(data?.avgSessionDuration) || 0;

  /* ================= CALCULATE ================= */
  let growth = null;

  if (prevViews > 0) {
    growth = (
      ((views - prevViews) / prevViews) *
      100
    ).toFixed(1);
  }

  /* ================= BUILD INSIGHTS ================= */
  const insights = [];

  /* TRAFFIC */
  if (growth !== null) {
    insights.push({
      icon: TrendingUp,
      text:
        growth > 0
          ? `Traffic increased ${Math.abs(growth)}% compared to last period`
          : `Traffic dropped ${Math.abs(growth)}% compared to last period`,
      badge:
        growth > 0 ? "Growing" : "Declining",
      color:
        growth > 0
          ? "bg-emerald-50 text-emerald-600"
          : "bg-rose-50 text-rose-600",
    });
  }

  /* TOP PAGE */
  if (topPage) {
    insights.push({
      icon: MousePointer2,
      text: `${topPage} is currently your most visited page`,
      badge: "Top Page",
      color: "bg-blue-50 text-blue-600",
    });
  }

  /* COUNTRY */
  if (topCountry) {
    insights.push({
      icon: Globe,
      text: `Most visitors are coming from ${topCountry}`,
      badge: "Traffic Source",
      color: "bg-indigo-50 text-indigo-600",
    });
  }

  /* MOBILE */
  if (mobile > 0) {
    insights.push({
      icon: Smartphone,
      text: `${mobile}% of users are browsing from mobile devices`,
      badge: "Mobile",
      color: "bg-violet-50 text-violet-600",
    });
  }

  /* BOUNCE */
  if (bounceRate > 65) {
    insights.push({
      icon: AlertTriangle,
      text: `Bounce rate is high at ${bounceRate}%, consider improving engagement`,
      badge: "Warning",
      color: "bg-amber-50 text-amber-600",
    });
  }

  /* SESSION */
  if (avgDuration > 0) {
    insights.push({
      icon: Clock3,
      text: `Average session duration is ${avgDuration}s`,
      badge: "Engagement",
      color: "bg-cyan-50 text-cyan-600",
    });
  }

  /* ================= EMPTY ================= */
  if (insights.length === 0) {
    return (
      <div className="
        rounded-3xl border border-gray-100
        bg-white p-8 text-center
        flex flex-col items-center justify-center
        min-h-[320px]
      ">

        <div className="
          w-14 h-14 rounded-2xl
          bg-violet-50 text-violet-500
          flex items-center justify-center mb-4
        ">
          <Sparkles size={24} />
        </div>

        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          No insights available yet
        </h3>

        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          Once your visitors start interacting with your
          website, AI-powered insights will appear here.
        </p>

      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-gray-100
        bg-white p-5 shadow-sm
      "
    >

      {/* BACKGROUND GLOW */}
      <div className="
        absolute top-0 right-0
        w-40 h-40 rounded-full
        bg-violet-100/40 blur-3xl
      " />

      {/* HEADER */}
      <div className="
        relative flex items-center justify-between
        mb-6
      ">

        <div className="flex items-center gap-3">

          <div className="
            w-10 h-10 rounded-2xl
            bg-gradient-to-br
            from-violet-500 to-fuchsia-500
            text-white
            flex items-center justify-center
            shadow-lg shadow-violet-200
          ">
            <Sparkles size={18} />
          </div>

          <div>
            <h3 className="
              text-sm font-semibold text-gray-900
            ">
              AI Insights
            </h3>

            <p className="text-xs text-gray-400">
              Smart analytics generated from traffic
            </p>
          </div>

        </div>

        <div className="
          flex items-center gap-2
          text-[11px] text-emerald-600
          font-medium
        ">
          <Activity size={12} />
          Live Analysis
        </div>

      </div>

      {/* LIST */}
      <div className="relative space-y-4">
        {insights.map((item, i) => (
          <InsightItem key={i} {...item} />
        ))}
      </div>

    </div>
  );
}