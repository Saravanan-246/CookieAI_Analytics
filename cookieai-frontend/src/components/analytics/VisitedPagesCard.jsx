import React, { useMemo, useState } from "react";
import { FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VisitedPagesCard = ({ pages = [], loading = false }) => {
  const [open, setOpen] = useState(false);

  /* ---------- NORMALIZE DATA ---------- */
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

  const topPages = safePages.slice(0, 5);

  const maxViews = useMemo(() => {
    if (safePages.length === 0) return 1;
    return Math.max(...safePages.map((p) => p.pageViews), 1);
  }, [safePages]);

  const formatPath = (path) => {
    if (!path || path === "/") return "/ (homepage)";
    return path;
  };

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 h-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="flex justify-between">
              <div className="h-3 w-36 bg-gray-100 rounded" />
              <div className="h-3 w-12 bg-gray-100 rounded" />
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  /* ---------- ITEM ---------- */
  const renderItem = (item, i) => {
    const percentage = Math.min((item.pageViews / maxViews) * 100, 100);

    return (
      <motion.div
        key={`${item.path}-${i}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className="group p-4 rounded-xl hover:bg-gray-50 transition cursor-default"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 truncate pr-4">
            {formatPath(item.path)}
          </span>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase">
                Visitors
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {item.visitors}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase">
                Views
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {item.pageViews}
              </div>
            </div>
          </div>
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full bg-gray-900 rounded-full"
          />
        </div>
      </motion.div>
    );
  };

return (
  <>
    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm flex flex-col h-full">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
          Top Pages
        </h3>

        <button
          onClick={() => safePages.length && setOpen(true)}
          disabled={safePages.length === 0}
          className={`
            text-xs font-medium px-3 py-1.5 rounded-lg transition-all
            ${
              safePages.length === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }
          `}
        >
          View all
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {safePages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <FileText className="w-5 h-5 text-gray-300" />
            <p className="text-sm text-gray-500 mt-2">
              No page activity yet
            </p>
          </div>
        ) : (
          topPages.map(renderItem)
        )}
      </div>
    </div>

    {/* MODAL */}
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                All Pages
              </h3>

              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {safePages.map(renderItem)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
};

export default VisitedPagesCard;