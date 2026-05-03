import React from "react";

const SessionChart = ({ data }) => {
  const sessions = data?.sessions || {};

  const formatted = Object.entries(sessions).map(([range, count]) => ({
    range,
    count: Number(count) || 0,
  }));

  if (!formatted.length || formatted.every((d) => d.count === 0)) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
        No session data
      </div>
    );
  }

  const max = Math.max(...formatted.map((d) => d.count), 1);
  const total = formatted.reduce((s, d) => s + d.count, 0) || 1;

  const top = [...formatted].sort((a, b) => b.count - a.count)[0] || {};

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Session Duration
        </h3>
        <p className="text-xs text-gray-500">
          User engagement breakdown
        </p>
      </div>

      {/* BARS */}
      <div className="space-y-5">
        {formatted.map((item, i) => {
          const width = (item.count / max) * 100;
          const percentage = Math.round((item.count / total) * 100);

          return (
            <div key={i} className="space-y-2">

              {/* LABEL */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">
                  {item.range}
                </span>

                <span className="text-gray-900 font-semibold tabular-nums">
                  {item.count.toLocaleString()} · {percentage}%
                </span>
              </div>

              {/* BAR */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${width}%`,
                    background:
                      "linear-gradient(90deg, #6366f1, #4f46e5)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* STATS */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-sm space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Total Sessions</span>
          <span className="font-semibold text-gray-900">
            {total.toLocaleString()}
          </span>
        </div>

        {top.range && (
          <div className="flex justify-between text-gray-600">
            <span>Top Range</span>
            <span className="font-semibold text-gray-900">
              {top.range}
            </span>
          </div>
        )}
      </div>

      {/* INSIGHT */}
      {top.range && (
        <div className="mt-5 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700">
          Most users stay in{" "}
          <span className="font-semibold">
            {top.range}
          </span>
        </div>
      )}
    </div>
  );
};

export default SessionChart;