const { Server } = require("socket.io");

let io;

/* ---------- INIT SOCKET ---------- */
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
    console.log(`🟢 Connected: ${socket.id}`);

    let lastEventTime = 0;

    /* ---------- JOIN SITE ROOM ---------- */
    socket.on("join-site", (siteId) => {
      if (!siteId || typeof siteId !== "string") return;

      socket.join(siteId);
      socket.siteId = siteId;

      console.log(`📡 Socket ${socket.id} joined site: ${siteId}`);

      io.to(siteId).emit("visitor-online", {
        socketId: socket.id,
        siteId,
        time: Date.now(),
      });
    });

    /* ---------- LEAVE SITE ROOM ---------- */
    socket.on("leave-site", (siteId) => {
      if (!siteId) return;
      
      socket.leave(siteId);
      console.log(`📡 Socket ${socket.id} left site: ${siteId}`);
    });

    /* ---------- LIVE TRACK EVENT (THROTTLED) ---------- */
    socket.on("track-event", (data = {}) => {
      const now = Date.now();

      // 🔥 prevent spam
      if (now - lastEventTime < 1000) return;
      lastEventTime = now;

      const { siteId } = data;
      if (!siteId) return;

      io.to(siteId).emit("live-event", {
        ...data,
        socketId: socket.id,
        time: now,
      });
    });

    /* ---------- HEARTBEAT ---------- */
    socket.on("heartbeat", (siteId) => {
      if (!siteId) return;

      io.to(siteId).emit("user-active", {
        socketId: socket.id,
        time: Date.now(),
      });
    });

    /* ---------- DISCONNECT ---------- */
    socket.on("disconnect", () => {
      if (socket.siteId) {
        io.to(socket.siteId).emit("visitor-offline", {
          socketId: socket.id,
          time: Date.now(),
        });
      }

      console.log(`🔴 Disconnected: ${socket.id}`);
    });
  });

  return io;
};

/* ---------- GET IO ---------- */
const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

module.exports = {
  initSocket,
  getIO,
};