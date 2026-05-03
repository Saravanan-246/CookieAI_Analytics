import React from "react";
import {
  Sparkles,
  TrendingUp,
  Globe,
  MousePointer2,
} from "lucide-react";

/* ================= ITEM ================= */
const InsightItem = ({ icon: Icon, text, color }) => (
  <div className="flex items-start gap-3">
    <div
      className={`
        w-7 h-7 rounded-md flex items-center justify-center
        ${color} shrink-0
      `}
    >
      <Icon size={13} />
    </div>

    <p className="text-[12px] text-gray-600 leading-snug">
      {text}
    </p>
  </div>
);

/* ================= MAIN ================= */
export default function InsightsPanel({ data = {}, loading = false }) {
  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 h-full animate-pulse">
        <div className="h-3 w-24 bg-gray-100 rounded mb-5" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-full bg-gray-100 rounded" />
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

  /* ================= CALCULATE ================= */
  let growth = null;

  if (prevViews > 0) {
    growth = (((views - prevViews) / prevViews) * 100).toFixed(1);
  }

  /* ================= BUILD INSIGHTS ================= */
  const insights = [];

  if (growth !== null) {
    insights.push({
      icon: TrendingUp,
      text: `Traffic ${
        growth > 0 ? "increased" : "decreased"
      } ${Math.abs(growth)}% vs last period`,
      color:
        growth > 0
          ? "bg-emerald-50 text-emerald-600"
          : "bg-rose-50 text-rose-600",
    });
  }

  if (topPage) {
    insights.push({
      icon: MousePointer2,
      text: `Top page: ${topPage}`,
      color: "bg-blue-50 text-blue-600",
    });
  }

  if (topCountry) {
    insights.push({
      icon: Globe,
      text: `Top traffic from ${topCountry}`,
      color: "bg-indigo-50 text-indigo-600",
    });
  }

  /* ================= EMPTY ================= */
  if (insights.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 h-full flex flex-col items-center justify-center text-center">
        <Sparkles className="w-5 h-5 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">
          Insights will appear once data is available
        </p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 h-full shadow-sm hover:shadow-md transition-all duration-300">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={14} className="text-amber-500" />
        <h3 className="
          text-[11px] font-semibold text-gray-500
          uppercase tracking-wide
        ">
          Smart Insights
        </h3>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {insights.map((item, i) => (
          <InsightItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
}