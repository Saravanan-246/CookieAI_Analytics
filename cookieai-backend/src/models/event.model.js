const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    /* ---------- SAAS IDENTIFIERS ---------- */
    siteId: {
      type: String,
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
      type: String,
      index: true,
    },

    sessionId: {
      type: String,
      index: true,
    },

    /* ---------- EVENT TYPE ---------- */
    type: {
      type: String,
      required: true,
      index: true,
    },

    /* ---------- PAGE DATA ---------- */
    url: String,

    path: {
      type: String,
      index: true,
    },
    prevPath: String,

    referrer: String,

    title: String,

    /* ---------- DEVICE INFO ---------- */
    device: {
      type: String,
      enum: ["Mobile", "Desktop", "Tablet"],
    },

    browser: String,
    os: String,

    country: String,
    countryCode: String,
    city: String,
    userAgent: String,

    /* ---------- PERFORMANCE ---------- */
    duration: Number, // session time or page time
    loadTime: Number, // page load ms

    /* ---------- CUSTOM DATA ---------- */
    meta: {
      type: Object,
      default: {},
    },

    /* ---------- TIME ---------- */
    time: {
      type: Date,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- INDEXES (VERY IMPORTANT) ---------- */

// 🔥 fast dashboard queries
eventSchema.index({ siteId: 1, timestamp: -1 });
eventSchema.index({ siteId: 1, time: -1 });

// 🔥 analytics grouping
eventSchema.index({ siteId: 1, type: 1, timestamp: -1 });
eventSchema.index({ siteId: 1, type: 1, time: -1 });

//  session tracking
eventSchema.index({ siteId: 1, sessionId: 1 });

//  page analytics
eventSchema.index({ siteId: 1, path: 1 });

/* ---------- TTL (AUTO CLEANUP) ---------- */
// delete events after 7 days (DISABLED TEMPORARILY)
// eventSchema.index(
//   { time: 1 },
//   { expireAfterSeconds: 60 * 60 * 24 * 7 }
// );

module.exports = mongoose.model("Event", eventSchema);