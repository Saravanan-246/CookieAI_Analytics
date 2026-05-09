import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const EmptyDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[78vh] flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-5xl text-center">

        {/* IMAGE */}
        <img
          src="/create.png"
          alt="Create Project"
          className="w-full max-w-[460px] mx-auto object-contain mb-6 select-none"
        />

        {/* LABEL */}
        <p className="text-violet-600 font-semibold text-sm uppercase tracking-[0.25em] mb-4">
          CookieAI Workspace
        </p>

        {/* TITLE */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.92] text-gray-900">

          Create Your First

          <span className="block text-violet-600 mt-2">
            Analytics Project
          </span>

        </h1>

        {/* DESCRIPTION */}
        <p className="mt-6 text-lg md:text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto">

          Monitor realtime visitors, sessions,
          countries, devices, and AI-powered
          insights with CookieAI.

        </p>

        {/* BUTTON */}
        <div className="pt-8">

          <button
            onClick={() => navigate("/sites")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 text-white text-lg font-semibold hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-violet-200"
          >

            <Plus size={18} />

            Create Project

          </button>

        </div>

      </div>

    </div>
  );
};

export default EmptyDashboard;