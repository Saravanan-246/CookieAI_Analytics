import React from "react";

const EmptyState = ({
  title = "No data",
  description = "Nothing to show here yet.",
  action,
  icon,
  size = "md",
}) => {
  const sizes = {
    sm: "py-12",
    md: "py-16",
    lg: "py-24",
  };

  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center ${sizes[size]}`}
    >
      {/* ICON */}
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        {icon || (
          <svg
            className="w-7 h-7 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3l-2 2h-2l-2-2H4"
            />
          </svg>
        )}
      </div>

      {/* TITLE */}
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
        {description}
      </p>

      {/* ACTION */}
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;