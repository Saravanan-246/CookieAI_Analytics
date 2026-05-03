import React from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Compass,
} from "lucide-react";
import { motion } from "framer-motion";

/* ================= ICONS ================= */
const getBrowserIcon = (browser) => {
  const b = browser?.toLowerCase() || "";

  if (b.includes("chrome"))
    return <Globe size={12} className="text-yellow-500" />;

  if (b.includes("safari"))
    return <Compass size={12} className="text-sky-500" />;

  if (b.includes("firefox"))
    return <Globe size={12} className="text-orange-500" />;

  if (b.includes("edge"))
    return <Globe size={12} className="text-cyan-500" />;

  return <Globe size={12} className="text-gray-400" />;
};

const getDeviceIcon = (device) => {
  const d = device?.toLowerCase() || "";

  if (d.includes("mobile"))
    return <Smartphone size={12} className="text-indigo-500" />;

  if (d.includes("tablet"))
    return <Tablet size={12} className="text-purple-500" />;

  return <Monitor size={12} className="text-blue-500" />;
};

/* ================= MINI SECTION ================= */
const MiniSection = ({ title, items = [], iconFn }) => {
  const safeItems = Array.isArray(items) ? items : [];

  const total = safeItems.reduce(
    (sum, x) => sum + (x?.count ?? x?.value ?? 0),
    0
  );

  return (
    <div className="
      bg-white border border-gray-100 rounded-2xl p-5
      shadow-sm hover:shadow-md transition
    ">
      {/* HEADER */}
      <h3 className="
        text-[10px] font-semibold text-gray-400
        uppercase tracking-wider mb-4
      ">
        {title}
      </h3>

      {/* CONTENT */}
      <div className="space-y-3">

        {safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[120px] text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/40">
            <p className="text-xs font-medium text-gray-500">
              No {title.toLowerCase()} yet
            </p>
          </div>
        ) : (
          safeItems.slice(0, 4).map((item, i) => {
            const count = item?.count ?? item?.value ?? 0;

            const percent = total
              ? ((count / total) * 100).toFixed(1)
              : "0.0";

            const label = item?.name || item?.device || "Unknown";

            return (
              <div key={i} className="space-y-1.5">

                {/* ROW */}
                <div className="flex items-center justify-between text-[12px]">
                  
                  {/* LEFT */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-50 border border-gray-100">
                      {iconFn(label)}
                    </div>

                    <span className="font-medium text-gray-700 truncate">
                      {label}
                    </span>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 w-10 text-right">
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* BAR */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
};

/* ================= MAIN ================= */
export default function BrowserDeviceMiniCards({
  devices = [],
  browsers = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="
              bg-white border border-gray-100 rounded-2xl p-5
              animate-pulse h-[180px]
            "
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MiniSection
        title="Devices"
        items={devices}
        iconFn={getDeviceIcon}
      />

      <MiniSection
        title="Browsers"
        items={browsers}
        iconFn={getBrowserIcon}
      />
    </div>
  );
}