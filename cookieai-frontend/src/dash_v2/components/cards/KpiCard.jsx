import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KpiCard({
  label,
  value,
  icon,
  loading = false,
  change,
  formatter = (v) => v,
}) {
  /* ================= SAFE ================= */
  const safeValue = value ?? 0;
  const isEmpty = safeValue === 0;

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

  const displayValue = isEmpty ? "—" : formatter(safeValue);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="
        relative bg-white border border-gray-100 rounded-2xl p-5
        shadow-sm hover:shadow-md transition-all
      "
    >
      {/* TOP ACCENT */}
      <div className="
        absolute top-0 left-0 w-full h-[2px]
        bg-gradient-to-r from-indigo-500 to-violet-500
        rounded-t-2xl opacity-70
      " />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <p className="
          text-[11px] font-semibold text-gray-500
          uppercase tracking-wide
        ">
          {label}
        </p>

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
      <div className="mt-3 min-h-[32px] flex items-end">
        {loading ? (
          <div className="h-7 w-20 bg-gray-100 rounded animate-pulse" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.h2
              key={displayValue}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={`
                text-2xl font-semibold tracking-tight tabular-nums
                ${isEmpty ? "text-gray-300" : "text-gray-900"}
              `}
            >
              {displayValue}
            </motion.h2>
          </AnimatePresence>
        )}
      </div>

      {/* META */}
      {!loading && (
        <p className="text-[11px] text-gray-400 mt-1">
          {isEmpty ? "No data yet" : "Live data"}
        </p>
      )}

      {/* CHANGE */}
      {!loading && changeLabel && !isEmpty && (
        <div className="flex items-center gap-1.5 mt-2">
          
          <span
            className={`
              flex items-center gap-1 text-[11px] font-medium
              ${
                isNegative
                  ? "text-rose-600"
                  : "text-emerald-600"
              }
            `}
          >
            {isNegative ? (
              <ArrowDownRight size={12} />
            ) : (
              <ArrowUpRight size={12} />
            )}
            {changeLabel}
          </span>

          <span
            className={`
              w-1.5 h-1.5 rounded-full
              ${
                isNegative
                  ? "bg-rose-500"
                  : "bg-emerald-500"
              }
            `}
          />
        </div>
      )}
    </motion.div>
  );
}