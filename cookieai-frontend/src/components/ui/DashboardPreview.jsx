import React from "react";
import { Eye, Users, Layout, TrendingDown } from "lucide-react";
import KpiCard from "../analytics/KpiCard";
import TrafficChart from "../charts/TrafficChart";
import TopCountries from "../charts/TopCountries";

const DashboardPreview = () => {
  const fakeTraffic = [
    { date: "2024-01-01", views: 400 },
    { date: "2024-01-02", views: 600 },
    { date: "2024-01-03", views: 800 },
    { date: "2024-01-04", views: 500 },
    { date: "2024-01-05", views: 900 },
    { date: "2024-01-06", views: 1234 },
  ];

  const fakeCountries = [
    { _id: "US", count: 450 },
    { _id: "GB", count: 230 },
    { _id: "DE", count: 180 },
    { _id: "IN", count: 120 },
    { _id: "FR", count: 80 },
  ];

  return (
    <div className="space-y-8 pointer-events-none select-none">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Page Views" value={1234} icon={Eye} trend={12} />
        <KpiCard label="Sessions" value={542} icon={Layout} trend={8} />
        <KpiCard label="Users" value={123} icon={Users} trend={-3} color="emerald" />
        <KpiCard label="Bounce Rate" value={32} type="percent" icon={TrendingDown} trend={-5} color="amber" />
      </div>

      {/* MAIN CHART */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Traffic Analysis</h2>
        <TrafficChart data={fakeTraffic} />
      </div>

      {/* DISTRIBUTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <TopCountries data={fakeCountries} />
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
           <div className="h-4 w-24 bg-gray-100 rounded mb-4 animate-pulse" />
           <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-gray-50 rounded animate-pulse" />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
