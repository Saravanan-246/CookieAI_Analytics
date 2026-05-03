import { motion } from "framer-motion";

/* ================= DEFAULT ICON ================= */
const DefaultIcon = () => (
  <div className="w-6 h-6 rounded-full bg-gray-300" />
);

/* ================= SHIMMER ================= */
const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-[shimmer_1.5s_infinite]";

export default function EmptyState({
  title = "No data available",
  description = "Once data is available, it will appear here.",
  action,
  loading = false,
  icon
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center text-center py-14 px-4"
    >
      {/* ICON / SKELETON */}
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 mb-5 shadow-sm">
        {loading ? (
          <div className={`w-6 h-6 bg-gray-200 rounded-full ${shimmer}`} />
        ) : (
          icon || <DefaultIcon />
        )}
      </div>

      {/* TITLE */}
      {loading ? (
        <div className={`h-4 w-36 bg-gray-200 rounded-md mb-2 ${shimmer}`} />
      ) : (
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>
      )}

      {/* DESCRIPTION */}
      {loading ? (
        <div className="space-y-2 mt-2">
          <div className={`h-3 w-52 bg-gray-100 rounded ${shimmer}`} />
          <div className={`h-3 w-40 bg-gray-100 rounded ${shimmer}`} />
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* ACTION BUTTON */}
      {!loading && action && (
        <div className="mt-5">
          <button
            className="
              text-xs font-semibold
              px-4 py-2 rounded-lg
              bg-gray-900 text-white
              hover:bg-gray-800 active:scale-[0.98]
              transition-all
            "
          >
            {action}
          </button>
        </div>
      )}

    </motion.div>
  );
}