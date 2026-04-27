import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { 
  ChevronDown, 
  Calendar, 
  Globe, 
  Zap, 
  GitBranch, 
  ShieldCheck,
  Check
} from "lucide-react";

/* ───────────────────────────────────────────────
   CONSTANTS (Outside to prevent re-creation)
─────────────────────────────────────────────── */
const RANGES = [
  { label: "Last 24 hours", value: "24h", icon: <Zap className="w-3.5 h-3.5" /> },
  { label: "Last 7 days", value: "7d", icon: <Calendar className="w-3.5 h-3.5" /> },
  { label: "Last 30 days", value: "30d", icon: <Calendar className="w-3.5 h-3.5" /> },
  { label: "Last 3 months", value: "90d", disabled: true, icon: <Calendar className="w-3.5 h-3.5" /> },
  { label: "Last 12 months", value: "365d", disabled: true, icon: <Calendar className="w-3.5 h-3.5" /> },
];

const ENVS = [
  { 
    label: "All Environments", 
    value: "all", 
    icon: <Globe className="w-4 h-4" />,
    color: "text-gray-500",
    bg: "bg-gray-50"
  },
  { 
    label: "Production", 
    value: "production", 
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500"
  },
  { 
    label: "Preview", 
    value: "preview", 
    icon: <GitBranch className="w-4 h-4" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    dot: "bg-indigo-500"
  },
];

/* ───────────────────────────────────────────────
   COMPONENT
─────────────────────────────────────────────── */
const Filters = ({ 
  range, 
  setRange, 
  environment, 
  setEnvironment, 
  loading 
}) => {
  // Use a single state to ensure only one dropdown is open at a time
  const [openDropdown, setOpenDropdown] = useState(null); // 'range' | 'env' | null
  
  const rangeRef = useRef(null);
  const envRef = useRef(null);

  /* ── Click Outside ── */
  useEffect(() => {
    const handleClick = (e) => {
      // Check if click was outside both dropdown containers
      const rangeOutside = rangeRef.current && !rangeRef.current.contains(e.target);
      const envOutside = envRef.current && !envRef.current.contains(e.target);
      
      if (rangeOutside && envOutside) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Handlers (useCallback for stability) ── */
  const toggleRange = useCallback((e) => {
    e.preventDefault();
    if (loading) return;
    setOpenDropdown(prev => prev === 'range' ? null : 'range');
  }, [loading]);

  const toggleEnv = useCallback((e) => {
    e.preventDefault();
    if (loading) return;
    setOpenDropdown(prev => prev === 'env' ? null : 'env');
  }, [loading]);

  const handleSelectRange = useCallback((val) => {
    setOpenDropdown(null);
    if (range !== val) {
      setRange(val);
    }
  }, [range, setRange]);

  const handleSelectEnv = useCallback((val) => {
    setOpenDropdown(null);
    if (environment !== val) {
      setEnvironment(val);
    }
  }, [environment, setEnvironment]);

  /* ── Derived State ── */
  const currentRange = useMemo(() => 
    RANGES.find(r => r.value === range) || RANGES[1], 
  [range]);

  const currentEnv = useMemo(() => 
    ENVS.find(e => e.value === environment) || ENVS[0], 
  [environment]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      
      {/* 🌍 ENVIRONMENT SELECTOR */}
      <div className="relative" ref={envRef}>
        <button
          onClick={toggleEnv}
          disabled={loading}
          className="group flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <div className={`p-1 rounded-md ${currentEnv.bg} ${currentEnv.color}`}>
            {currentEnv.icon}
          </div>
          <span className="flex items-center gap-2">
            {currentEnv.label}
            {currentEnv.dot && (
              <span className={`w-1.5 h-1.5 rounded-full ${currentEnv.dot} animate-pulse`} />
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openDropdown === 'env' ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === 'env' && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200 ring-4 ring-black/5">
            <div className="px-3 py-2 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Select Environment
            </div>
            <div className="space-y-1">
              {ENVS.map((e) => (
                <button
                  key={e.value}
                  onMouseDown={(e) => e.preventDefault()} // CRITICAL: Prevent blur before click
                  onClick={() => handleSelectEnv(e.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    environment === e.value 
                      ? "bg-gray-50 text-gray-900" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${e.bg} ${e.color}`}>
                      {e.icon}
                    </div>
                    {e.label}
                  </div>
                  {environment === e.value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📅 RANGE SELECTOR */}
      <div className="relative" ref={rangeRef}>
        <button
          onClick={toggleRange}
          disabled={loading}
          className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          {currentRange.label}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openDropdown === 'range' ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === 'range' && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200 ring-4 ring-black/5">
            <div className="px-3 py-2 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Time Range
            </div>
            <div className="space-y-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  disabled={r.disabled}
                  onMouseDown={(e) => e.preventDefault()} // CRITICAL: Prevent blur before click
                  onClick={() => handleSelectRange(r.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    r.disabled 
                      ? "opacity-40 cursor-not-allowed grayscale" 
                      : range === r.value 
                        ? "bg-blue-50 text-blue-600" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-gray-50">
                      {r.icon}
                    </div>
                    {r.label}
                  </div>
                  {r.disabled && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">PRO</span>
                  )}
                  {range === r.value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default memo(Filters);
