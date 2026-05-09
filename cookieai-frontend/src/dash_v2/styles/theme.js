/* ─────────────────────────────────────────────────────────────
   DashboardV2 — Design Tokens
   Inspired by: Linear, Vercel, Stripe, Warp
───────────────────────────────────────────────────────────── */

export const colors = {
  /* Base */
  surface:    "#ffffff",
  surfaceSub: "#fbfbfc",
  surfaceDim: "#f3f4f6",
  border:     "rgba(0, 0, 0, 0.06)",
  borderSoft: "rgba(0, 0, 0, 0.03)",
  borderDark: "rgba(0, 0, 0, 0.1)",

  /* Text */
  text:       "#09090b",
  textMid:    "#4b5563",
  textMuted:  "#71717a",
  textDim:    "#a1a1aa",

  /* Brand */
  violet:     "#7c3aed",
  violetMid:  "#8b5cf6",
  violetSoft: "#f5f3ff",
  blue:       "#3b82f6",
  blueSoft:   "#eff6ff",
  
  /* Accent Gradients */
  accentViolet: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
  accentBlue:   "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
  accentEmerald: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
};

export const gradients = {
  violetSubtle: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
  blueSubtle:   "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
  glass:        "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)",
  glassDark:    "linear-gradient(135deg, rgba(15, 17, 23, 0.8) 0%, rgba(24, 28, 38, 0.7) 100%)",
  shimmer:      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
};

export const shadows = {
  sm:   "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md:   "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg:   "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl:   "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  card: "0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02), 0 12px 24px rgba(0, 0, 0, 0.03)",
  cardHover: "0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.04)",
  glowViolet: "0 0 20px rgba(124, 58, 237, 0.15)",
  glowBlue:   "0 0 20px rgba(59, 130, 246, 0.15)",
};

export const borders = {
  default: `1px solid ${colors.border}`,
  soft:    `1px solid ${colors.borderSoft}`,
  glass:   "1px solid rgba(255, 255, 255, 0.2)",
};

export const radii = {
  sm:  "8px",
  md:  "12px",
  lg:  "16px",
  xl:  "24px",
};

export const transitions = {
  default: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  slow:    "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  bounce:  "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
};

