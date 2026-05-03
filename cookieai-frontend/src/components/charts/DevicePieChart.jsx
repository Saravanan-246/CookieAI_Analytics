import React, { useState, useMemo } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
} from "lucide-react";

/* 🔥 FLAG HELPER */
const getFlag = (code) => {
  if (!code || code === "Unknown") return "🏳️";
  try {
    return String.fromCodePoint(
      ...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt())
    );
  } catch {
    return "🏳️";
  }
};

/* 🔥 ICON SYSTEM (Improved) */
const getIcon = (name) => {
  const n = (name || "").toLowerCase();

  // DEVICE
  if (n.includes("mobile"))
    return <Smartphone className="w-4 h-4 text-indigo-500" />;
  if (n.includes("tablet") || n.includes("ipad"))
    return <Tablet className="w-4 h-4 text-purple-500" />;
  if (n.includes("desktop"))
    return <Monitor className="w-4 h-4 text-blue-500" />;

  // BROWSER (REAL LOOK VIA COLORS)
  if (n.includes("chrome"))
    return <Globe className="w-4 h-4 text-yellow-500" />;
  if (n.includes("safari"))
    return <Globe className="w-4 h-4 text-blue-400" />;
  if (n.includes("firefox"))
    return <Globe className="w-4 h-4 text-orange-500" />;
  if (n.includes("edge"))
    return <Globe className="w-4 h-4 text-cyan-500" />;
  if (n.includes("opera"))
    return <Globe className="w-4 h-4 text-red-500" />;

  return <Globe className="w-4 h-4 text-gray-400" />;
};

const DeviceCard = ({ data = [], browserData = [] }) => {
  const [tab, setTab] = useState("devices");

  const normalize = useMemo(
    () => (arr) =>
      arr
        .map((d) => ({
          name: d.name || d._id,
          value: d.value || d.count,
          country: d.country || "Unknown",
        }))
        .filter((d) => d.value > 0),
    []
  );

  const entries = useMemo(
    () => (tab === "devices" ? normalize(data) : normalize(browserData)),
    [tab, data, browserData, normalize]
  );

  const total = useMemo(
    () => entries.reduce((s, d) => s + d.value, 0) || 1,
    [entries]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

      {/* TABS */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl text-xs mb-6 w-fit">
        {["devices", "browsers"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "devices" ? "Devices" : "Browsers"}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {entries.map((item, i) => {
          const percent = Math.round((item.value / total) * 100);

          return (
            <div key={i} className="group">
              
              {/* ROW */}
              <div className="flex items-center justify-between mb-2">
                
                <div className="flex items-center gap-3 min-w-0">
                  
                  {/* ICON */}
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition">
                    {getIcon(item.name)}
                  </div>

                  {/* NAME */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
                      {item.name}
                    </span>

                    {/* COUNTRY */}
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                      {getFlag(item.country)}
                    </span>
                  </div>
                </div>

                {/* VALUE */}
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {percent}%
                </span>
              </div>

              {/* BAR */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percent}%`,
                    background:
                      "linear-gradient(90deg, #6366f1, #4f46e5)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY */}
      {!entries.length && (
        <div className="text-center text-gray-400 text-sm py-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-gray-300" />
          </div>
          No data recorded yet
        </div>
      )}
    </div>
  );
};

export default React.memo(DeviceCard);