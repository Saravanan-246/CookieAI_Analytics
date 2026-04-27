import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import PricingCard from "../../components/billing/PricingCard";
import Skeleton from "../../components/ui/Skeleton";

const Billing = () => {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (planId) => {
    if (processing || planId === selectedPlan) return;

    // Clean UI: Remove text selection blue highlight
    if (window.getSelection) window.getSelection().removeAllRanges();

    setProcessing(true);
    
    // Simulate API Call
    setTimeout(() => {
      setSelectedPlan(planId);
      setProcessing(false);
    }, 800);
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      description: "Perfect for small projects",
      features: ["1 Website", "10k visits", "Basic analytics"],
    },
    {
      id: "pro",
      name: "Pro",
      price: billingCycle === "monthly" ? 29 : 290,
      description: "Best for growth",
      features: ["10 Sites", "100k visits", "Realtime", "API"],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: billingCycle === "monthly" ? 99 : 990,
      description: "For scale",
      features: ["Unlimited", "All features", "Priority"],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing</h1>
          <p className="text-sm text-gray-500">Manage your subscription and usage</p>
        </div>

        <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          {["monthly", "yearly"].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                billingCycle === cycle
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* PRICING SECTION WITH SCOPED LOADER */}
      <div className="relative">
        <div 
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${
            processing ? "opacity-50 blur-[1px] pointer-events-none" : "opacity-100"
          }`}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[380px] rounded-2xl" />
              ))
            : plans.map((p) => (
                <PricingCard
                  key={p.id}
                  plan={p}
                  billingCycle={billingCycle}
                  selected={selectedPlan === p.id}
                  onSelect={() => handleSelect(p.id)}
                />
              ))}
        </div>

        {/* MODERN CENTERED MINI-LOADER */}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-gray-200 px-5 py-2.5 rounded-full shadow-xl">
              <div className="w-4 h-4 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-sm font-semibold text-gray-700">Updating...</span>
            </div>
          </div>
        )}
      </div>

      {/* CURRENT STATUS FOOTER */}
      {!loading && (
        <Card className="border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-1">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Plan</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Tier
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {selectedPlan === "free"
                  ? "$0"
                  : `$${plans.find((p) => p.id === selectedPlan)?.price}`}
                <span className="text-sm font-normal text-gray-500">
                  /{billingCycle === "monthly" ? "mo" : "yr"}
                </span>
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Billing;