import { useEffect, useState } from "react";
import { socketService } from "../../services/socket.service";

const LiveEvents = ({ siteId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- HELPERS ---------- */
  const timeAgo = (t) => {
    const diff = Math.floor((Date.now() - t) / 1000);
    if (diff < 10) return "just now";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  };

  /* ---------- SOCKET ---------- */
  useEffect(() => {
    if (!siteId) return;

    socketService.connect();

    const handleEvent = (e) => {
      const formatted = {
        id: Math.random(),
        type: e.type === "page_view" ? "VIEW" : e.type?.toUpperCase() || "EVENT",
        user: e.device || "User",
        page: e.path || "/",
        country: e.country || "??",
        timestamp: Date.now(),
      };

      setEvents((prev) => [formatted, ...prev].slice(0, 15));
      setLoading(false);
    };

    socketService.on("live:event", handleEvent);
    const timer = setTimeout(() => setLoading(false), 1500);

    return () => {
      clearTimeout(timer);
      socketService.off("live:event", handleEvent);
    };
  }, [siteId]);

  return (
    <div className="flex flex-col h-full font-mono">
      {/* CONTENT */}
      <div className="flex-grow space-y-4 px-8 py-4 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="text-gray-600 text-xs animate-pulse">Establishing secure link...</div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-30 grayscale">
            <div className="w-10 h-10 border border-dashed border-gray-600 rounded-full flex items-center justify-center text-xl">
              📡
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Waiting for uplink...</p>
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="group flex items-start gap-4 animate-in slide-in-from-right-4 duration-500"
            >
              <div className="mt-1 flex flex-col items-center">
                <div className={`w-1 h-1 rounded-full ${e.type === "VIEW" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-blue-500"}`} />
                <div className="w-px h-full bg-gray-800 group-last:hidden mt-1" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black tracking-tighter ${e.type === "VIEW" ? "text-emerald-400" : "text-blue-400"}`}>
                    {e.type}
                  </span>
                  <span className="text-[10px] text-gray-600 font-bold">{timeAgo(e.timestamp)}</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-tight">
                  <span className="text-gray-500">[{e.country}]</span> {e.page}
                </p>
                <div className="text-[9px] text-gray-600 truncate opacity-0 group-hover:opacity-100 transition-opacity">
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