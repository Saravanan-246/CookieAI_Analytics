import { io } from "socket.io-client";

let socket = null;
let currentSite = null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socketService = {

  /* ================= CONNECT ================= */
  connect() {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("🟢 Socket connected:", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected");
      });
    }

    return socket;
  },

  /* ================= JOIN ================= */
  join(siteId) {
    if (!socket || !socket.connected) return;

    // 🔥 avoid duplicate joins
    if (currentSite === siteId) return;

    if (currentSite) {
      socket.emit("leave-site", currentSite);
    }

    socket.emit("join-site", siteId);
    currentSite = siteId;

    console.log("📡 Joined site:", siteId);
  },

  /* ================= LEAVE ================= */
  leave(siteId) {
    if (!socket) return;

    socket.emit("leave-site", siteId);

    if (currentSite === siteId) {
      currentSite = null;
    }
  },

  /* ================= EVENTS ================= */
  on(event, cb) {
    if (!socket) return;
    socket.off(event, cb); // 🔥 prevent duplicate listeners
    socket.on(event, cb);
  },

  off(event, cb) {
    socket?.off(event, cb);
  },

  /* ================= DISCONNECT ================= */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentSite = null;
    }
  },
};

export default socketService;