import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socketService from "../../../services/socket.service";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Navigation
} from "lucide-react";

/* ================= HELPERS ================= */

const getDeviceIcon = (device) => {
  const d = device?.toLowerCase() || "";
  if (d.includes("mobile")) return <Smartphone size={14} />;
  if (d.includes("tablet")) return <Tablet size={14} />;
  return <Monitor size={14} />;
};

const getFlagUrl = (code) => {
  if (!code || ["Unknown", "XX", "LOCAL"].includes(code)) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

/* ================= COMPONENT ================= */

export default function LiveUsers({ siteId, variant = "grid" }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!siteId) return;

    socketService.connect();
    socketService.join(siteId);

    const handleEvent = (event) => {
      if (!event?.sessionId) return;

      setUsers((prev) => {
        const index = prev.findIndex(
          (u) => u.sessionId === event.sessionId
        );

        const updatedUser = {
          sessionId: event.sessionId,
          path: event.path || "/",
          device: event.device || "Desktop",
          country: event.country || "Unknown",
          code: event.code || "XX",
          lastActive: Date.now()
        };

        if (index !== -1) {
          const next = [...prev];
          next[index] = updatedUser;
          return next;
        }

        return [updatedUser, ...prev].slice(0, 9);
      });
    };

    const handleLeave = (sessionId) => {
      setUsers((prev) =>
        prev.filter((u) => u.sessionId !== sessionId)
      );
    };

    socketService.on("liveEvent", handleEvent);
    socketService.on("user_left", handleLeave);

    return () => {
      socketService.off("liveEvent", handleEvent);
      socketService.off("user_left", handleLeave);
    };
  }, [siteId]);

  /* ================= EMPTY ================= */

  if (users.length === 0 && variant === "grid") {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
        <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mb-3 shadow-sm">
          <Globe className="w-5 h-5 text-gray-300 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-gray-500">
          Waiting for live visitors...
        </p>
      </div>
    );
  }

  /* ================= STRIP VIEW ================= */

  if (variant === "strip") {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* LIVE DOT */}
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full border border-white relative z-10" />
          </div>

          <span className="text-xs font-semibold text-gray-900">
            {users.length} {users.length === 1 ? "user" : "users"} online
          </span>

          {/* AVATARS */}
          <div className="flex -space-x-2 ml-2">
            {users.slice(0, 5).map((u) => (
              <div
                key={u.sessionId}
                className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-50 flex items-center justify-center"
              >
                {getFlagUrl(u.code) ? (
                  <img
                    src={getFlagUrl(u.code)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Globe size={10} className="text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        <span className="text-[10px] text-indigo-600 font-semibold">
          LIVE
        </span>
      </div>
    );
  }

  /* ================= GRID VIEW ================= */

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {users.map((user) => (
          <motion.div
            key={user.sessionId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              {/* DEVICE ICON */}
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                {getDeviceIcon(user.device)}
              </div>

              <div className="flex-1 min-w-0">
                {/* COUNTRY */}
                <div className="flex items-center gap-2 mb-1">
                  {getFlagUrl(user.code) ? (
                    <img
                      src={getFlagUrl(user.code)}
                      className="w-4 h-3 rounded"
                    />
                  ) : (
                    <Globe size={12} className="text-gray-300" />
                  )}

                  <span className="text-[11px] text-gray-500 font-medium uppercase">
                    {user.country}
                  </span>
                </div>

                {/* PATH */}
                <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
                  <Navigation size={12} className="text-blue-500" />
                  {user.path}
                </p>

                {/* STATUS */}
                <span className="text-[10px] text-green-600 font-medium mt-1 inline-block">
                  Active now
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}