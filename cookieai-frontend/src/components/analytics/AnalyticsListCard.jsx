import { memo, useMemo } from "react";
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
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
        "hover:bg-gray-50"
      )}
    >
      {/* ICON */}
      <div
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-xl",
          isTop
            ? "bg-indigo-500 text-white shadow-sm"
            : "bg-gray-100 text-gray-500"
        )}
      >
        {icon}
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-800 truncate">
            {label || "Unknown"}
          </span>

          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatNumber(count)}
          </span>
        </div>

        {/* BAR */}
        <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6 }}
            className={cn(
              "h-full rounded-full",
              isTop ? "bg-indigo-500" : "bg-gray-300"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
});

/* ================= SKELETON ================= */
const Skeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="space-y-2 animate-pulse">
        <div className="flex justify-between">
          <div className="w-28 h-3 bg-gray-200 rounded" />
          <div className="w-10 h-3 bg-gray-200 rounded" />
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded" />
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
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col h-full shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>

        <span className="text-xs text-gray-400">
          {formatNumber(total)}
        </span>
      </div>

      {/* BODY */}
      <div className="flex-1">
        {isLoading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="text-gray-300 mb-2" size={24} />
            <p className="text-sm text-gray-500">
              No data available
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <AnalyticsRow
                key={item.id || item._id || index}
                label={item._id}
                count={item.count}
                percentage={item.percentage}
                isTop={item.isTop}
                icon={getIcon(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      {items.length > 0 && (
        <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <span>Total</span>
          <button className="text-indigo-500 hover:text-indigo-600 transition">
            View all
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(AnalyticsListCard);