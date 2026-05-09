import React from "react";
import {
  Globe2,
  TrendingUp,
} from "lucide-react";

const getFlag = (countryCode) => {
  if (!countryCode || countryCode === "Unknown") {
    return "🏳️";
  }

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(
      (char) =>
        127397 + char.charCodeAt(0)
    );

  try {
    return String.fromCodePoint(
      ...codePoints
    );
  } catch {
    return "🏳️";
  }
};

const TopCountries = ({
  data = [],
}) => {

  const countries = Array.isArray(data)
    ? data
    : [];

  if (!countries.length) {
    return (
      <div
        className="
          relative overflow-hidden
          rounded-[28px]
          border border-white/60
          bg-white/90
          backdrop-blur-xl
          p-10
          shadow-[0_10px_40px_rgba(0,0,0,0.04)]
        "
      >
        <div className="flex flex-col items-center justify-center text-center py-10">

          <div
            className="
              w-16 h-16 rounded-2xl
              bg-gradient-to-br
              from-violet-100
              to-indigo-100
              flex items-center justify-center
              mb-5
              shadow-inner
            "
          >
            <Globe2
              size={28}
              className="text-violet-600"
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900">
            No Country Data
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Visitor geography analytics
            will appear here.
          </p>

        </div>
      </div>
    );
  }

  const total = countries.reduce(
    (sum, c) =>
      sum + Number(c.count || 0),
    0
  );

  const maxCount = Math.max(
    ...countries.map(
      (c) => Number(c.count || 0)
    ),
    1
  );

  return (
    <div
      className="
        relative overflow-hidden
        rounded-[30px]
        border border-white/60
        bg-white/90
        backdrop-blur-xl
        shadow-[0_12px_50px_rgba(0,0,0,0.05)]
      "
    >

      {/* GLOW */}
      <div
        className="
          absolute top-0 right-0
          w-40 h-40
          bg-violet-200/30
          blur-3xl
          rounded-full
          pointer-events-none
        "
      />

      {/* HEADER */}
      <div
        className="
          relative z-10
          px-7 pt-7 pb-5
          border-b border-gray-100
        "
      >

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">
              Global Presence
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Visitor distribution by
              country
            </p>
          </div>

          <div
            className="
              w-11 h-11
              rounded-2xl
              bg-gradient-to-br
              from-violet-500
              to-indigo-600
              flex items-center justify-center
              shadow-lg shadow-violet-200
            "
          >
            <TrendingUp
              size={18}
              className="text-white"
            />
          </div>

        </div>

      </div>

      {/* BODY */}
      <div
        className="
          relative z-10
          p-7
          space-y-5
          max-h-[380px]
          overflow-y-auto
          custom-scrollbar
        "
      >

        {countries.map(
          (country, index) => {

            const code =
              country?._id ||
              "Unknown";

            const count = Number(
              country?.count || 0
            );

            const percent =
              total > 0
                ? Math.round(
                    (count / total) *
                      100
                  )
                : 0;

            const barWidth =
              (count / maxCount) * 100;

            return (
              <div
                key={`${code}-${index}`}
                className="
                  group
                  rounded-2xl
                  border border-gray-100
                  bg-white/70
                  hover:bg-white
                  hover:border-violet-200
                  hover:shadow-xl
                  hover:shadow-violet-100/40
                  transition-all duration-300
                  p-4
                "
              >

                {/* TOP */}
                <div className="flex items-center justify-between mb-4">

                  {/* LEFT */}
                  <div className="flex items-center gap-4 min-w-0">

                    {/* FLAG */}
                    <div
                      className="
                        w-12 h-12
                        rounded-2xl
                        bg-gradient-to-br
                        from-gray-50
                        to-violet-50
                        border border-gray-100
                        flex items-center justify-center
                        text-xl
                        shadow-sm
                        group-hover:scale-105
                        transition-transform
                      "
                    >
                      {getFlag(code)}
                    </div>

                    {/* NAME */}
                    <div className="min-w-0">

                      <div className="text-sm font-bold text-gray-900 truncate">
                        {code}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {count} visitors
                      </div>

                    </div>

                  </div>

                  {/* RIGHT */}
                  <div className="text-right">

                    <div className="text-lg font-black text-gray-900 tabular-nums">
                      {percent}%
                    </div>

                    <div className="text-[11px] text-gray-400 font-medium">
                      Traffic Share
                    </div>

                  </div>

                </div>

                {/* BAR */}
                <div
                  className="
                    relative
                    w-full h-3
                    rounded-full
                    overflow-hidden
                    bg-gray-100
                  "
                >

                  <div
                    className="
                      absolute inset-y-0 left-0
                      rounded-full
                      transition-all duration-1000
                    "
                    style={{
                      width: `${barWidth}%`,
                      background:
                        "linear-gradient(90deg,#7c3aed 0%,#6366f1 50%,#4f46e5 100%)",
                      boxShadow:
                        "0 0 18px rgba(124,58,237,0.35)",
                    }}
                  />

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* FOOTER */}
      <div
        className="
          relative z-10
          px-7 py-5
          border-t border-gray-100
          bg-gray-50/60
          flex items-center justify-between
        "
      >

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            Total Visitors
          </p>

          <h3 className="text-2xl font-black text-gray-900 mt-1">
            {total}
          </h3>
        </div>

        <div
          className="
            px-4 py-2
            rounded-xl
            bg-emerald-50
            border border-emerald-100
            text-emerald-600
            text-xs
            font-bold
          "
        >
          Live Analytics
        </div>

      </div>

    </div>
  );
};

export default TopCountries;