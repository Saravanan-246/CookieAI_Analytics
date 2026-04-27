const mongoose = require("mongoose");

const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // 🔥 FORCE IPv4 (VERY IMPORTANT)
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (err) {
    console.error("❌ DB Error:", err.message);

    if (retries > 0) {
      console.log(`🔁 Retrying connection... (${retries})`);
      setTimeout(() => connectDB(retries - 1), 3000);
    } else {
      console.error("❌ Could not connect to MongoDB");
      process.exit(1);
    }
  }
};

module.exports = connectDB;