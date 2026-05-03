import React, { memo } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const formatValue = (val, type = "number") => {
  if (val === undefined || val === null) return "0";
  if (type === "percent") return `${val}%`;
  if (type === "duration") return `${val}s`;
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(1) + "K";
  return val.toString();
};

const KpiCard = memo(({ label, value, type, icon: Icon, trend, color = "blue", loading }) => {
  if (loading) return <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-white transition-colors`}>
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900 tabular-nums">
            {formatValue(value, type)}
          </h3>
          {label === "Active Users" && value > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse mb-1" />
          )}
        </div>
      </div>
    </div>
  );
});

export default KpiCard;
