const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    /* ---------- SAAS IDENTIFIERS ---------- */
    siteId: {
      type: String, // 🔥 FIXED: Use String for consistency
      required: true,
      index: true,
    },

    environment: {
      type: String,
      enum: ["production", "preview"],
      default: "production",
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    /* ---------- SESSION INFO ---------- */
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    /* ---------- USER CONTEXT ---------- */
    ip: String,

    device: {
      type: String,
      enum: ["Mobile", "Desktop", "Tablet"],
      default: "Desktop",
      index: true,
    },

    browser: String,
    os: String,

    country: {
      type: String,
      index: true,
    },

    city: String,

    /* ---------- SESSION TRACKING ---------- */
    startTime: {
      type: Date,
      default: Date.now,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
      // ❌ REMOVED index:true (duplicate)
    },

    duration: {
      type: Number,
      default: 0,
    },

    pageCount: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- INDEXES ---------- */

// 🔥 unique session per site
sessionSchema.index({ siteId: 1, sessionId: 1 }, { unique: true });

// 🔥 fast active users query
sessionSchema.index({ siteId: 1, isActive: 1, lastSeen: -1 });

// 🔥 analytics queries
sessionSchema.index({ siteId: 1, country: 1 });
sessionSchema.index({ siteId: 1, device: 1 });

/* ---------- TTL CLEANUP ---------- */
// 🔥 auto delete after 1 day inactivity
sessionSchema.index(
  { lastSeen: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 1 }
);

module.exports = mongoose.model("Session", sessionSchema);