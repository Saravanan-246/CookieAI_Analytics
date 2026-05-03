import React from "react";

const getFlag = (countryCode) => {
  if (!countryCode || countryCode === "Unknown") return "🏳️";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🏳️";
  }
};

const TopCountries = ({ data = [] }) => {
  const countries = Array.isArray(data) ? data : [];

  if (!countries.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
        No country data yet
      </div>
    );
  }

  const maxCount = Math.max(...countries.map((c) => c.count || 0), 1);
  const total = countries.reduce((s, c) => s + (c.count || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">

      {/* HEADER */}
      <div className="flex justify-between mb-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <span>Country</span>
        <span>Visitors</span>
      </div>

      {/* LIST */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {countries.map((country, i) => {
          const code = country._id || "Unknown";
          const count = country.count || 0;
          const percent = Math.round((count / total) * 100);

          return (
            <div key={i} className="group">

              {/* ROW */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">

                  {/* FLAG */}
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition">
                    <span className="text-base">
                      {getFlag(code)}
                    </span>
                  </div>

                  {/* NAME */}
                  <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
                    {code}
                  </span>
                </div>

                {/* VALUE */}
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {percent}%
                </span>
              </div>

              {/* BAR */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    background:
                      "linear-gradient(90deg, #6366f1, #4f46e5)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
        <span>Total</span>
        <span className="font-semibold text-gray-900">
          {total}
        </span>
      </div>

      {/* SCROLLBAR */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TopCountries;