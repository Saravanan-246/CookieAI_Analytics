import React, { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";

const VisitedPagesCard = ({ pages = [], loading = false }) => {
  const [expanded, setExpanded] = useState(false);

  /* ---------- SAFE DATA ---------- */
  const safePages = useMemo(() => {
    if (!Array.isArray(pages)) return [];
    const map = new Map();
    
    pages.forEach((p) => {
      const path = p?.path || "/";
      const visitors = Number(p?.visitors || 0);
      const pageViews = Number(p?.pageViews || p?.views || p?.count || 0);
      
      if (!map.has(path)) {
        map.set(path, { path, visitors, pageViews });
      } else {
        const existing = map.get(path);
        existing.pageViews += pageViews;
        existing.visitors = Math.max(existing.visitors, visitors); // or += visitors depending on interpretation, but normally visitors are unique.
      }
    });

    return Array.from(map.values()).sort((a, b) => b.pageViews - a.pageViews);
  }, [pages]);

  /* ---------- SHOW MORE ---------- */
  const visiblePages = expanded ? safePages : safePages.slice(0, 5);

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
  const renderPageItem = (item, i) => {
    const percentage = Math.min((item.pageViews / maxViews) * 100, 100);

    return (
      <motion.div
        key={`${item.path}-${i}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className="group p-4 rounded-2xl hover:bg-gray-50 transition"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900 truncate pr-4">
            {formatPath(item.path)}
          </span>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase text-gray-400">
                Visitors
              </div>
              <div className="font-semibold text-gray-900">
                {item.visitors}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase text-gray-400">
                Views
              </div>
              <div className="font-semibold text-gray-900">
                {item.pageViews}
              </div>
            </div>
          </div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full bg-violet-500 rounded-full"
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      {/* HEADER */}
      <div className="pb-4 flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-900">
          Top Pages
        </h3>

        {safePages.length > 5 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-gray-500 hover:text-gray-700 transition"
          >
            {expanded ? "Show less" : "View more"}
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {safePages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <FileText className="w-5 h-5 text-gray-300" />
            <p className="text-sm text-gray-500 mt-2">
              No page activity yet
            </p>
          </div>
        ) : (
          visiblePages.map(renderPageItem)
        )}
      </div>
    </div>
  );
};

export default VisitedPagesCard;