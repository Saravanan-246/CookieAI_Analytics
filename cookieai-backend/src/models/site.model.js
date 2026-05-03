const mongoose = require("mongoose");

/* ================= DOMAIN CLEANER ================= */
const cleanDomain = (v) => {
  if (!v) return v;

  return v
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
};

/* ================= DOMAIN VALIDATOR ================= */
const isValidDomain = (v) => {
  if (!v) return true;

  if (v === "localhost") return true;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(v)) return true;

  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
};

const siteSchema = new mongoose.Schema(
  {
    /* ================= OWNER ================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ================= SITE INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    domain: {
      type: String,
      trim: true,
      lowercase: true,
      set: cleanDomain, // 🔥 normalize input
      index: true,
      validate: {
        validator: isValidDomain,
        message: "Invalid domain format",
      },
    },

    description: {
      type: String,
      default: "",
      maxlength: 300,
    },

    /* ================= IDENTIFIERS ================= */
    siteId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // 🔒 secure
    },

    /* ================= PLAN ================= */
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
      index: true,
    },

    /* ================= LIMITS ================= */
    limits: {
      eventsPerMonth: {
        type: Number,
        default: 10000,
      },
    },

    /* ================= STATUS ================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // 🔥 helps queries
    },

    /* ================= TRACKING ================= */
    isTrackingActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    trackingInstalled: {
      type: Boolean,
      default: false,
    },

    lastEventAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= COMPOUND INDEXES ================= */

/* 🔥 fast dashboard queries */
siteSchema.index({ userId: 1, isDeleted: 1 });

/* 🔥 plan-based filtering */
siteSchema.index({ plan: 1, isActive: 1 });

/* ================= METHODS ================= */

/* 🔥 mark tracking active (used in trackEvent) */
siteSchema.methods.markTracking = async function () {
  this.isTrackingActive = true;
  this.trackingInstalled = true;
  this.lastEventAt = new Date();
  return this.save();
};

/* ================= STATIC HELPERS ================= */

/* 🔥 safe update under load */
siteSchema.statics.updateTrackingStatus = async function (siteId) {
  return this.updateOne(
    { siteId },
    {
      $set: {
        isTrackingActive: true,
        trackingInstalled: true,
        lastEventAt: new Date(),
      },
    }
  );
};

module.exports = mongoose.model("Site", siteSchema);