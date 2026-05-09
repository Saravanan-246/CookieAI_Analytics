import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import {
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

import CardWrapper from "../common/CardWrapper";
import EmptyState from "../common/EmptyState";

/* COLORS */
const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
];

/* ================= ICON ================= */

const getDeviceIcon = (name) => {
  const value =
    name?.toLowerCase() || "";

  if (value.includes("mobile")) {
    return (
      <Smartphone
        size={14}
        className="text-violet-500"
      />
    );
  }

  if (value.includes("tablet")) {
    return (
      <Tablet
        size={14}
        className="text-fuchsia-500"
      />
    );
  }

  return (
    <Monitor
      size={14}
      className="text-indigo-500"
    />
  );
};

/* ================= TOOLTIP ================= */

const CustomTooltip = ({
  active,
  payload,
}) => {

  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const item = payload[0];

  return (
    <div
      className="
        bg-white
        border border-gray-200

        rounded-xl

        px-3 py-2

        shadow-lg
      "
    >

      <p
        className="
          text-xs
          text-gray-500
          mb-1
        "
      >
        {item.name}
      </p>

      <p
        className="
          text-sm
          font-semibold
          text-gray-900
        "
      >
        {(item.value ?? 0).toLocaleString()}
      </p>

    </div>
  );
};

export default function DeviceChart({
  data = [],
  loading = false,
}) {

  /* SAFE DATA */

  const safeData = Array.isArray(data)
    ? data
    : [];

  const total = safeData.reduce(

    (sum, d) =>

      sum +
      (
        d?.value ?? 0
      ),

    0

  );

  const hasData =
    safeData.length > 0 &&
    total > 0;

  return (

    <CardWrapper title="Devices">

      {/* ================= LOADING ================= */}

      {loading ? (

        <div
          className="
            flex items-center
            gap-6

            h-[250px]
          "
        >

          <div
            className="
              w-36 h-36

              rounded-full

              bg-gray-100

              animate-pulse
            "
          />

          <div
            className="
              flex-1
              space-y-4
            "
          >

            {[...Array(4)].map(
              (_, i) => (

                <div
                  key={i}
                  className="
                    flex
                    justify-between
                  "
                >

                  <div
                    className="
                      h-3
                      w-24

                      rounded

                      bg-gray-100

                      animate-pulse
                    "
                  />

                  <div
                    className="
                      h-3
                      w-10

                      rounded

                      bg-gray-100

                      animate-pulse
                    "
                  />

                </div>

              )
            )}

          </div>

        </div>

      ) : !hasData ? (

        /* ================= EMPTY ================= */

        <EmptyState
          title="No device data"
          description="Device insights will appear once users visit your site"
        />

      ) : (

        /* ================= MAIN ================= */

        <div
          className="
            flex flex-col
            lg:flex-row

            items-center

            gap-6
          "
        >

          {/* ================= CHART ================= */}

          <div
            className="
              relative

              w-[170px]
              h-[170px]

              shrink-0
            "
          >

            <ResponsiveContainer>

              <PieChart>

                <Pie
                  data={safeData}
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >

                  {safeData.map(
                    (_, i) => (

                      <Cell
                        key={i}
                        fill={
                          COLORS[
                            i %
                              COLORS.length
                          ]
                        }
                      />

                    )
                  )}

                </Pie>

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

              </PieChart>

            </ResponsiveContainer>

            {/* CENTER */}

            <div
              className="
                absolute inset-0

                flex flex-col
                items-center
                justify-center
              "
            >

              <p
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                "
              >
                {total.toLocaleString()}
              </p>

              <span
                className="
                  text-xs
                  text-gray-400
                  mt-1
                "
              >
                Total Devices
              </span>

            </div>

          </div>

          {/* ================= LIST ================= */}

          <div
            className="
              flex-1
              w-full

              space-y-3

              max-h-[220px]
              overflow-y-auto

              pr-1
            "
          >

            {safeData.map(
              (d, i) => {

                const value =
                  d?.value ?? 0;

                const percent = total

                  ? (
                      (
                        value /
                        total
                      ) * 100
                    ).toFixed(1)

                  : "0.0";

                return (

                  <div

                    key={i}

                    className="
                      p-3

                      rounded-2xl

                      border border-gray-100

                      bg-gray-50/50

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
                          gap-3
                        "
                      >

                        <div
                          className="
                            w-8 h-8

                            rounded-xl

                            bg-white

                            border border-gray-100

                            flex items-center
                            justify-center
                          "
                        >

                          {getDeviceIcon(
                            d?.name
                          )}

                        </div>

                        <div>

                          <p
                            className="
                              text-sm
                              font-medium
                              text-gray-800
                            "
                          >
                            {d?.name ||
                              "Unknown"}
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-gray-400
                            "
                          >
                            {percent}%
                            traffic
                          </p>

                        </div>

                      </div>

                      {/* RIGHT */}

                      <div
                        className="
                          text-right
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-bold
                            text-gray-900
                          "
                        >
                          {value.toLocaleString()}
                        </p>

                        <p
                          className="
                            text-[11px]
                            text-gray-400
                          "
                        >
                          visitors
                        </p>

                      </div>

                    </div>

                    {/* BAR */}

                    <div
                      className="
                        h-1.5
                        w-full

                        rounded-full

                        bg-gray-100
                        overflow-hidden
                      "
                    >

                      <div
                        className="
                          h-full
                          rounded-full
                        "
                        style={{

                          width:
                            `${percent}%`,

                          background:
                            `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, #8b5cf6)`,

                        }}
                      />

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

      )}

    </CardWrapper>
  );
}