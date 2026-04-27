import React from "react";
import { cn } from "../../utils/cn";

const Card = ({
  children,
  className = "",
  padding = "md",
  elevated = false,
  loading = false,
  header,
  footer,
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={cn(
      elevated ? "card-elevated" : "card",
      className
    )}>
      
      {/* HEADER */}
      {header && (
        <div className="px-6 pt-6 pb-3 border-b border-gray-100">
          {header}
        </div>
      )}

      {/* BODY */}
      <div className={cn("relative", paddingStyles[padding])}>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* FOOTER */}
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;