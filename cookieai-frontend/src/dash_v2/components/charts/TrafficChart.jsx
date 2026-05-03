import {
  Area,
  AreaChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Users, Layers } from "lucide-react";

/* ================= TOOLTIP ================= */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>

      {payload.map((item, i) => (
        <div key={i} className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{item.name}</span>
          <span className="font-semibold text-gray-900">
            {(item.value ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TrafficChart({ data = [], loading = false }) {
  /* ================= SAFE DATA ================= */
  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((d) => (d?.visitors ?? 0) > 0);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="h-[320px] bg-gray-50 rounded-xl animate-pulse" />
    );
  }

  /* ================= EMPTY ================= */
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[320px] text-center">
        <TrendingUp className="w-6 h-6 text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No traffic data yet</p>
      </div>
    );
  }

  /* ================= CHART ================= */
  return (
    <div className="w-full">
      <div className="h-[320px] w-full">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="sessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="visitors"
              name="Visitors"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#visitors)"
              dot={false}
            />

            <Area
              type="monotone"
              dataKey="sessions"
              name="Sessions"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#sessions)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* LEGEND */}
      <div className="flex items-center justify-between mt-5 border-t border-gray-100 pt-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={12} className="text-blue-500" />
            Visitors
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Layers size={12} className="text-purple-500" />
            Sessions
          </div>
        </div>

        <div className="flex items-center gap-1 text-emerald-600 font-medium">
          <TrendingUp size={12} />
          Live data
        </div>
      </div>
    </div>
  );
}