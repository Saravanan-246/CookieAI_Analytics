import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import CardWrapper from "../common/CardWrapper";
import EmptyState from "../common/EmptyState";

/* COLORS */
const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa"];

/* SAFE TOOLTIP */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-gray-500">{item.name}</p>
      <p className="font-semibold text-gray-900">
        {(item.value ?? 0).toLocaleString()}
      </p>
    </div>
  );
};

export default function DeviceChart({ data = [], loading = false }) {
  /* SAFE DATA */
  const safeData = Array.isArray(data) ? data : [];

  const total = safeData.reduce(
    (sum, d) => sum + (d?.value ?? 0),
    0
  );

  const hasData = safeData.length > 0 && total > 0;

  return (
    <CardWrapper title="Devices">

      {/* ================= LOADING ================= */}
      {loading ? (
        <div className="flex items-center gap-6 h-[260px]">
          
          <div className="w-40 h-40 rounded-full bg-gray-100 animate-pulse" />

          <div className="flex-1 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : !hasData ? (

        /* ================= EMPTY ================= */
        <EmptyState
          title="No device data"
          description="Device insights will appear once users visit your site"
        />

      ) : (

        /* ================= MAIN ================= */
        <div className="flex items-center gap-6">

          {/* CHART */}
          <div className="relative w-40 h-40">

            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={safeData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {safeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* CENTER */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-gray-900">
                {total.toLocaleString()}
              </p>
              <span className="text-xs text-gray-400">
                Devices
              </span>
            </div>
          </div>

          {/* LEGEND */}
          <div className="flex flex-col gap-3 flex-1">

            {safeData.map((d, i) => {
              const value = d?.value ?? 0;

              const percent = total
                ? ((value / total) * 100).toFixed(1)
                : "0.0";

              return (
                <div
                  key={i}
                  className="flex items-center justify-between group"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[i % COLORS.length]
                      }}
                    />

                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">
                      {d?.name || "Unknown"}
                    </span>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 tabular-nums">
                      {value.toLocaleString()}
                    </span>

                    <span className="text-xs text-gray-400 w-10 text-right">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      )}
    </CardWrapper>
  );
}