import React from "react";

const COLORS = {
  Desktop: "#6366f1",
  Mobile: "#06b6d4",
  Tablet: "#10b981",
  Unknown: "#9ca3af",
};

const DevicePieChart = ({ data = [] }) => {
  const entries = Array.isArray(data) 
    ? data.map(d => [d.name || d._id, d.value || d.count]).filter(([_, v]) => v > 0)
    : Object.entries(data).filter(([_, v]) => v > 0);

  if (!entries.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No device data
      </div>
    );
  }

  const total = entries.reduce((s, [_, v]) => s + v, 0) || 1;

  let currentAngle = 0;

  const slices = entries.map(([device, value]) => {
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;

    const start = currentAngle;
    const end = currentAngle + angle;

    const startRad = (start * Math.PI) / 180;
    const endRad = (end * Math.PI) / 180;

    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    currentAngle = end;

    return {
      path: `
        M 100 100
        L ${x1} ${y1}
        A 80 80 0 ${largeArc} 1 ${x2} ${y2}
        Z
      `,
      color: COLORS[device] || COLORS.Unknown,
      device,
      value,
      percentage: Math.round(percentage),
    };
  });

  const topDevice = [...entries].sort((a, b) => b[1] - a[1])[0] || [];

  return (
    <div className="space-y-4">
      {/* CHART */}
      <div className="flex justify-center">
        <svg viewBox="0 0 200 200" className="w-40 h-40">
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              className="transition-opacity hover:opacity-80"
            />
          ))}
        </svg>
      </div>

      {/* LEGEND */}
      <div className="space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-sm text-gray-600">{s.device}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {s.value} ({s.percentage}%)
            </span>
          </div>
        ))}
      </div>

      {/* SUMMARY */}
      {topDevice[0] && (
        <div className="text-xs text-gray-500">
          Most traffic from <span className="font-medium text-gray-700">{topDevice[0]}</span>
        </div>
      )}
    </div>
  );
};

export default DevicePieChart;