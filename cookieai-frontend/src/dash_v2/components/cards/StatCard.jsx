import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon,
  change,
  loading = false,
  isPercentage = false,
  updatedAt,
}) {
  /* ================= FORMAT ================= */
  const formatNumber = (num) => {
    const n = Number(num) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString();
  };

  /* ================= SAFE VALUES ================= */
  const isEmpty =
    value === 0 || value === null || value === undefined || value === "0" || value === "—";

  const isNegative =
    typeof change === "string"
      ? change.startsWith("-")
      : typeof change === "number"
      ? change < 0
      : false;

  const changeLabel =
    typeof change === "number"
      ? `${change > 0 ? "+" : ""}${change}%`
      : change || null;

  /* Format display value */
  const displayValue =
    typeof value === "string"
      ? value
      : typeof value === "number"
      ? `${formatNumber(value)}${isPercentage ? "%" : ""}`
      : "0";

  /* ================= UI ================= */
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="
        bg-white border border-gray-100 rounded-2xl p-5
        shadow-sm hover:shadow-md transition-all
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">

        {/* LABEL */}
        <p className="
          text-[11px] font-semibold text-gray-500
          uppercase tracking-wide
        ">
          {label}
        </p>

        {/* ICON */}
        {icon && (
          <div className="
            w-8 h-8 flex items-center justify-center
            rounded-lg bg-gray-50 border border-gray-100
            text-gray-600
          ">
            {icon}
          </div>
        )}
      </div>

      {/* VALUE */}
      <div className="flex items-end justify-between">

        {/* NUMBER */}
        <div className="flex items-end gap-2">
          {loading ? (
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
          ) : (
            <h2 className="
              text-2xl font-semibold text-gray-900
              tracking-tight tabular-nums
            ">
              {displayValue}
            </h2>
          )}

          {!loading && isEmpty && (
            <span className="text-[10px] text-gray-300 uppercase">
              empty
            </span>
          )}
        </div>

        {/* CHANGE */}
        {!loading && changeLabel && !isEmpty && (
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
              ${
                isNegative
                  ? "text-rose-600 bg-rose-50"
                  : "text-emerald-600 bg-emerald-50"
              }
            `}
          >
            {isNegative ? (
              <ArrowDownRight size={12} />
            ) : (
              <ArrowUpRight size={12} />
            )}
            {changeLabel}
          </div>
        )}
      </div>

      {/* FOOTER (optional timestamp) */}
      {updatedAt && !loading && (
        <div className="mt-3 text-[10px] text-gray-400">
          Updated {updatedAt}
        </div>
      )}
    </motion.div>
  );
}