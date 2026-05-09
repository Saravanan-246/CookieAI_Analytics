import { colors } from "../../styles/theme";

export default function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  className = "",
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-gray-900 tracking-[-0.01em]">
            {title}
          </h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

