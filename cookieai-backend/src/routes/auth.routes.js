const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const rateLimiter = require("../middlewares/rateLimit.middleware");

/* ---------- HEALTH ---------- */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "auth",
    status: "ok",
    uptime: process.uptime(),
  });
});

/* ---------- AUTH ROUTES ---------- */

// 🔐 SIGNUP
router.post("/signup", rateLimiter, signup);

// 🔐 LOGIN
router.post("/login", rateLimiter, login);

// 👤 GET CURRENT USER
router.get("/me", authMiddleware, getMe);

// 🔥 FORGOT PASSWORD
router.post("/forgot-password", rateLimiter, forgotPassword);

// 🔥 RESET PASSWORD
router.post("/reset-password", resetPassword);

// 🔓 LOGOUT (optional)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;