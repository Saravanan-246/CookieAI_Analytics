import React from "react";

const Skeleton = ({
  className = "",
  variant = "rect",
  width,
  height,
  lines = 1,
}) => {
  const base =
    "relative overflow-hidden bg-gray-200";

  const shimmer =
    "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-[shimmer_1.4s_infinite]";

  const variants = {
    text: "h-4 rounded",
    rect: "rounded-lg",
    circle: "rounded-full",
  };

  const style = {
    width: width || "100%",
    height:
      height ||
      (variant === "text" ? "1rem" : undefined),
  };

  /* ---------- MULTI LINE TEXT ---------- */
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${base} ${shimmer} ${variants.text} ${className}`}
            style={{
              width: i === lines - 1 ? "70%" : "100%",
              height: height || "1rem",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${base} ${shimmer} ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;