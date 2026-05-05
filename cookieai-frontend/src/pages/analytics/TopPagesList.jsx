import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

export default function TopPagesList({ pages = [], loading = false }) {
  const [open, setOpen] = useState(false);

  /* ---------- LISTEN EVENT ---------- */
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("top-pages-expand", handler);
    return () => window.removeEventListener("top-pages-expand", handler);
  }, []);

  /* ---------- SAFE DATA ---------- */
  const safePages = useMemo(() => {
    if (!Array.isArray(pages)) return [];

    return pages
      .map((p) => ({
        path: p?.path || "/",
        visitors: Number(p?.visitors || 0),
        pageViews: Number(p?.pageViews || p?.views || p?.count || 0),
      }))
      .sort((a, b) => b.pageViews - a.pageViews);
  }, [pages]);

  const preview = safePages.slice(0, 5);

  const maxViews = useMemo(() => {
    if (!safePages.length) return 1;
    return Math.max(...safePages.map((p) => p.pageViews), 1);
  }, [safePages]);

  const renderItem = (item, i) => {
    const percent = Math.min((item.pageViews / maxViews) * 100, 100);

    return (
      <motion.div
        key={`${item.path}-${i}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.02 }}
        className="px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
      >
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {item.path}
          </span>

          <div className="flex gap-6 text-xs">
            <div>
              <div className="text-gray-400">Visitors</div>
              <div className="font-semibold text-gray-900">
                {item.visitors}
              </div>
            </div>

            <div>
              <div className="text-gray-400">Views</div>
              <div className="font-semibold text-gray-900">
                {item.pageViews}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className="h-full bg-indigo-500"
          />
        </div>
      </motion.div>
    );
  };

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!safePages.length) return null;

  return (
    <>
      {/* PREVIEW LIST */}
      <div className="space-y-3">
        {preview.map(renderItem)}
      </div>

      {/* FULL PANEL */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  All Pages
                </h3>

                <button
                  onClick={() => setOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Close
                </button>
              </div>

              {/* LIST */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {safePages.map(renderItem)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}