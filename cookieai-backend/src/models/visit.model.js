const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    /* ================= IDENTIFIER ================= */
    siteId: {
      type: String,
      required: true,
      index: true,
    },

    /* ================= PAGE ================= */
    url: {
      type: String,
      default: "",
    },

    path: {
      type: String,
      index: true,
      default: "/",
    },

    title: {
      type: String,
      default: "",
    },

    referrer: {
      type: String,
      default: "",
    },

    /* ================= EVENT ================= */
    type: {
      type: String,
      default: "page_view",
      index: true,
    },

    /* ================= USER ================= */
    device: {
      type: String,
      enum: ["Mobile", "Desktop", "Tablet"],
      default: "Desktop",
      index: true,
    },

    browser: String,
    os: String,
    language: String,

    /* ================= GEO ================= */
    country: {
      type: String,
      index: true,
    },
    countryCode: String,

    region: String,

    city: {
      type: String,
      index: true,
    },

    ip: String,

    /* ================= SESSION ================= */
    sessionId: {
      type: String,
      index: true,
    },

    duration: {
      type: Number,
      default: 0,
    },

    /* ================= TIME ================= */
    time: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */

/* 🔥 dashboard timeline */
visitSchema.index({ siteId: 1, time: -1 });

/* 🔥 fast page analytics */
visitSchema.index({ siteId: 1, path: 1, time: -1 });

/* 🔥 device analytics */
visitSchema.index({ siteId: 1, device: 1 });

/* 🔥 country analytics */
visitSchema.index({ siteId: 1, country: 1 });

/* 🔥 session tracking */
visitSchema.index({ siteId: 1, sessionId: 1 });

/* 🔥 type analytics */
visitSchema.index({ siteId: 1, type: 1 });

/* ================= TTL CLEANUP ================= */
/* 🔥 auto delete after 30 days */
visitSchema.index(
  { time: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 30,
  }
);

/* ================= STATIC HELPERS ================= */

/* 🔥 SAFE CREATE (HIGH LOAD SAFE) */
visitSchema.statics.createVisit = async function (data) {
  try {
    return await this.create(data);
  } catch (err) {
    // prevent crash on burst traffic
    console.error("Visit create error:", err.message);
    return null;
  }
};

/* 🔥 BULK INSERT (FOR BATCH TRACKING) */
visitSchema.statics.bulkInsert = async function (visits) {
  try {
    if (!Array.isArray(visits) || visits.length === 0) return;

    return await this.insertMany(visits, {
      ordered: false, // 🔥 prevents crash if one fails
    });
  } catch (err) {
    console.error("Bulk insert error:", err.message);
  }
};

module.exports = mongoose.model("Visit", visitSchema);