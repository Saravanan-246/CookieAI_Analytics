import { motion, AnimatePresence } from "framer-motion";
import CardWrapper from "../common/CardWrapper";
import EmptyState from "../common/EmptyState";

export default function LiveFeed({ events = [] }) {
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <CardWrapper title="Live Activity">

      {/* EMPTY STATE */}
      {safeEvents.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center">
          <EmptyState
            title="No live activity"
            description="Visitors activity will appear here"
          />
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          
          <AnimatePresence>
            {safeEvents.map((e, i) => {
              const id =
                e?._id ||
                `${e?.sessionId}_${e?.path}_${e?.time || i}`;

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="
                    flex items-center justify-between
                    bg-white border border-gray-100
                    rounded-xl px-3 py-2.5
                    hover:shadow-sm hover:border-gray-200
                    transition-all duration-200
                  "
                >
                  {/* LEFT */}
                  <div className="flex flex-col min-w-0">
                    
                    {/* PATH */}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {e?.path || "/"}
                    </p>

                    {/* META */}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <span>{e?.device || "Unknown"}</span>
                      <span>•</span>
                      <span>{e?.country || "Unknown"}</span>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-2 ml-3">

                    {/* LIVE DOT */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                      <div className="w-2 h-2 bg-emerald-500 rounded-full relative z-10" />
                    </div>

                    <span className="text-[11px] text-gray-500 font-medium">
                      live
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

        </div>
      )}

    </CardWrapper>
  );
}