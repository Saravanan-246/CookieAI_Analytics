import { motion } from "framer-motion";

/* ================= BASE SHIMMER ================= */
const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-[shimmer_1.5s_infinite]";

/* ================= LIST LOADER ================= */
export default function Loader({ lines = 3 }) {
  return (
    <div className="space-y-4">
      
      {/* TITLE */}
      <div className={`h-4 w-32 bg-gray-200 rounded-md ${shimmer}`} />

      {/* LINES */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`
            h-10 w-full bg-gray-100 rounded-xl
            ${shimmer}
          `}
        />
      ))}

      {/* STYLE */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

/* ================= KPI / CARD LOADER ================= */
export function CardLoader() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className={`h-3 w-24 bg-gray-200 rounded ${shimmer}`} />
        <div className={`w-10 h-10 bg-gray-100 rounded-xl ${shimmer}`} />
      </div>

      {/* VALUE */}
      <div className="mt-5 space-y-2">
        <div className={`h-7 w-20 bg-gray-200 rounded-md ${shimmer}`} />
        <div className={`h-3 w-28 bg-gray-100 rounded ${shimmer}`} />
      </div>

      {/* FOOTER */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`h-2 w-2 bg-gray-200 rounded-full ${shimmer}`} />
        <div className={`h-3 w-16 bg-gray-100 rounded ${shimmer}`} />
      </div>
    </div>
  );
}

/* ================= DASHBOARD GRID LOADER ================= */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardLoader key={i} />
        ))}
      </div>

      {/* GRAPH */}
      <div className={`h-[260px] bg-gray-100 rounded-2xl ${shimmer}`} />

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`h-[220px] bg-gray-100 rounded-2xl ${shimmer}`} />
        <div className={`h-[220px] bg-gray-100 rounded-2xl ${shimmer}`} />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}