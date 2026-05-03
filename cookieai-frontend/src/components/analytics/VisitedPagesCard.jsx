import React, { useMemo, useState } from "react";
import { FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VisitedPagesCard = ({ pages = [], loading = false }) => {
  const [open, setOpen] = useState(false);

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

  const visiblePages = useMemo(() => safePages.slice(0, 5), [safePages]);

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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
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

  const renderPageItem = (item, i) => {
    const percentage = Math.min((item.pageViews / maxViews) * 100, 100);

    return (
      <motion.div
        key={`${item.path}-${i}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className="group p-4 rounded-2xl transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
      >
        {/* TOP ROW */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900 truncate pr-4">
            {formatPath(item.path)}
          </span>

          <div className="flex items-center gap-6 text-right shrink-0">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Visitors
              </div>
              <div className="font-semibold text-gray-900">
                {item.visitors.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Views
              </div>
              <div className="font-semibold text-gray-900">
                {item.pageViews.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
          />
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* CARD */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Top Pages
          </h3>

          {safePages.length > 5 && (
            <button
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          {safePages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
                <FileText className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                No page activity yet
              </p>
            </div>
          ) : (
            visiblePages.map(renderPageItem)
          )}
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* HEADER */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Pages
                </h3>

                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* LIST */}
              <div className="p-4 overflow-y-auto space-y-2 custom-scrollbar">
                {safePages.map(renderPageItem)}
              </div>

              {/* FOOTER */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full bg-gray-900 hover:bg-black text-white font-medium rounded-xl py-2.5 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VisitedPagesCard;