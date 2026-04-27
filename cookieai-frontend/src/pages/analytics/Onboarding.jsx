import React, { useMemo, useCallback } from "react";
import { LineChart, Zap, ArrowRight, Code } from "lucide-react";

const Onboarding = ({ onOpenScript }) => {

  /* ===== STABLE HANDLER ===== */
  const handleScript = useCallback(() => {
    if (onOpenScript) onOpenScript();
  }, [onOpenScript]);

  /* ===== STEPS (MEMOIZED) ===== */
  const steps = useMemo(() => [
    {
      id: 1,
      title: "Add Tracking Script",
      desc: "Copy and paste the lightweight snippet into your site's <head>.",
      icon: <Code className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      action: "Get Script",
      onClick: handleScript,
    },
    {
      id: 2,
      title: "Start Collecting Data",
      desc: "Wait for users to visit your site. Events will appear in real-time.",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      action: "View Live Feed",
      onClick: null,
    },
    {
      id: 3,
      title: "View Insights",
      desc: "Analyze traffic, devices, and user behavior patterns.",
      icon: <LineChart className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      action: "Explore Reports",
      onClick: null,
    }
  ], [handleScript]);

  return (
    <div className="py-12">

      {/* HEADER */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">
          Let’s get your insights moving
        </h2>

        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          You’re a few steps away from real-time analytics. Set up tracking and start analyzing your data.
        </p>
      </div>

      {/* STEPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-16 flex items-center justify-center gap-4 text-xs text-gray-400">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border-2 border-white bg-gray-100"
            />
          ))}
        </div>
        <span>Trusted by growing teams using CookieAI</span>
      </div>
    </div>
  );
};

/* ===== STEP CARD ===== */
const StepCard = React.memo(({ step }) => {
  const handleClick = useCallback(() => {
    if (step.onClick) step.onClick();
  }, [step]);

  return (
    <div className="group bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col relative">

      {/* ICON */}
      <div className={`p-3 rounded-xl border mb-5 w-fit ${step.color}`}>
        {step.icon}
      </div>

      {/* CONTENT */}
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        {step.title}
      </h3>

      <p className="text-sm text-gray-500 mb-6 flex-grow">
        {step.desc}
      </p>

      {/* ACTION */}
      <button
        onClick={handleClick}
        disabled={!step.onClick}
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition
          ${
            step.onClick
              ? "text-gray-500 hover:text-blue-600"
              : "text-gray-300 cursor-default"
          }
        `}
      >
        {step.action}
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </button>

      {/* NUMBER */}
      <span className="absolute right-4 bottom-2 text-5xl font-bold text-gray-100 pointer-events-none">
        {step.id}
      </span>
    </div>
  );
});

export default Onboarding;