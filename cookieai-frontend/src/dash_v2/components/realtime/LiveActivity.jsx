import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socketService from "../../../services/socket.service";
import { Globe, Monitor, Smartphone, Tablet, Navigation } from "lucide-react";

/* ================= TIME FORMAT ================= */
const timeAgo = (ts) => {
  if (!ts) return "now";
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 5) return "now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
};

/* ================= DEVICE ICON ================= */
const getDeviceIcon = (device) => {
  const d = device?.toLowerCase() || "";
  if (d.includes("mobile")) return <Smartphone size={12} />;
  if (d.includes("tablet")) return <Tablet size={12} />;
  return <Monitor size={12} />;
};

export default function LiveActivity({ siteId }) {
  const [events, setEvents] = useState([]);
  const seen = useRef(new Set());

  const MAX_EVENTS = 10;

  useEffect(() => {
    if (!siteId) return;

    socketService.connect();
    socketService.join(siteId);

    const onLiveEvent = (e) => {
      if (!e) return;

      const id = e.id || `${e.sessionId}_${e.path}_${e.time || Date.now()}`;
      if (seen.current.has(id)) return;

      seen.current.add(id);

      setEvents((prev) => {
        const next = [{ ...e, _id: id }, ...prev];
        return next.slice(0, MAX_EVENTS);
      });
    };

    const onUserLeft = (sessionId) => {
      setEvents((prev) =>
        prev.filter((ev) => ev.sessionId !== sessionId)
      );
    };

    socketService.on("liveEvent", onLiveEvent);
    socketService.on("user_left", onUserLeft);

    return () => {
      socketService.leave(siteId);
      socketService.off("liveEvent", onLiveEvent);
      socketService.off("user_left", onUserLeft);
      seen.current.clear();
    };
  }, [siteId]);

  /* ================= UI ================= */
  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">

      {/* EMPTY */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[240px] text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
            <Globe className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-xs font-medium text-gray-400">
            Waiting for live activity...
          </p>
        </div>
      ) : (

        <AnimatePresence initial={false}>
          {events.map((e, index) => (
            <motion.div
              key={e._id || index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="
                group
                flex items-center justify-between
                bg-white border border-gray-100
                rounded-xl px-3 py-2.5
                hover:shadow-sm hover:border-gray-200
                transition-all
              "
            >
              {/* LEFT */}
              <div className="flex items-center gap-3 min-w-0">

                {/* DEVICE ICON */}
                <div className="
                  w-8 h-8 rounded-lg
                  bg-gray-50 border border-gray-100
                  flex items-center justify-center
                  text-gray-500 group-hover:text-indigo-600
                  transition
                ">
                  {getDeviceIcon(e.device)}
                </div>

                {/* TEXT */}
                <div className="flex flex-col min-w-0">

                  {/* META */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-0.5">
                    <span className="uppercase font-semibold truncate max-w-[80px]">
                      {e.country || "Unknown"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-indigo-500 font-semibold">
                      {timeAgo(e.time)}
                    </span>
                  </div>

                  {/* PATH */}
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                    <Navigation size={12} className="text-gray-300" />
                    {e.path || "/"}
                  </p>
                </div>
              </div>

              {/* RIGHT LIVE DOT */}
              <div className="relative ml-3">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                <div className="w-2 h-2 bg-emerald-500 rounded-full relative z-10" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

    </div>
  );
}