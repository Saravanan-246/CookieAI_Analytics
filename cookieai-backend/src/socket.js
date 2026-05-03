const { Server } = require("socket.io");

let io = null;

const activeUsers = new Map();     // siteId -> Set(socketIds)
const socketSiteMap = new Map();   // socketId -> siteId

/* ================= PERF CACHE ================= */
const lastEmittedPayloads = new Map(); // siteId -> key
const summaryCache = new Map();        // siteId -> { data, timestamp }
const CACHE_TTL = 2000;               // 2s

/* ================= INIT ================= */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN
        ? process.env.SOCKET_CORS_ORIGIN.split(",")
        : ["http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] ✅ Connected: ${socket.id}`);

    /* -------- JOIN -------- */
    socket.on("join-site", (siteId) => {
      if (!siteId) return;

      const room = String(siteId);
      if (socket.rooms.has(room)) return; // 🚫 prevent duplicate join

      const prev = socketSiteMap.get(socket.id);
      if (prev) {
        socket.leave(prev);
        activeUsers.get(prev)?.delete(socket.id);
      }

      socket.join(room);
      socketSiteMap.set(socket.id, room);

      if (!activeUsers.has(room)) {
        activeUsers.set(room, new Set());
      }
      activeUsers.get(room).add(socket.id);

      console.log(`[Socket] 📡 ${socket.id} joined ${room}`);

      io.to(room).emit("visitor-online", {
        socketId: socket.id,
        count: activeUsers.get(room).size,
        timestamp: new Date(),
      });
    });

    /* -------- LEAVE -------- */
    socket.on("leave-site", (siteId) => {
      if (!siteId) return;

      socket.leave(siteId);
      socketSiteMap.delete(socket.id);

      if (activeUsers.has(siteId)) {
        activeUsers.get(siteId).delete(socket.id);

        io.to(siteId).emit("visitor-offline", {
          socketId: socket.id,
          count: activeUsers.get(siteId).size,
          timestamp: new Date(),
        });
      }
    });

    /* -------- DISCONNECT -------- */
    socket.on("disconnect", () => {
      const siteId = socketSiteMap.get(socket.id);

      if (siteId && activeUsers.has(siteId)) {
        activeUsers.get(siteId).delete(socket.id);

        io.to(siteId).emit("visitor-offline", {
          socketId: socket.id,
          count: activeUsers.get(siteId).size,
          timestamp: new Date(),
        });
      }

      socketSiteMap.delete(socket.id);
      console.log(`[Socket] 🔴 Disconnected: ${socket.id}`);
    });
  });

  return io;
};

/* ================= GET IO (🔥 FIX ADDED) ================= */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};

/* ================= EMIT ANALYTICS ================= */
const emitAnalyticsUpdate = (siteId, data) => {
  if (!io || !siteId || !data) return;

  const payload = {
    stats: {
      activeUsers: data.activeUsers || 0,
      pageViews: data.pageViews || 0,
      sessions: data.sessions || 0,
    },
    charts: {
      devices: data.devices || [],
      countries: data.countries || [],
      pages: data.pages || [],
      browsers: data.browsers || [],
    },
    updatedAt: new Date().toISOString(),
  };

  io.to(siteId).emit("analytics:update", payload);

  console.log(
    `[Socket] 📤 ${siteId} → full analytics update`
  );
};

/* ================= SUMMARY CACHE ================= */
const getCachedSummary = async (siteId, calculateFn) => {
  const now = Date.now();
  const cached = summaryCache.get(siteId);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await calculateFn(siteId);

  if (data) {
    summaryCache.set(siteId, { data, timestamp: now });
  }

  return data;
};

/* ================= LIVE FEED ================= */
const emitLiveFeedEvent = (siteId, event) => {
  if (!io || !siteId) return;
  io.to(siteId).emit("liveEvent", event);
};

/* ================= SETUP UPDATE ================= */
const emitSetupUpdate = (siteId, setupData) => {
  if (!io || !siteId || !setupData) return;
  io.to(siteId).emit("setup:update", setupData);
  console.log(`[Socket] 📡 Setup update → ${siteId}:`, setupData);
};

/* ================= EXPORT ================= */
module.exports = {
  initSocket,
  getIO,
  emitAnalyticsUpdate,
  getCachedSummary,
  emitLiveFeedEvent,
  emitSetupUpdate,
  getActiveUsersCount: (siteId) =>
    activeUsers.has(siteId) ? activeUsers.get(siteId).size : 0,
};