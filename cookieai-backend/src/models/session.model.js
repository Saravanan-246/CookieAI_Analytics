const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    /* ================= IDENTIFIERS ================= */
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
      required: true,
    },

    /* ================= USER CONTEXT ================= */
    ip: {
      type: String,
    },

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

    /* ================= SESSION TRACK ================= */
    startTime: {
      type: Date,
      default: Date.now,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
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
    lastPath: String,
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */

/* 🔥 unique user session per site (CRITICAL for cross-tab) */
sessionSchema.index(
  { siteId: 1, userId: 1 },
  { unique: true }
);

/* 🔥 active users (REALTIME DASHBOARD) */
sessionSchema.index(
  { siteId: 1, isActive: 1, lastSeen: -1 }
);

/* 🔥 analytics filters */
sessionSchema.index({ siteId: 1, country: 1 });
sessionSchema.index({ siteId: 1, device: 1 });


/* ================= TTL CLEANUP ================= */
/* 🔥 auto delete inactive sessions after 24h */
sessionSchema.index(
  { lastSeen: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24,
    partialFilterExpression: { isActive: false } // ✅ only inactive sessions
  }
);

/* ================= PRE SAVE HOOK ================= */
/* 🔥 auto update duration */
sessionSchema.pre("save", function (next) {
  if (this.startTime && this.lastSeen) {
    this.duration = Math.floor(
      (this.lastSeen - this.startTime) / 1000
    );
  }
  next();
});

/* ================= STATIC HELPERS ================= */
/* 🔥 safe upsert (HIGH LOAD SAFE) */
sessionSchema.statics.upsertSession = async function (data) {
  const {
    siteId,
    sessionId,
    device,
    browser,
    os,
    country,
    isActive = true,
  } = data;

  const now = new Date();

  return this.updateOne(
    { siteId, sessionId },
    {
      $set: {
        lastSeen: now,
        device,
        browser,
        os,
        country,
        isActive,
      },
      $setOnInsert: {
        startTime: now,
        pageCount: 1,
      },
      $inc: { pageCount: 1 },
    },
    { upsert: true }
  );
};

module.exports = mongoose.model("Session", sessionSchema);