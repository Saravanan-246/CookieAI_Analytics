import React from "react";

const BounceRateChart = ({ data }) => {
  const bounceRate = data?.bounceRate || 0;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-4xl font-bold text-gray-900">{bounceRate}%</p>
        <p className="text-sm text-gray-500 mt-1">Bounce Rate</p>
      </div>
    </div>
  );
};

export default BounceRateChart;