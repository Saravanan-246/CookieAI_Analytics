import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";

/* ───────────────── FORMAT TIME (range-aware) ───────────────── */

const formatTimeForRange = (value, range) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    if (range === "7d") {
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    // 24h — show hour:minute
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

/* ───────────────── PREMIUM TOOLTIP ───────────────── */

const CustomTooltip = ({ active, payload, label, range }) => {
  if (!active || !payload?.length) return null;

  const date = new Date(label);
  const isValid = !isNaN(date.getTime());

  const timeLabel = isValid
    ? range === "7d"
      ? date.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
      : date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const dateLabel =
    isValid && range !== "7d"
      ? date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })
      : "";

  return (
    <div
      className="bg-white/95 backdrop-blur-xl border border-gray-100/80 shadow-2xl rounded-2xl px-5 py-3.5"
      style={{ minWidth: 140 }}
    >
      {dateLabel && (
        <p className="text-[10px] font-medium text-gray-300 uppercase tracking-wider mb-0.5">
          {dateLabel}
        </p>
      )}
      <p className="text-[11px] font-medium text-gray-400 mb-1.5">
        {timeLabel}
      </p>
      <div className="flex items-end gap-1.5">
        <p className="text-2xl font-bold text-gray-900 leading-none">
          {Number(payload[0].value).toLocaleString()}
        </p>
        <span className="text-[10px] font-medium text-gray-400 mb-0.5">
          visitors
        </span>
      </div>
    </div>
  );
};

/* ───────────────── COMPONENT ───────────────── */

export default function TrafficChart({
  data = [],
  loading = false,
  range = "24h",
}) {
  // Track whether we've ever had data (prevents flash to empty on transient states)
  const lastGoodData = React.useRef([]);
  const hasEverHadData = React.useRef(false);

  // Memoize normalization so it doesn't recalculate on every hover/render
  const cleanedChartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => {
        const rawTime =
          item?.time || item?.date || item?.timestamp || item?.createdAt;
        if (!rawTime) return null;

        const parsedDate = new Date(rawTime);
        if (isNaN(parsedDate.getTime())) return null;

        const visits = Number(
          item?.visits ??
          item?.visitors ??
          item?.views ??
          item?.pageViews ??
          item?.count ??
          item?.totalVisitors ??
          item?.activeUsers ??
          0
        );

        return {
          time: parsedDate.toISOString(),
          visits: !isNaN(visits) && visits >= 0 ? visits : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [data]);

  // Update the last-good-data ref whenever we have valid data
  if (cleanedChartData.length > 0) {
    lastGoodData.current = cleanedChartData;
    hasEverHadData.current = true;
  }

  // Use current data if available, otherwise fall back to last known good data
  const displayData =
    cleanedChartData.length > 0 ? cleanedChartData : lastGoodData.current;

  const hasChartData = displayData.length > 0;

  /* ───────────────── RENDER LOGIC ───────────────── */

  // Skeleton — only on true first load, never after data has arrived
  if (loading && !hasEverHadData.current) {
    return (
      <div className="h-[340px] w-full rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />
    );
  }

  // Empty state — only if we've truly never received any data
  if (!hasChartData && !hasEverHadData.current) {
    return (
      <div className="h-[340px] rounded-3xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-500">
          No traffic data yet
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Live analytics will appear here
        </p>
      </div>
    );
  }

  // Memoized tick formatter bound to current range
  const tickFormatter = (value) => formatTimeForRange(value, range);

  return (
    <div className="w-full">
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="trafficGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#7c3aed" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#f3f4f6"
              strokeDasharray="3 6"
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              minTickGap={range === "7d" ? 50 : 40}
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
              tickMargin={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
              tickMargin={4}
              width={45}
            />

            <Tooltip
              content={<CustomTooltip range={range} />}
              cursor={{
                stroke: "#e5e7eb",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              animationDuration={150}
            />

            <Area
              type="monotone"
              dataKey="visits"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fill="url(#trafficGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#7c3aed",
                stroke: "#fff",
                strokeWidth: 2.5,
                style: {
                  filter: "drop-shadow(0 2px 4px rgba(124,58,237,0.3))",
                },
              }}
              animationDuration={600}
              animationEasing="ease-out"
              isAnimationActive={!loading}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-800">Traffic Trend</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {range === "24h"
              ? "Last 24 hours · minute granularity"
              : "Last 7 days · daily totals"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-600">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}