import { useEffect, useState, memo } from "react";
import { socketService } from "../../services/socket.service";
import { Users, Globe, Monitor, Smartphone, Tablet } from "lucide-react";

const DeviceIcon = ({ device }) => {
  const d = (device || "").toLowerCase();
  if (d.includes("mobile") || d.includes("phone"))
    return <Smartphone className="w-3 h-3" />;
  if (d.includes("tablet"))
    return <Tablet className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
};

const LiveVisitors = ({ siteId }) => {
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    if (!siteId) return;

    socketService.connect();
    socketService.join(siteId);

    /* 🔥 USER JOIN */
    const handleJoin = (visitorData) => {
      if (!visitorData) return;

      setVisitors((prev) => {
        const exists = prev.find((v) => v.id === visitorData.socketId);

        if (exists) {
          return prev.map((v) =>
            v.id === visitorData.socketId
              ? {
                  ...v,
                  page: visitorData.path || v.page,
                  device: visitorData.device || v.device,
                  country: visitorData.country || v.country,
                  lastSeen: Date.now(),
                }
              : v
          );
        }

        return [
          {
            id: visitorData.socketId,
            sessionId: visitorData.sessionId,
            country: visitorData.country || "Unknown",
            page: visitorData.path || "/",
            device: visitorData.device || "Desktop",
            start: Date.now(),
            lastSeen: Date.now(),
          },
          ...prev,
        ].slice(0, 10);
      });
    };

    /* 🔥 USER LEAVE */
    const handleLeave = ({ socketId }) => {
      if (!socketId) return;
      setVisitors((prev) => prev.filter((v) => v.id !== socketId));
    };

    socketService.on("visitor-online", handleJoin);
    socketService.on("visitor-offline", handleLeave);

    return () => {
      socketService.off("visitor-online", handleJoin);
      socketService.off("visitor-offline", handleLeave);
    };
  }, [siteId]);

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Live Activity
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Real-time Feed
            </p>
          </div>
        </div>

        <div className="px-2 py-1 bg-green-50 rounded-full border border-green-100">
          <span className="text-[10px] font-bold text-green-600 uppercase">
            {visitors.length} Active
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {visitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Globe className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              Waiting for traffic...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your live feed will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visitors.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                    {v.country.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                      {v.page}
                    </p>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <DeviceIcon device={v.device} />
                        {v.device}
                      </span>

                      <span className="w-1 h-1 bg-gray-200 rounded-full" />

                      <span className="text-[10px] text-gray-400">
                        {v.country}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                  Live
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
        <span>Live updating</span>
        <span>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default memo(LiveVisitors);