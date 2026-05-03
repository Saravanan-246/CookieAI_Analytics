import React from "react";

const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-50 rounded-xl ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1.8s_infinite]" />
  </div>
);

const SkeletonDashboard = () => {
  return (
    <div className="space-y-6 fade-in">

      {/* WAITING MESSAGE */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="relative">
          <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
          <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-25" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Waiting for first data...</p>
          <p className="text-xs text-gray-400 mt-0.5">Analytics will appear here once your site receives its first visit</p>
        </div>
      </div>

      {/* HERO SKELETON */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <ShimmerBlock className="h-4 w-24 mb-2" />
            <ShimmerBlock className="h-3 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-12 w-20 rounded-xl" />
            <ShimmerBlock className="h-12 w-20 rounded-xl hidden sm:block" />
            <ShimmerBlock className="h-12 w-20 rounded-xl hidden md:block" />
          </div>
        </div>
      </div>

      {/* KPI SKELETON */}
      <div>
        <ShimmerBlock className="h-3 w-20 mb-3 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <ShimmerBlock className="h-3 w-20 mb-3" />
              <ShimmerBlock className="h-7 w-16 mb-2" />
              <ShimmerBlock className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* CHART + INSIGHTS SKELETON (2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <ShimmerBlock className="h-4 w-28 mb-2" />
              <ShimmerBlock className="h-3 w-36" />
            </div>
            <ShimmerBlock className="h-7 w-20 rounded-lg" />
          </div>
          <ShimmerBlock className="h-[320px] w-full rounded-xl" />
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <ShimmerBlock className="h-3 w-24 mb-5" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <ShimmerBlock className="w-7 h-7 rounded-md shrink-0" />
                <ShimmerBlock className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAGES + ACTIVITY SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <ShimmerBlock className="h-4 w-24 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j}>
                  <div className="flex items-center justify-between mb-1.5">
                    <ShimmerBlock className="h-3 w-[55%]" />
                    <ShimmerBlock className="h-3 w-8" />
                  </div>
                  <ShimmerBlock className="h-1 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* COUNTRIES + DEVICES SKELETON (1/3 + 2/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <ShimmerBlock className="h-3 w-20 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, j) => (
              <div key={j}>
                <div className="flex justify-between mb-1">
                  <ShimmerBlock className="h-3 w-24" />
                  <ShimmerBlock className="h-3 w-8" />
                </div>
                <ShimmerBlock className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <ShimmerBlock className="h-3 w-16 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-1">
                      <ShimmerBlock className="h-3 w-20" />
                      <ShimmerBlock className="h-3 w-6" />
                    </div>
                    <ShimmerBlock className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE STRIP SKELETON */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="w-2 h-2 rounded-full" />
          <ShimmerBlock className="h-3 w-24" />
          <div className="flex -space-x-2 ml-2">
            {[...Array(3)].map((_, i) => (
              <ShimmerBlock key={i} className="w-6 h-6 rounded-full border-2 border-white" />
            ))}
          </div>
        </div>
        <ShimmerBlock className="h-3 w-10" />
      </div>
    </div>
  );
};

export default SkeletonDashboard;
