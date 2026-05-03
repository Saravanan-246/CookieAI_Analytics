const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/* ================= CONSTANTS ================= */
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

/* ================= SCHEMA ================= */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    company: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    lastLogin: Date,

    /* 🔐 PASSWORD RESET */
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    /* 🔒 SECURITY */
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

/* ================= PASSWORD HASH (FIXED) ================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ================= PASSWORD COMPARE ================= */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/* ================= RESET TOKEN ================= */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

userSchema.methods.clearResetToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

/* ================= ACCOUNT LOCK ================= */
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

/* ================= LOGIN ATTEMPTS ================= */
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    return this.save();
  }

  this.loginAttempts += 1;

  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = Date.now() + LOCK_TIME;
  }

  return this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

/* ================= SAFE LOGIN CHECK ================= */
userSchema.methods.canLogin = function () {
  return this.isActive && !this.isDeleted && !this.isLocked();
};

/* ================= LOGIN SUCCESS ================= */
userSchema.methods.markLoginSuccess = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

/* ================= SAFE OUTPUT ================= */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.__v;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;

  return obj;
};

/* ================= INDEXES ================= */
userSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model("User", userSchema);