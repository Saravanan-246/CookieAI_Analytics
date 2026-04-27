import { memo, useMemo } from "react";
import { 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Search, 
  AlertCircle,
  Laptop,
  Cpu,
  Copy,
  Check,
  FileText
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";

/* ================= HELPERS ================= */
const DeviceIcon = ({ type }) => {
  const t = (type || "").toLowerCase();
  if (t.includes("mobile") || t.includes("phone")) return <Smartphone className="w-4 h-4" />;
  if (t.includes("tablet")) return <Tablet className="w-4 h-4" />;
  if (t.includes("desktop")) return <Monitor className="w-4 h-4" />;
  if (t.includes("laptop")) return <Laptop className="w-4 h-4" />;
  return <Cpu className="w-4 h-4" />;
};

const CountryNames = {
  "IN": "India",
  "US": "United States",
  "GB": "United Kingdom",
  "DE": "Germany",
  "FR": "France",
  "CA": "Canada",
  "AU": "Australia",
  "BR": "Brazil",
  "JP": "Japan",
  "CN": "China",
  "Unknown": "Unknown"
};

const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode === "Unknown") return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

const CountryFlag = ({ code }) => {
  const flag = getFlagEmoji(code);
  return (
    <span className="text-lg leading-none" title={CountryNames[code] || code}>
      {flag}
    </span>
  );
};

/* ================= COMPONENT: ROW ITEM ================= */
const AnalyticsRow = memo(function AnalyticsRow({ label, count, percentage, icon: Icon, isTop, type }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    if (type !== "page") return;
    e.stopPropagation();
    navigator.clipboard.writeText(label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLabel = type === "country" ? (CountryNames[label] || label) : label;

  return (
    <div 
      onClick={handleCopy}
      className={cn(
        "group relative flex flex-col gap-2 py-3 px-4 -mx-4 rounded-xl transition-all duration-200",
        type === "page" ? "cursor-pointer hover:bg-indigo-50/50" : "hover:bg-gray-50/80"
      )}
      title={label}
    >
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm border border-transparent",
            isTop ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-gray-400 group-hover:text-indigo-500 border-gray-100"
          )}>
            {Icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={cn(
              "text-sm font-bold truncate transition-colors",
              isTop ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
            )}>
              {displayLabel}
            </span>
            {type === "page" && (
              <span className="text-[10px] text-gray-400 font-medium truncate flex items-center gap-1">
                {copied ? (
                  <span className="text-green-500 flex items-center gap-0.5 animate-in fade-in zoom-in-75 duration-300">
                    <Check className="w-2.5 h-2.5" /> Copied
                  </span>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Click to copy path
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-black text-gray-900 tabular-nums">
            {count.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter opacity-70">
            {percentage}%
          </span>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="relative h-1.5 w-full bg-gray-100/80 rounded-full overflow-hidden">
        <div 
          style={{ width: `${percentage}%` }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
            isTop 
              ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
              : "bg-gray-300 group-hover:bg-indigo-400"
          )}
        />
      </div>
    </div>
  );
});

/* ================= COMPONENT: SKELETON ================= */
const AnalyticsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex flex-col gap-2 py-1">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="w-24 h-4 skeleton rounded" />
          </div>
          <div className="w-12 h-4 skeleton rounded" />
        </div>
        <div className="w-full h-1.5 skeleton rounded-full" />
      </div>
    ))}
  </div>
);

/* ================= MAIN COMPONENT ================= */
const AnalyticsListCard = ({ 
  title, 
  data = [], 
  type = "default", // country, device, os, page
  isLoading = false 
}) => {
  const totalCount = useMemo(() => 
    data.reduce((acc, curr) => acc + (curr.count || 0), 0), 
  [data]);

  const items = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item, index) => ({
        ...item,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
        isTop: index === 0
      }));
  }, [data, totalCount]);

  const getIcon = (item) => {
    switch (type) {
      case "country": return <CountryFlag code={item._id} />;
      case "device": return <DeviceIcon type={item._id} />;
      case "os": return <OSLogo os={item._id} />;
      case "page": return <FileText className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="card p-6 h-full flex flex-col bg-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Top Performers</p>
        </div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border border-gray-100">
          Visitors
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        {isLoading ? (
          <AnalyticsSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-dashed border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">No data available</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-[180px]">
              Traffic will appear here once users visit your site
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <AnalyticsRow 
                key={item._id}
                label={item._id || "Unknown"}
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

      {!isLoading && items.length > 0 ? (
        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            Total {totalCount.toLocaleString()} tracked
          </span>
          <button className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-tighter transition-colors">
            View Details
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default memo(AnalyticsListCard);
