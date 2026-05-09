import { radii, shadows, borders } from "../../styles/theme";

export default function GlassPanel({
  children,
  className = "",
  noPadding = false,
  padding = "p-6",
}) {
  return (
    <div
      className={`
        relative overflow-hidden
        backdrop-blur-xl bg-white/70
        transition-all duration-300
        ${noPadding ? "" : padding}
        ${className}
      `}
      style={{
        borderRadius: radii.lg,
        border: borders.glass,
        boxShadow: shadows.md,
      }}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Subtle Inner Glow */}
      <div className="absolute inset-px rounded-[inherit] border border-white/50 pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

