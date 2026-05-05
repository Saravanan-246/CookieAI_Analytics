import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  AlertCircle,
  Laptop,
  Cpu,
  FileText,
} from "lucide-react";
import { cn } from "../../utils/cn";

/* ================= HELPERS ================= */

const formatNumber = (num) => Number(num || 0).toLocaleString();

/* ================= ICONS ================= */

const DeviceIcon = ({ type }) => {
  const t = (type || "").toLowerCase();
  if (t.includes("mobile")) return <Smartphone size={16} />;
  if (t.includes("tablet")) return <Tablet size={16} />;
  if (t.includes("desktop")) return <Monitor size={16} />;
  if (t.includes("laptop")) return <Laptop size={16} />;
  return <Cpu size={16} />;
};

const CountryNames = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
};

const getFlagEmoji = (code) =>
  code
    ? String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt()))
    : "🌐";

/* ================= ROW ================= */

const AnalyticsRow = memo(function AnalyticsRow({
  label,
  count,
  percentage,
  icon,
  isTop,
  type,
}) {
  const displayLabel =
    type === "country" ? CountryNames[label] || label || "Other" : label;

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 p-3 rounded-xl transition-all duration-200",
        "hover:bg-gray-50"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          
          {/* ICON */}
          <div
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl",
              isTop
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {icon}
          </div>

          {/* TEXT */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-800 truncate">
                {displayLabel}
              </span>

              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {formatNumber(count)}
              </span>
            </div>

            {/* BAR */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-indigo-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ================= SKELETON ================= */

const Skeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="space-y-2 animate-pulse">
        <div className="flex justify-between">
          <div className="w-32 h-4 bg-gray-200 rounded" />
          <div className="w-12 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-full h-2 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

/* ================= MAIN ================= */

const AnalyticsListCard = ({
  title,
  data = [],
  type = "default",
  isLoading = false,
}) => {
  const total = useMemo(
    () => (data || []).reduce((acc, i) => acc + (i.count || 0), 0),
    [data]
  );

  const items = useMemo(() => {
    return (data || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item, i) => ({
        ...item,
        percentage: total ? Math.round((item.count / total) * 100) : 0,
        isTop: i === 0,
      }));
  }, [data, total]);

  const getIcon = (item) => {
    switch (type) {
      case "country":
        return <span>{getFlagEmoji(item._id)}</span>;
      case "device":
        return <DeviceIcon type={item._id} />;
      case "page":
        return <FileText size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col h-full shadow-sm hover:border-gray-300 transition">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>

        <span className="text-xs text-gray-400">
          Visitors
        </span>
      </div>

      {/* BODY */}
      <div className="flex-1">
        {isLoading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <AlertCircle className="text-gray-300 mb-3" size={28} />
            <p className="text-sm text-gray-600">
              No data yet
            </p>
            <p className="text-xs text-gray-400">
              Traffic will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <AnalyticsRow
                key={item.id || item._id || index}
                label={item._id}
                count={item.count}
                percentage={item.percentage}
                isTop={item.isTop}
                type={type}
                icon={getIcon(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      {items.length > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <span>Total {formatNumber(total)}</span>
          <button className="text-indigo-500 hover:text-indigo-600 transition">
            View all
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(AnalyticsListCard);