import React, {
  useState,
  useMemo,
} from "react";

import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Sparkles,
} from "lucide-react";

/* ───────────────── FLAG ───────────────── */

const getFlag = (code) => {

  if (
    !code ||
    code === "Unknown"
  ) {
    return "🏳️";
  }

  try {

    return String.fromCodePoint(

      ...code
        .toUpperCase()
        .split("")
        .map(
          (c) =>
            127397 +
            c.charCodeAt()
        )

    );

  } catch {

    return "🏳️";

  }

};

/* ───────────────── ICON ───────────────── */

const getIcon = (name) => {

  const n = (
    name || ""
  ).toLowerCase();

  /* DEVICES */

  if (
    n.includes("mobile")
  ) {

    return (
      <Smartphone
        className="
          w-4 h-4
          text-violet-500
        "
      />
    );

  }

  if (
    n.includes("tablet") ||
    n.includes("ipad")
  ) {

    return (
      <Tablet
        className="
          w-4 h-4
          text-fuchsia-500
        "
      />
    );

  }

  if (
    n.includes("desktop")
  ) {

    return (
      <Monitor
        className="
          w-4 h-4
          text-indigo-500
        "
      />
    );

  }

  /* BROWSERS */

  if (
    n.includes("chrome")
  ) {

    return (
      <Globe
        className="
          w-4 h-4
          text-yellow-500
        "
      />
    );

  }

  if (
    n.includes("firefox")
  ) {

    return (
      <Globe
        className="
          w-4 h-4
          text-orange-500
        "
      />
    );

  }

  if (
    n.includes("safari")
  ) {

    return (
      <Globe
        className="
          w-4 h-4
          text-cyan-500
        "
      />
    );

  }

  if (
    n.includes("edge")
  ) {

    return (
      <Globe
        className="
          w-4 h-4
          text-blue-500
        "
      />
    );

  }

  return (
    <Globe
      className="
        w-4 h-4
        text-gray-400
      "
    />
  );

};

