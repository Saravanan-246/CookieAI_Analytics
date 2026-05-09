import { useState, useRef } from "react";
import { shadows, transitions, radii } from "../../styles/theme";

export default function GlowCard({
  children,
  className = "",
  glowColor = "rgba(124,58,237,0.12)",
  noPadding = false,
  padding = "p-6",
  onClick,
}) {
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={`
        relative overflow-hidden bg-white border border-black/[0.03]
        transition-all duration-500 ease-out
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        ${noPadding ? "" : padding}
        ${className}
      `}
      style={{
        borderRadius: radii.lg,
        boxShadow: hovered ? shadows.cardHover : shadows.card,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

