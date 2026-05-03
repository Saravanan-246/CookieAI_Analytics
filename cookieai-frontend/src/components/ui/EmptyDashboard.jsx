import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight, Sparkles } from "lucide-react";

const EmptyDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-sm w-full shadow-sm text-center transition-all duration-300">

        {/* ICON */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 bg-indigo-100 rounded-2xl animate-pulse opacity-50" />
          <div className="relative w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          No site selected
        </h2>

        {/* SUBTITLE */}
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Select or create a site to start viewing your analytics data in real-time.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate("/sites")}
          className="w-full flex items-center justify-center gap-2 h-11 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group"
        >
          Go to Sites
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* HINT */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <Sparkles size={10} className="text-gray-300" />
          <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">
            Analytics starts instantly
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyDashboard;
