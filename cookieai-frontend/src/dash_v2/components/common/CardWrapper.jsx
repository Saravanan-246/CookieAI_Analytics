import { motion } from "framer-motion";

export default function CardWrapper({
  title,
  subtitle,
  children,
  action,
  className = "",
  noDivider = false
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
      className={`
        group
        bg-white border border-gray-100
        rounded-2xl p-5
        shadow-sm hover:shadow-md
        transition-all duration-300
        ${className}
      `}
    >
      {/* ================= HEADER ================= */}
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">

          {/* LEFT */}
          <div className="flex flex-col">
            {title && (
              <h3 className="
                text-sm font-semibold text-gray-900
                tracking-tight
              ">
                {title}
              </h3>
            )}

            {subtitle && (
              <p className="
                text-xs text-gray-500 mt-0.5
              ">
                {subtitle}
              </p>
            )}
          </div>

          {/* RIGHT ACTION */}
          {action && (
            <button
              className="
                text-xs font-medium
                px-3 py-1.5 rounded-lg
                bg-gray-50 border border-gray-200
                text-gray-600
                hover:bg-gray-100 hover:border-gray-300
                active:scale-[0.97]
                transition-all
              "
            >
              {action}
            </button>
          )}
        </div>
      )}

      {/* ================= DIVIDER ================= */}
      {!noDivider && (
        <div className="border-t border-gray-100 mb-4" />
      )}

      {/* ================= CONTENT ================= */}
      <div className="min-h-[100px] flex flex-col justify-center">
        {children}
      </div>
    </motion.div>
  );
}