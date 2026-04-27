import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: false,
      reconnection: true,
    });

    this.socket.on("connect", () => {
      console.log("🟢 Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    return this.socket;
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  on(event, cb) {
    this.socket?.on(event, cb);
  }

  off(event, cb) {
    this.socket?.off(event, cb);
  }

  joinSite(siteId) {
    this.emit("join-site", siteId); // 🔥 match backend
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new SocketService();