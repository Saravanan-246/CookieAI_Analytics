import { motion } from "framer-motion";

export default function AnalyticsPreviewList({ items, renderRow }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <motion.div
          key={item.id || item._id || index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          {renderRow(item, index)}
        </motion.div>
      ))}
    </div>
  );
}