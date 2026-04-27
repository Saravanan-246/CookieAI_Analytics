import React from "react";
import Button from "../ui/Button";

const PricingCard = ({
  plan,
  billingCycle = "monthly",
  selected = false,
  onSelect,
}) => {
  const {
    name,
    price = 0,
    description,
    features = [],
    excluded = [],
    popular = false,
  } = plan || {};

  /* ---------- PRICE ---------- */
  const monthly = price;
  const yearly = price * 12;

  const displayPrice =
    billingCycle === "monthly" ? monthly : Math.round(yearly / 12);

  const billingText =
    billingCycle === "monthly"
      ? "/month"
      : "/month • billed yearly";

  const savings =
    billingCycle === "yearly"
      ? Math.round(monthly * 12 - yearly)
      : 0;

  return (
    <div
      className={`
        relative flex flex-col h-full
        bg-white rounded-2xl border
        transition-all duration-300
        p-6
        ${selected
          ? "border-indigo-500 ring-1 ring-indigo-200 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
        ${popular ? "scale-[1.03]" : ""}
      `}
    >
      {/* 🔥 POPULAR BADGE */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-semibold tracking-wide px-3 py-1 rounded-full bg-indigo-500 text-white shadow-sm">
            MOST POPULAR
          </span>
        </div>
      )}

      {/* HEADER */}
      <div className="text-center mb-6">
        <h3 className="text-base font-semibold text-gray-900">
          {name}
        </h3>

        {/* PRICE */}
        <div className="mt-3 flex items-end justify-center gap-1">
          <span className="text-3xl font-semibold text-gray-900">
            ${displayPrice}
          </span>
          <span className="text-xs text-gray-500 mb-1">
            {billingText}
          </span>
        </div>

        {/* SAVINGS */}
        {billingCycle === "yearly" && savings > 0 && (
          <p className="text-[11px] text-green-600 mt-1 font-medium">
            Save ${savings}/year
          </p>
        )}

        {description && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* FEATURES */}
      <div className="flex-1 space-y-3 mb-6">
        {features.map((f, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 shrink-0">
              <svg
                className="w-3 h-3 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-600">{f}</span>
          </div>
        ))}

        {excluded.map((f, i) => (
          <div
            key={i}
            className="flex gap-2 items-start opacity-60"
          >
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 shrink-0">
              <span className="text-xs text-gray-400">—</span>
            </div>
            <span className="text-sm text-gray-400 line-through">
              {f}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button
        variant={selected ? "secondary" : "primary"}
        className="w-full"
        onClick={onSelect}
      >
        {selected ? "Current Plan" : "Choose Plan"}
      </Button>

      {/* FOOTNOTE */}
      {popular && (
        <p className="text-[11px] text-center text-gray-400 mt-3">
          Best value for growing teams
        </p>
      )}
    </div>
  );
};

export default PricingCard;