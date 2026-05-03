require("dotenv").config();

const http = require("http");
const { execSync } = require("child_process");
const mongoose = require("mongoose");

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/socket");

const PORT = Number(process.env.PORT) || 5000;

let server;

/* ================= PORT CLEANUP ================= */
/**
 * Kill any process already listening on the target port (Windows).
 * Returns true if a process was found and killed, false otherwise.
 */
const killPortProcess = (port) => {
  try {
    const result = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim();

    if (!result) return false;

    // Extract unique PIDs from all matching lines
    const pids = [
      ...new Set(
        result
          .split("\n")
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && pid !== "0")
      ),
    ];

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { encoding: "utf-8", timeout: 5000 });
        console.log(`🔪 Killed stale process PID ${pid} on port ${port}`);
      } catch {
        // Process may have already exited
      }
    }

    return pids.length > 0;
  } catch {
    return false; // No process found or command failed — port is free
  }
};

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

    /* ---------- HANDLE PORT ERROR (AUTO-RECOVER ONCE) ---------- */
    let retried = false;
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && !retried) {
        retried = true;
        console.warn(`⚠️  Port ${PORT} in use — attempting auto-recovery...`);

        const killed = killPortProcess(PORT);
        if (killed) {
          // Wait briefly for OS to release the port, then retry
          setTimeout(() => {
            server.listen(PORT, () => {
              console.log(`✅ Server recovered on http://localhost:${PORT}`);
              console.log(`Tracker: http://localhost:${PORT}/tracker.js`);
            });
          }, 1000);
        } else {
          console.error(`❌ Port ${PORT} is in use and could not be freed. Stop the other process manually.`);
          process.exit(1);
        }
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
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