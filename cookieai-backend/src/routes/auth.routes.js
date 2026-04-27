const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getMe,
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

// 🔥 SIGNUP (FIXED NAME)
router.post("/signup", rateLimiter, signup);

// 🔐 LOGIN
router.post("/login", rateLimiter, login);

// 👤 GET CURRENT USER
router.get("/me", authMiddleware, getMe);

// 🔓 LOGOUT (optional)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;