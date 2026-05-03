require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/socket");

const PORT = Number(process.env.PORT) || 5000;

let server;

/* ================= START SERVER ================= */
const startServer = async () => {
  try {
    /* ---------- DB ---------- */
    await connectDB();
    console.log("MongoDB Connected");

    mongoose.connection.once("open", () => {
      console.log("DB:", mongoose.connection.name);
    });

    /* ---------- CREATE SINGLE SERVER ---------- */
    server = http.createServer(app);

    /* ---------- INIT SOCKET ONCE ---------- */
    initSocket(server);

    /* ---------- START SERVER ---------- */
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Tracker: http://localhost:${PORT}/tracker.js`);
    });

    /* ---------- HANDLE PORT ERROR ---------- */
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} already in use. Stop other process.`);
      } else {
        console.error("Server error:", err);
      }
      process.exit(1);
    });

    /* ---------- SHUTDOWN ---------- */
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
};

/* ================= SHUTDOWN ================= */
const shutdown = async () => {
  console.log("Shutting down...");

  try {
    if (server) {
      server.close(() => console.log("HTTP server closed"));
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("MongoDB closed");
    }

    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err.message);
    process.exit(1);
  }
};

/* ================= ERRORS ================= */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

/* ================= RUN ================= */
startServer();