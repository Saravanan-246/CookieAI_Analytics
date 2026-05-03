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
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { cn } from "../../utils/cn";

/* ================= FORMAT HELPERS ================= */

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString();
};

/* ================= ICON HELPERS ================= */

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

const getFlagEmoji = (code) => {
  if (!code) return "🌐";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt())
  );
};

const CountryFlag = ({ code }) => (
  <span className="text-base">{getFlagEmoji(code)}</span>
);

/* ================= ROW ================= */

const AnalyticsRow = memo(function AnalyticsRow({
  label,
  count,
  percentage,
  icon,
  isTop,
  type,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    if (type !== "page") return;
    e.stopPropagation();
    navigator.clipboard.writeText(label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayLabel =
    type === "country" ? CountryNames[label] || label || "Other" : label;

  return (
    <div
      onClick={handleCopy}
      className={cn(
        "group flex flex-col gap-2 p-3 rounded-xl transition-all duration-300",
        "hover:bg-gray-50/80",
        type === "page" && "cursor-pointer hover:bg-indigo-50/50"
      )}
    >
      {/* ROW DATA */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* ICON / FLAG */}
          <div
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-500",
              isTop
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm"
            )}
          >
            {icon}
          </div>

          {/* LABEL & BAR CONTAINER */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn(
                "text-sm truncate transition-colors",
                isTop ? "font-bold text-gray-900" : "font-semibold text-gray-700 group-hover:text-gray-900"
              )}>
                {displayLabel}
              </span>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                 <span className="text-sm font-black text-gray-900 tabular-nums">
                   {formatNumber(count)}
                 </span>
                 <span className="text-[10px] font-bold text-gray-300 uppercase w-8 text-right">
                   {percentage}%
                 </span>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="h-1.5 w-full bg-gray-100/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isTop 
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-400" 
                    : "bg-gray-200 group-hover:bg-indigo-300"
                )}
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
      <div key={i} className="space-y-2">
        <div className="flex justify-between">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-full h-2 bg-gray-200 rounded animate-pulse" />
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
        return <CountryFlag code={item._id} />;
      case "device":
        return <DeviceIcon type={item._id} />;
      case "page":
        return <FileText size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full shadow-sm hover:border-gray-300 transition-all">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400 font-medium">
          Visitors
        </span>
      </div>

      {/* BODY */}
      <div className="flex-1">
        {isLoading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <AlertCircle className="text-gray-300 mb-3" size={32} />
            <p className="text-sm font-medium text-gray-700">
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
        <div className="pt-4 mt-4 border-t text-xs text-gray-400 flex justify-between">
          <span>Total {formatNumber(total)}</span>
          <button className="text-indigo-500 hover:underline">
            View details
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(AnalyticsListCard);