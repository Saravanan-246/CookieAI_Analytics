import React from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Compass,
} from "lucide-react";

import { motion } from "framer-motion";

/* ================= ICONS ================= */

const getBrowserIcon = (browser) => {
  const b = browser?.toLowerCase() || "";

  if (b.includes("chrome")) {
    return (
      <Globe
        size={13}
        className="text-yellow-500"
      />
    );
  }

  if (b.includes("safari")) {
    return (
      <Compass
        size={13}
        className="text-sky-500"
      />
    );
  }

  if (b.includes("firefox")) {
    return (
      <Globe
        size={13}
        className="text-orange-500"
      />
    );
  }

  if (b.includes("edge")) {
    return (
      <Globe
        size={13}
        className="text-cyan-500"
      />
    );
  }

  return (
    <Globe
      size={13}
      className="text-gray-400"
    />
  );
};

const getDeviceIcon = (device) => {
  const d = device?.toLowerCase() || "";

  if (d.includes("mobile")) {
    return (
      <Smartphone
        size={13}
        className="text-violet-500"
      />
    );
  }

  if (d.includes("tablet")) {
    return (
      <Tablet
        size={13}
        className="text-fuchsia-500"
      />
    );
  }

  return (
    <Monitor
      size={13}
      className="text-indigo-500"
    />
  );
};

/* ================= MINI SECTION ================= */

const MiniSection = ({
  title,
  items = [],
  iconFn,
}) => {

  const safeItems = Array.isArray(items)
    ? items
    : [];

  const total = safeItems.reduce(

    (sum, x) =>

      sum +
      (
        x?.count ??
        x?.value ??
        0
      ),

    0

  );

  return (

    <div
      className="
        bg-white
        border border-gray-100

        rounded-2xl

        p-4

        shadow-sm
        hover:shadow-md

        transition-all
        duration-300
      "
    >

      {/* HEADER */}

      <div className="mb-4">

        <h3
          className="
            text-[10px]
            font-semibold
            text-gray-400

            uppercase
            tracking-[0.18em]
          "
        >
          {title}
        </h3>

      </div>

      {/* CONTENT */}

      <div
        className="
          space-y-2.5

          max-h-[170px]
          overflow-y-auto

          pr-1
        "
      >

        {safeItems.length === 0 ? (

          <div
            className="
              flex flex-col
              items-center
              justify-center

              h-[120px]

              rounded-xl

              border border-dashed
              border-gray-200

              bg-gray-50/40
            "
          >

            <p
              className="
                text-xs
                font-medium
                text-gray-400
              "
            >
              No {title.toLowerCase()} yet
            </p>

          </div>

        ) : (

          safeItems.slice(0, 4).map(
            (item, i) => {

              const count =

                item?.count ??
                item?.value ??
                0;

              const percent = total

                ? (
                    (
                      count /
                      total
                    ) * 100
                  ).toFixed(1)

                : "0.0";

              const label =

                item?.name ||

                item?.device ||

                "Unknown";

              return (

                <motion.div

                  key={i}

                  initial={{
                    opacity: 0,
                    y: 8,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  transition={{
                    duration: 0.25,
                    delay:
                      i * 0.04,
                  }}

                  className="
                    p-2.5

                    rounded-xl

                    border border-gray-100

                    bg-gray-50/40

                    hover:bg-violet-50/40
                    hover:border-violet-100

                    transition-all
                    duration-300
                  "
                >

                  {/* TOP */}

                  <div
                    className="
                      flex items-center
                      justify-between

                      mb-2
                    "
                  >

                    {/* LEFT */}

                    <div
                      className="
                        flex items-center
                        gap-2.5

                        min-w-0
                      "
                    >

                      <div
                        className="
                          w-7 h-7

                          rounded-lg

                          bg-white

                          border border-gray-100

                          flex items-center
                          justify-center

                          shrink-0
                        "
                      >

                        {iconFn(label)}

                      </div>

                      <span
                        className="
                          text-[13px]
                          font-medium
                          text-gray-700

                          truncate
                        "
                      >
                        {label}
                      </span>

                    </div>

                    {/* RIGHT */}

                    <div
                      className="
                        flex items-center
                        gap-2

                        shrink-0
                      "
                    >

                      <span
                        className="
                          text-[13px]
                          font-bold
                          text-gray-900
                        "
                      >
                        {count}
                      </span>

                      <span
                        className="
                          text-[10px]
                          text-gray-400

                          w-10
                          text-right
                        "
                      >
                        {percent}%
                      </span>

                    </div>

                  </div>

                  {/* BAR */}

                  <div
                    className="
                      h-1.5
                      w-full

                      bg-gray-100

                      rounded-full
                      overflow-hidden
                    "
                  >

                    <motion.div

                      initial={{
                        width: 0,
                      }}

                      animate={{
                        width:
                          `${percent}%`,
                      }}

                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                      }}

                      className="
                        h-full
                        rounded-full
                      "

                      style={{

                        background:
                          "linear-gradient(90deg,#8b5cf6,#6366f1)",

                      }}
                    />

                  </div>

                </motion.div>

              );

            }
          )

        )}

      </div>

    </div>

  );

};

/* ================= MAIN ================= */

export default function BrowserDeviceMiniCards({
  devices = [],
  browsers = [],
  loading = false,
}) {

  if (loading) {

    return (

      <div
        className="
          grid grid-cols-1
          md:grid-cols-2
          gap-4
        "
      >

        {[...Array(2)].map(
          (_, i) => (

            <div

              key={i}

              className="
                bg-white
                border border-gray-100

                rounded-2xl

                p-4

                animate-pulse

                h-[190px]
              "
            />

          )
        )}

      </div>

    );

  }

  return (

    <div
      className="
        grid grid-cols-1
        md:grid-cols-2
        gap-4
      "
    >

      <MiniSection
        title="Devices"
        items={devices}
        iconFn={getDeviceIcon}
      />

      <MiniSection
        title="Browsers"
        items={browsers}
        iconFn={getBrowserIcon}
      />

    </div>

  );

}