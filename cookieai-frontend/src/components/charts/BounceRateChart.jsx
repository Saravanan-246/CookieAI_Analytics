import React from "react";
import { motion } from "framer-motion";

const BounceRateChart = ({ data }) => {
  const bounceRate = Math.min(Math.max(data?.bounceRate || 0, 0), 100);

  const getColor = () => {
    if (bounceRate < 40) return "text-emerald-500";
    if (bounceRate < 70) return "text-amber-500";
    return "text-red-500";
  };

  const getStroke = () => {
    if (bounceRate < 40) return "#10b981";
    if (bounceRate < 70) return "#f59e0b";
    return "#ef4444";
  };

  const getBgStroke = () => "#eef2f7"; // softer background ring

  const getStatus = () => {
    if (bounceRate < 40) return "Great engagement";
    if (bounceRate < 70) return "Average performance";
    return "Needs improvement";
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (bounceRate / 100) * circumference;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">

      {/* HEADER */}
      <div className="w-full mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Bounce Rate
        </p>
      </div>

      {/* CHART */}
      <div className="relative flex items-center justify-center mb-4">
        <svg width="120" height="120">
          
          {/* Background Ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={getBgStroke()}
            strokeWidth="10"
            fill="none"
          />

          {/* Progress Ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke={getStroke()}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>

        {/* VALUE */}
        <div className="absolute flex flex-col items-center">
          <p className={`text-2xl font-bold ${getColor()}`}>
            {bounceRate}%
          </p>
          <span className="text-[10px] text-gray-400 font-medium">
            Bounce
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center">
        <p className="text-xs text-gray-500 font-medium">
          {getStatus()}
        </p>
      </div>
    </div>
  );
};

export default BounceRateChart;