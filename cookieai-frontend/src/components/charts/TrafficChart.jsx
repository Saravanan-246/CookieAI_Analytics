import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import { useMemo, useState, useEffect } from "react";

/* ---------- SAFE FORMAT (NO DATE PARSE) ---------- */
const formatTime = (val) => {
  if (!val || val === "Unknown") return val;
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;

    if (val.includes("T")) {
      return date.getHours().toString().padStart(2, "0") + ":00";
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  } catch {
    return val;
  }
};

/* ---------- TOOLTIP (IMPROVED UI) ---------- */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-md">
      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {payload[0].value}
        <span className="text-gray-400 ml-1">visits</span>
      </p>
    </div>
  );
};

/* ---------- SKELETON ---------- */
const ChartSkeleton = () => (
  <div className="w-full h-[260px] flex flex-col justify-end gap-2 px-4 pb-4">
    <div className="flex items-end gap-2 h-full">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-100 rounded-md animate-pulse flex-1"
          style={{
            height: `${20 + Math.random() * 60}%`,
          }}
        />
      ))}
    </div>
  </div>
);

export default function TrafficChart({ data = [], loading = false }) {
  const [isVisible, setIsVisible] = useState(false);

  /* ---------- SAFE DATA ---------- */
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      time: item.date || "Unknown",
      visits: item.views || 0,
    }));
  }, [data]);

  const isEmpty = chartData.length === 0;

  useEffect(() => {
    if (!isEmpty && !loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isEmpty, loading]);

  if (loading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="w-full h-[260px] min-h-[260px] relative">

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18"
              />
            </svg>
          </div>
          <span>No traffic data yet</span>
        </div>
      ) : (
        <div
          className="w-full h-full transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
            >

              {/* GRADIENT */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* GRID */}
              <CartesianGrid
                stroke="#f1f5f9"
                vertical={false}
              />

              {/* X */}
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />

              {/* Y */}
              <YAxis
                domain={[0, "auto"]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />

              {/* TOOLTIP */}
              <Tooltip content={<CustomTooltip />} />

              {/* AREA */}
              <Area
                type="monotone"
                dataKey="visits"
                stroke="none"
                fill="url(#areaGradient)"
              />

              {/* LINE */}
              <Line
                type="monotone"
                dataKey="visits"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#fff",
                  stroke: "#4f46e5",
                  strokeWidth: 2,
                }}
              />

            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}