require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/socket");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;

/* ---------- START SERVER ---------- */
const startServer = async () => {
  try {
    /* ---------- DB ---------- */
    await connectDB();
    console.log("✅ MongoDB Connected");

    mongoose.connection.once("open", () => {
      console.log("📦 DB NAME:", mongoose.connection.name);
    });

    /* ---------- LISTEN ---------- */
    let currentPort = Number(process.env.PORT || PORT);

    const tryListen = (port) => {
      /* ---------- HTTP SERVER (NEW INSTANCE) ---------- */
      const serverInstance = http.createServer(app);

      /* ---------- SOCKET ---------- */
      initSocket(serverInstance);

      serverInstance.listen(port, () => {
        const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;
        console.log(`🚀 Server running on ${BASE_URL}`);
        console.log(`📡 Tracker URL: ${BASE_URL}/tracker.js`); // 🔥 important debug
      });

      serverInstance.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`⚠️ Port ${port} busy, trying ${port + 1}`);
          process.env.PORT = port + 1;
          tryListen(port + 1); // retry NEW instance
        } else {
          console.error("❌ Server error:", err);
          process.exit(1);
        }
      });
    };

    tryListen(currentPort);

    /* ---------- GRACEFUL SHUTDOWN ---------- */
    process.on("SIGINT", () => {
      console.log("🛑 Server shutting down...");
      process.exit(0);
    });

  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();

/* ---------- GLOBAL ERRORS ---------- */
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});