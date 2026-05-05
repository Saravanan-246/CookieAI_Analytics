import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ViewMore({ open, onClose, pages = [] }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // click outside closes
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()} // prevent close on inside click
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                All Pages
              </h3>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {pages.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">
                  No pages available
                </div>
              ) : (
                pages.map((item, i) => (
                  <div
                    key={`${item.path}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <span className="text-sm text-gray-800 truncate pr-4">
                      {item.path || "/"}
                    </span>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-[10px] text-gray-400 uppercase">
                          Visitors
                        </div>
                        <div className="font-medium text-gray-900">
                          {item.visitors}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-gray-400 uppercase">
                          Views
                        </div>
                        <div className="font-medium text-gray-900">
                          {item.pageViews}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}