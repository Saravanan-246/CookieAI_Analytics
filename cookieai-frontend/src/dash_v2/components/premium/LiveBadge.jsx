import { colors, radii } from "../../styles/theme";

export default function LiveBadge({ label = "Live", connected = true }) {
  if (!connected) {
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-tight text-gray-400 border border-gray-100 bg-gray-50/50"
        style={{ borderRadius: radii.xl }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Offline
      </span>
    );
  }

  return (
    <span 
      className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold tracking-tight text-emerald-600 border border-emerald-100/50 bg-emerald-50/50 backdrop-blur-sm"
      style={{ borderRadius: radii.xl }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </span>
      {label}
    </span>
  );
}

