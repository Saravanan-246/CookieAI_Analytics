import { useEffect, useState, useRef } from "react";
import { socketService } from "../../services/socket.service";

const LiveEvents = ({ siteId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const seen = useRef(new Set());

  /* ---------- HELPERS ---------- */
  const timeAgo = (t) => {
    const diff = Math.floor((Date.now() - t) / 1000);
    if (diff < 10) return "just now";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  };

  useEffect(() => {
    if (!siteId) return;

    socketService.connect();
    socketService.join(siteId);

    /* 🔥 REAL EVENT (from backend) */
    const handleVisitor = (e) => {
      if (!e) return;

      const id =
        e.sessionId + "_" + (e.path || "/") + "_" + (e.time || Date.now());

      if (seen.current.has(id)) return;
      seen.current.add(id);

      const formatted = {
        id,
        type: "VIEW",
        user: e.device || "User",
        page: e.path || "/",
        country: e.country || "??",
        timestamp: new Date(e.time || Date.now()).getTime(),
      };

      setEvents((prev) => [formatted, ...prev].slice(0, 15));
      setLoading(false);
    };

    /* 🔥 SUBSCRIBE */
    socketService.on("visitor-online", handleVisitor);

    const timer = setTimeout(() => setLoading(false), 1200);

    /* ---------- CLEANUP ---------- */
    return () => {
      clearTimeout(timer);
      socketService.off("visitor-online", handleVisitor);
      seen.current.clear();
    };
  }, [siteId]);

  return (
    <div className="flex flex-col h-full font-mono">
      {/* CONTENT */}
      <div className="flex-grow space-y-4 px-6 py-4 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="text-gray-500 text-xs animate-pulse">
            Establishing secure link...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-30 grayscale">
            <div className="w-10 h-10 border border-dashed border-gray-400 rounded-full flex items-center justify-center text-xl">
              📡
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Waiting for traffic...
            </p>
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="group flex items-start gap-4 animate-in slide-in-from-right-4 duration-500"
            >
              <div className="mt-1 flex flex-col items-center">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <div className="w-px h-full bg-gray-200 group-last:hidden mt-1" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-tighter text-emerald-500">
                    VIEW
                  </span>

                  <span className="text-[10px] text-gray-400 font-bold">
                    {timeAgo(e.timestamp)}
                  </span>
                </div>

                <p className="text-[11px] text-gray-700 leading-tight">
                  <span className="text-gray-400">[{e.country}]</span> {e.page}
                </p>

                <div className="text-[9px] text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {e.user}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveEvents;