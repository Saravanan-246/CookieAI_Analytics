import { motion } from "framer-motion";
import { Globe } from "lucide-react";

export default function TopCountries({ countries = [], loading = false }) {
  /* ================= SAFE DATA ================= */
  const safeCountries = Array.isArray(countries) ? countries : [];

  const total = safeCountries.reduce(
    (sum, c) => sum + (c?.count || c?.value || 0),
    0
  );

  const displayCountries = [...safeCountries].sort(
    (a, b) => (b?.count || b?.value || 0) - (a?.count || a?.value || 0)
  );

  /* ================= FLAG ================= */
  const getFlagUrl = (code) => {
    if (!code || ["Unknown", "XX", "LOCAL"].includes(code)) return null;
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-4 bg-gray-100 rounded" />
                <div className="h-3 w-28 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-10 bg-gray-100 rounded" />
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  /* ================= EMPTY ================= */
  if (displayCountries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
          <Globe className="w-5 h-5 text-gray-300" />
        </div>

        <p className="text-sm font-medium text-gray-500">
          No geographic data yet
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Data will appear when users visit your site
        </p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[320px] space-y-4">
        {displayCountries.map((c, i) => {
          const count = c?.count || c?.value || 0;
          const percent = total ? (count / total) * 100 : 0;
          const flag = getFlagUrl(c?.code);

          return (
            <motion.div
              key={c?.code || i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="group"
            >
              {/* TOP ROW */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* FLAG */}
                  <div className="w-5 h-3.5 rounded overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {flag ? (
                      <img
                        src={flag}
                        alt={c?.country}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Globe className="w-3 h-3 text-gray-300" />
                    )}
                  </div>

                  {/* COUNTRY */}
                  <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 transition">
                    {c?.country || c?.name || "Other"}
                  </span>
                </div>

                {/* COUNT */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {count.toLocaleString()}
                  </span>

                  <span className="text-[11px] text-gray-400 w-10 text-right">
                    {percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* PROGRESS */}
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}