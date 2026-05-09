import { colors, radii, transitions, shadows } from "../../styles/theme";

export default function GradientButton({
  children,
  onClick,
  active = false,
  variant = "ghost", // "ghost" | "brand"
  size = "sm",       // "sm" | "md"
  className = "",
}) {
  const sizes = {
    sm: "h-8 px-3.5 text-[12px]",
    md: "h-9 px-5 text-[13px]",
  };

  const baseStyles = `
    inline-flex items-center justify-center font-bold tracking-tight
    transition-all duration-200 active:scale-[0.96]
    ${sizes[size]} ${className}
  `;

  if (active || variant === "brand") {
    return (
      <button
        onClick={onClick}
        className={baseStyles}
        style={{
          borderRadius: radii.md,
          background: colors.accentViolet,
          color: "#fff",
          boxShadow: shadows.md,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseStyles}
      style={{
        borderRadius: radii.md,
        background: colors.surfaceSub,
        color: colors.textMid,
        border: `1px solid ${colors.border}`,
      }}
    >
      {children}
    </button>
  );
}

