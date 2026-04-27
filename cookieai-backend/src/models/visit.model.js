const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    /* ---------- SAAS IDENTIFIER ---------- */
    siteId: {
      type: String,
      required: true,
      index: true,
    },

    /* ---------- PAGE INFO ---------- */
    url: String,

    path: {
      type: String,
      index: true,
    },

    title: String,
    referrer: String,

    /* ---------- EVENT TYPE ---------- */
    type: {
      type: String,
      default: "page_view",
      index: true,
    },

    /* ---------- USER CONTEXT ---------- */
    device: {
      type: String,
      enum: ["Mobile", "Desktop", "Tablet"],
      default: "Desktop",
      index: true,
    },

    browser: String,
    os: String,
    language: String,

    /* ---------- GEO ---------- */
    country: {
      type: String,
      index: true,
    },

    region: String,

    city: {
      type: String,
      index: true,
    },

    ip: String,

    /* ---------- SESSION ---------- */
    sessionId: {
      type: String,
      index: true,
    },

    duration: {
      type: Number,
      default: 0,
    },

    /* ---------- TIME ---------- */
    time: {
      type: Date, // 🔥 FIXED
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- INDEXES (VERY IMPORTANT) ---------- */

// 🔥 dashboard queries
visitSchema.index({ siteId: 1, time: -1 });

// 🔥 device analytics
visitSchema.index({ siteId: 1, device: 1 });

// 🔥 country analytics
visitSchema.index({ siteId: 1, country: 1 });

//  page analytics
visitSchema.index({ siteId: 1, path: 1 });

//  session tracking
visitSchema.index({ siteId: 1, sessionId: 1 });

/* ---------- TTL CLEANUP ---------- */
// delete visits after 30 days (use time field, not createdAt)
visitSchema.index(
  { time: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

module.exports = mongoose.model("Visit", visitSchema);