const DeviceCard = ({
  data = [],
  browserData = [],
}) => {

  const [tab, setTab] =
    useState("devices");

  /* ───────────────── NORMALIZE ───────────────── */

  const normalize = useMemo(
    () => (arr) => {

      return arr

        .map((d) => ({

          name:

            d?.name ||
            d?._id ||
            "Unknown",

          value: Number(

            d?.value ||
            d?.count ||
            0

          ),

          country:

            d?.country ||
            "Unknown",

        }))

        .filter(
          (d) =>
            d.value >= 0
        );

    },
    []
  );

  /* ───────────────── ENTRIES ───────────────── */

  const entries = useMemo(

    () =>

      tab === "devices"

        ? normalize(data)

        : normalize(
            browserData
          ),

    [
      tab,
      data,
      browserData,
      normalize,
    ]

  );

  /* ───────────────── TOTAL ───────────────── */

  const total = useMemo(

    () =>

      entries.reduce(

        (sum, item) =>

          sum + item.value,

        0

      ) || 1,

    [entries]

  );

  /* ───────────────── EMPTY ───────────────── */

  if (!entries.length) {

    return (

      <div
        className="
          relative overflow-hidden
          rounded-[28px]
          border border-white/60
          bg-white/90
          backdrop-blur-xl
          shadow-[0_10px_40px_rgba(0,0,0,0.04)]
          p-8
        "
      >

        <div
          className="
            absolute top-0 right-0
            w-32 h-32
            bg-violet-100/40
            blur-3xl
            rounded-full
          "
        />

        <div
          className="
            flex flex-col
            items-center
            justify-center
            py-10
            relative z-10
          "
        >

          <div
            className="
              w-16 h-16
              rounded-2xl
              bg-gradient-to-br
              from-violet-100
              to-indigo-100
              flex items-center justify-center
              mb-5
            "
          >

            <Globe
              className="
                w-7 h-7
                text-violet-600
              "
            />

          </div>

          <h3
            className="
              text-lg font-bold
              text-gray-900
            "
          >
            No Analytics Yet
          </h3>

          <p
            className="
              text-sm text-gray-500
              mt-2 text-center
            "
          >
            Device and browser
            analytics will appear
            here.
          </p>

        </div>

      </div>

    );

  }

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

        <div
          className="
            flex items-center
            justify-between
          "
        >

          <div>

            <h2
              className="
                text-[20px]
                font-black
                text-gray-900
                tracking-tight
              "
            >
              Device Analytics
            </h2>

            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              Browser & device
              distribution
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
              shadow-lg
              shadow-violet-200
            "
          >

            <Sparkles
              size={18}
              className="
                text-white
              "
            />

          </div>

        </div>

        {/* TABS */}

        <div
          className="
            mt-6
            inline-flex
            p-1
            rounded-2xl
            bg-gray-100
            gap-1
          "
        >

          {[
            "devices",
            "browsers",
          ].map((t) => (

            <button
              key={t}
              onClick={() =>
                setTab(t)
              }
              className={`
                px-5 py-2.5
                rounded-xl
                text-xs
                font-bold
                transition-all
                duration-300

                ${
                  tab === t

                    ? `
                      bg-white
                      text-gray-900
                      shadow-md
                    `

                    : `
                      text-gray-500
                      hover:text-gray-800
                    `
                }
              `}
            >

              {t === "devices"
                ? "Devices"
                : "Browsers"}

            </button>

          ))}

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

        {entries.map(
          (item, index) => {

            const percent =
              Math.round(

                (
                  item.value /
                  total
                ) * 100

              );

            return (

              <div
                key={`${item.name}-${index}`}
                className="
                  group
                  rounded-2xl
                  border border-gray-100
                  bg-white/70
                  hover:bg-white
                  hover:border-violet-200
                  hover:shadow-xl
                  hover:shadow-violet-100/40
                  transition-all
                  duration-300
                  p-4
                "
              >

                {/* TOP */}

                <div
                  className="
                    flex items-center
                    justify-between
                    mb-4
                  "
                >

                  {/* LEFT */}

                  <div
                    className="
                      flex items-center
                      gap-4
                      min-w-0
                    "
                  >

                    {/* ICON */}

                    <div
                      className="
                        w-12 h-12
                        rounded-2xl
                        bg-gradient-to-br
                        from-gray-50
                        to-violet-50
                        border border-gray-100
                        flex items-center
                        justify-center
                        shadow-sm
                        group-hover:scale-105
                        transition-transform
                      "
                    >

                      {getIcon(
                        item.name
                      )}

                    </div>

                    {/* NAME */}

                    <div
                      className="
                        min-w-0
                      "
                    >

                      <div
                        className="
                          flex items-center
                          gap-2
                        "
                      >

                        <span
                          className="
                            text-sm
                            font-bold
                            text-gray-900
                            truncate
                          "
                        >
                          {item.name}
                        </span>

                        <span
                          className="
                            text-sm
                          "
                        >
                          {getFlag(
                            item.country
                          )}
                        </span>

                      </div>

                      <div
                        className="
                          text-xs
                          text-gray-400
                          mt-1
                        "
                      >
                        {item.value} visitors
                      </div>

                    </div>

                  </div>

                  {/* RIGHT */}

                  <div
                    className="
                      text-right
                    "
                  >

                    <div
                      className="
                        text-lg
                        font-black
                        text-gray-900
                        tabular-nums
                      "
                    >
                      {percent}%
                    </div>

                    <div
                      className="
                        text-[11px]
                        text-gray-400
                        font-medium
                      "
                    >
                      Usage
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
                      transition-all
                      duration-1000
                    "
                    style={{

                      width:
                        `${percent}%`,

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
          flex items-center
          justify-between
        "
      >

        <div>

          <p
            className="
              text-xs
              text-gray-400
              uppercase
              tracking-widest
              font-semibold
            "
          >
            Total Visitors
          </p>

          <h3
            className="
              text-2xl
              font-black
              text-gray-900
              mt-1
            "
          >
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

export default React.memo(
  DeviceCard
);