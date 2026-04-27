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
      <div className="flex items-center justify-center h-full text-gray-400 text-sm py-10">
        No country data yet
      </div>
    );
  }

  const maxCount = Math.max(...countries.map((c) => c.count || 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
        <span>Country</span>
        <span>Visitors</span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {countries.map((country, i) => {
          const code = country._id || "Unknown";
          return (
            <div key={i} className="relative flex items-center justify-between p-2 rounded-lg group">
              {/* Background Bar */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-50 rounded-lg -z-10 transition-all duration-300"
                style={{ width: `${((country.count || 0) / maxCount) * 100}%` }}
              />
              <div className="flex items-center gap-2">
                <span className="text-base">{getFlag(code)}</span>
                <span className="text-sm font-medium text-gray-800 truncate pr-4">
                  {code}
                </span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {country.count || 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopCountries;
