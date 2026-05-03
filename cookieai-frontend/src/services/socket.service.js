import { io } from "socket.io-client";

/**
 * Singleton Socket Service - Production-level implementation
 * - Single connection instance across app
 * - Proper cleanup and lifecycle management
 * - Prevents duplicate listeners and joins
 * - Auto-reconnect with exponential backoff
 */

let socket = null;
let currentSiteId = null;
let connectionAttempts = 0;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const SOCKET_OPTIONS = {
  transports: ["websocket"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
};

let reconnectCallbacks = [];

export const socketService = {
  /**
   * Get or create socket connection (Singleton pattern)
   * Only creates ONE connection instance
   */
  connect() {
    // ✅ Reuse existing connection
    if (socket?.connected) {
      return socket;
    }

    // ✅ Prevent multiple simultaneous connection attempts
    if (socket?.connecting) {
      return socket;
    }

    // ✅ Create connection only once
    socket = io(SOCKET_URL, SOCKET_OPTIONS);

    // ✅ Connection established
    socket.on("connect", () => {
      console.log(`[Socket] ✅ Connected: ${socket.id}`);
      connectionAttempts = 0;

      // ✅ Auto-rejoin previous site if connection dropped
      if (currentSiteId) {
        console.log(`[Socket] 🔄 Rejoining site: ${currentSiteId}`);
        socket.emit("join-site", currentSiteId);
      }
    });

    // ✅ Connection lost
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] ❌ Disconnected: ${reason}`);
      // If the server dropped us, force reconnect
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    // ✅ Successful reconnect — notify listeners
    socket.io.on("reconnect", (attempt) => {
      console.log(`[Socket] 🔄 Reconnected after ${attempt} attempts`);
      reconnectCallbacks.forEach(cb => { try { cb(); } catch {} });
    });

    // ✅ Connection error
    socket.on("connect_error", (err) => {
      console.warn(`[Socket] ⚠️ Error: ${err.message}`);
    });

    return socket;
  },

  /**
   * Join site room - Prevents duplicate joins
   * @param {string} siteId - Site identifier
   */
  join(siteId) {
    if (!siteId || !socket) {
      return;
    }

    // ✅ Skip if already joined to this site
    if (currentSiteId === siteId) {
      return;
    }

    // ✅ Leave previous site room if any
    if (currentSiteId) {
      socket.emit("leave-site", currentSiteId);
    }

    // ✅ Join new site room
    socket.emit("join-site", siteId);
    currentSiteId = siteId;

    console.log(`[Socket] 📡 Joined room: ${siteId}`);
  },

  /**
   * Leave site room
   * @param {string} siteId - Site identifier
   */
  leave(siteId) {
    if (!siteId || !socket) {
      return;
    }

    socket.emit("leave-site", siteId);

    if (currentSiteId === siteId) {
      currentSiteId = null;
    }

    console.log(`[Socket] 📡 Left room: ${siteId}`);
  },

  /**
   * Register event listener - Prevents duplicate listeners
   * Automatically removes old listener before adding new one
   * @param {string} event - Event name
   * @param {Function} cb - Callback function
   */
  on(event, cb) {
    if (!socket) {
      return;
    }

    // ✅ Remove old listener to prevent duplicates
    socket.off(event);
    // ✅ Add new listener
    socket.on(event, cb);
  },

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} cb - Callback function (optional)
   */
  off(event, cb) {
    if (!socket) {
      return;
    }
    socket.off(event, cb);
  },

  /**
   * Get socket instance (for advanced usage)
   * @returns {Object} Socket instance
   */
  getInstance() {
    return this.connect();
  },

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return socket?.connected ?? false;
  },

  /**
   * Force a reconnect (useful after long disconnect)
   */
  forceReconnect() {
    if (socket) {
      socket.disconnect();
      socket.connect();
      console.log("[Socket] 🔄 Force reconnect triggered");
    }
  },

  /**
   * Register a callback for reconnect events
   * @param {Function} cb - Callback on reconnect
   * @returns {Function} Unsubscribe function
   */
  onReconnect(cb) {
    reconnectCallbacks.push(cb);
    return () => {
      reconnectCallbacks = reconnectCallbacks.filter(fn => fn !== cb);
    };
  },

  /**
   * Clean disconnect - Cleanup all resources
   */
  disconnect() {
    if (!socket) {
      return;
    }

    // ✅ Leave current room
    if (currentSiteId) {
      socket.emit("leave-site", currentSiteId);
    }

    // ✅ Remove all listeners
    socket.removeAllListeners();

    // ✅ Disconnect socket
    socket.disconnect();

    // ✅ Reset state
    socket = null;
    currentSiteId = null;

    console.log("[Socket] 🔌 Disconnected and cleaned up");
  },

  /**
   * Get current site ID
   * @returns {string|null} Current site ID
   */
  getCurrentSiteId() {
    return currentSiteId;
  },
};

export default socketService;