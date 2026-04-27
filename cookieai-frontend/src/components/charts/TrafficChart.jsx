import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white/90 backdrop-blur-md px-4 py-3 shadow-2xl ring-1 ring-black/5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm font-black text-gray-900">
        {payload[0].value.toLocaleString()} <span className="text-gray-400 font-medium">visits</span>
      </p>
    </div>
  );
};

const TrafficChart = ({ data = [], isLoading = false }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((t, index) => ({
      name: t._id?.split("-").slice(1).join("/") || `Day ${index + 1}`,
      visits: t.visits || 0,
    }));
  }, [data]);

  const isEmpty = chartData.length === 0 && !isLoading;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {/* Loading Overlay (Subtle) */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] transition-opacity duration-300">
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">Updating...</span>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-gray-400">
          <Activity className="w-10 h-10 mb-4 opacity-20 animate-pulse" />
          <p className="text-sm font-medium">No traffic detected yet</p>
          <p className="text-xs opacity-60">Data will appear here in real-time</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#f1f5f9"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={30}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
            />

            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            />

            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ pointerEvents: "none", outline: "none" }}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              cursor={{
                stroke: "#6366f1",
                strokeWidth: 2,
                strokeDasharray: "4 4",
                opacity: 0.4,
              }}
            />

            <Area
              type="monotone"
              dataKey="visits"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#trafficGradient)"
              animationBegin={0}
              animationDuration={1000}
              isAnimationActive={true}
              activeDot={{
                r: 4,
                fill: "#ffffff",
                stroke: "#6366f1",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default memo(TrafficChart);