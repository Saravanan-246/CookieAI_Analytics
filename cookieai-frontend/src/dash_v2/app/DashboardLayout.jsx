import { motion } from "framer-motion";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}