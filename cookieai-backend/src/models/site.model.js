const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    /* ---------- OWNER ---------- */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ keep here
    },

    /* ---------- SITE INFO ---------- */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
      type: String,
      trim: true,
      lowercase: true,
      index: true, // ✅ keep here
      validate: {
        validator: function (v) {
          if (!v) return true;

          const cleaned = v.toLowerCase().trim();

          // allow localhost
          if (cleaned === "localhost") return true;

          // allow IP addresses
          if (/^\d+\.\d+\.\d+\.\d+$/.test(cleaned)) return true;

          // allow domains
          return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned);
        },
        message: "Invalid domain format",
      },
    },

    description: {
      type: String,
      default: "",
    },

    /* ---------- SAAS IDENTIFIERS ---------- */
    siteId: {
      type: String,
      required: true,
      unique: true,
      index: true, // ✅ keep here
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // 🔒 hidden by default
    },

    /* ---------- PLAN ---------- */
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },

    /* ---------- LIMITS ---------- */
    limits: {
      eventsPerMonth: {
        type: Number,
        default: 10000,
      },
    },

    /* ---------- STATUS ---------- */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    /* ---------- TRACKING STATUS ---------- */
    isTrackingActive: {
      type: Boolean,
      default: false,
    },

    trackingInstalled: {
      type: Boolean,
      default: false,
    },

    lastEventAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/* ❌ REMOVE DUPLICATE INDEXES BELOW */
/*
siteSchema.index({ userId: 1 });
siteSchema.index({ siteId: 1 });
siteSchema.index({ domain: 1 });
*/

module.exports = mongoose.model("Site", siteSchema);