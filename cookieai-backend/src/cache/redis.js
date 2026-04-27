const { createClient } = require("redis");

/* ---------- CLIENT ---------- */
const client = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log("❌ Redis reconnect failed");
        return false;
      }
      return Math.min(retries * 500, 3000);
    }
  }
});

/* ---------- EVENTS ---------- */
client.on("connect", () => {
  console.log("⚡ Redis connecting...");
});

client.on("ready", () => {
  console.log("✅ Redis ready");
});

client.on("end", () => {
  console.log("🔴 Redis disconnected");
});

client.on("error", (err) => {
  console.log("❌ Redis error:", err.message);
});

/* ---------- CONNECT ---------- */
const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
  } catch (err) {
    console.log("⚠️ Redis not available, continuing without cache...");
  }
};

/* ---------- SET CACHE ---------- */
const setCache = async (key, value, ttl = 60) => {
  try {
    if (!client.isOpen) return;
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.log("Cache set error:", err.message);
  }
};

/* ---------- GET CACHE ---------- */
const getCache = async (key) => {
  try {
    if (!client.isOpen) return null;

    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.log("Cache get error:", err.message);
    return null;
  }
};

module.exports = {
  client,
  connectRedis,
  setCache,
  getCache
};