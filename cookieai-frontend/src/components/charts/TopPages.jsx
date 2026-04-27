import React from "react";

const TopPages = ({ data = [] }) => {
  const pages = Array.isArray(data) ? data : [];

  if (!pages.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm py-10">
        No page data yet
      </div>
    );
  }

  const maxCount = Math.max(...pages.map((p) => p.count || 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
        <span>Page Path</span>
        <span>Views</span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {pages.map((page, i) => (
          <div key={i} className="relative flex items-center justify-between p-2 rounded-lg group">
            {/* Background Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-indigo-50 rounded-lg -z-10 transition-all duration-300"
              style={{ width: `${((page.count || 0) / maxCount) * 100}%` }}
            />
            <span className="text-sm font-medium text-gray-800 truncate pr-4">
              {page._id || "/"}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {page.count || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPages;
