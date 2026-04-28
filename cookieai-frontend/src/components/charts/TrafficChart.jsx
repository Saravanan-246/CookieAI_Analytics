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
import { useMemo } from "react";

/* ---------- SAFE FORMAT (NO DATE PARSE) ---------- */
const formatTime = (val) => {
  if (!val) return "";
  return val; // already HH:mm
};

/* ---------- TOOLTIP ---------- */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl px-4 py-2">
      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-gray-900">
        {payload[0].value}
        <span className="text-gray-400 font-medium ml-1"> visits</span>
      </p>
    </div>
  );
};

export default function TrafficChart({ data = [] }) {

  /* ---------- SAFE DATA ---------- */
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      time: item._id,          // ✅ use directly
      visits: item.visits || 0 // ✅ correct key
    }));
  }, [data]);

  const isEmpty = chartData.length === 0;

  return (
    <div className="w-full h-[260px] sm:h-[320px] relative">

      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No traffic yet 🚀
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >

            {/* GRADIENT */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* GRID */}
            <CartesianGrid
              stroke="#f1f5f9"
              vertical={false}
              strokeDasharray="3 3"
            />

            {/* X AXIS (FIXED) */}
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />

            {/* Y AXIS */}
            <YAxis
              domain={[0, "auto"]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
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
              stroke="#6366f1"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#fff",
                stroke: "#6366f1",
                strokeWidth: 2,
              }}
            />

          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}