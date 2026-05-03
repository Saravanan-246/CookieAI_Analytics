import { motion } from "framer-motion";
import StatCard from "./StatCard";
import {
  Eye,
  Layers,
  TrendingDown,
  Activity
} from "lucide-react";

/* ================= SAFE CHANGE ================= */
const getChange = (value, prev = 0) => {
  if (!prev || !value) return null;

  const diff = ((value - prev) / prev) * 100;
  return Number(diff.toFixed(1));
};

export default function KpiGrid({ data = {}, loading = false }) {
  /* ================= SAFE DATA ================= */
  const pageViews = Number(data?.pageViews) || 0;
  const sessions = Number(data?.sessions || data?.totalVisitors) || 0;
  const activeUsers = Number(data?.activeUsers) || 0;
  const bounceRate = Number(data?.bounceRate) || 0;

  /* ================= STATS ================= */
  const stats = [
    {
      key: "views",
      label: "Page Views",
      value: pageViews,
      icon: <Eye size={16} />,
      change: getChange(pageViews, data?.prevPageViews),
    },
    {
      key: "sessions",
      label: "Sessions",
      value: sessions,
      icon: <Layers size={16} />,
      change: getChange(sessions, data?.prevSessions),
    },
    {
      key: "active",
      label: "Active Users",
      value: activeUsers,
      icon: <Activity size={16} />,
      change: null, // real-time → no % change
    },
    {
      key: "bounce",
      label: "Bounce Rate",
      value: bounceRate,
      icon: <TrendingDown size={16} />,
      change: getChange(bounceRate, data?.prevBounceRate),
      isPercentage: true,
    },
  ];

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="
              h-28 bg-gray-50 border border-gray-100
              rounded-2xl animate-pulse
            "
          />
        ))}
      </div>
    );
  }

  /* ================= MAIN ================= */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {stats.map((s) => (
        <StatCard
          key={s.key}
          label={s.label}
          value={s.value}
          icon={s.icon}
          change={s.change}
          isPercentage={s.isPercentage}
        />
      ))}
    </motion.div>
  );
}