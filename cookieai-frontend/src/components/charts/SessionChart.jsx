import React from "react";

const SessionChart = ({ data }) => {
  const sessions = data?.sessions || {};

  const formatted = Object.entries(sessions).map(([range, count]) => ({
    range,
    count: Number(count) || 0,
  }));

  if (!formatted.length || formatted.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No session data
      </div>
    );
  }

  const max = Math.max(...formatted.map((d) => d.count), 1);
  const total = formatted.reduce((s, d) => s + d.count, 0) || 1;

  const top = [...formatted].sort((a, b) => b.count - a.count)[0] || {};

  return (
    <div className="space-y-4">
      {/* BARS */}
      <div className="space-y-3">
        {formatted.map((item, i) => {
          const width = (item.count / max) * 100;
          const percentage = Math.round((item.count / total) * 100);

          return (
            <div key={i} className="space-y-1.5">
              {/* LABEL */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">{item.range}</span>
                <span className="text-gray-900 font-medium">
                  {item.count.toLocaleString()} · {percentage}%
                </span>
              </div>

              {/* BAR */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* STATS */}
      <div className="pt-3 border-t space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Total Sessions</span>
          <span className="font-medium text-gray-900">{total.toLocaleString()}</span>
        </div>

        {top.range && (
          <div className="flex items-center justify-between text-gray-600">
            <span>Top Range</span>
            <span className="font-medium text-gray-900">{top.range}</span>
          </div>
        )}
      </div>

      {/* INSIGHT */}
      {top.range && (
        <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700">
          Most users stay in <span className="font-medium">{top.range}</span> — strong engagement signal.
        </div>
      )}
    </div>
  );
};

export default SessionChart;