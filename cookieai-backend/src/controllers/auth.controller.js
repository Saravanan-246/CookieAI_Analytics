const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

/* ---------- HELPERS ---------- */
const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" }
  );
};

/* ---------- VALIDATORS ---------- */
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ===================================================== */
/* 🔐 SIGNUP */
/* ===================================================== */
exports.signup = async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    /* ---------- SANITIZE ---------- */
    name = name?.trim();
    email = email?.trim().toLowerCase();

    /* ---------- VALIDATION ---------- */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    /* ---------- CHECK EXIST ---------- */
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    /* ---------- CREATE USER ---------- */
    const user = await User.create({
      name,
      email,
      password,
    });

    /* ---------- TOKEN ---------- */
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);

    return res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
};

/* ===================================================== */
/* 🔐 LOGIN */
/* ===================================================== */
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    /* ---------- SANITIZE ---------- */
    email = email?.trim().toLowerCase();

    /* ---------- VALIDATION ---------- */
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    /* ---------- FIND USER ---------- */
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* ---------- CHECK PASSWORD ---------- */
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* ---------- UPDATE LOGIN TIME ---------- */
    user.lastLogin = new Date();
    await user.save();

    /* ---------- TOKEN ---------- */
    const token = signToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/* ===================================================== */
/* 👤 GET PROFILE */
/* ===================================================== */
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user.id).select(
      "name email role isActive createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("GetMe error:", err);

    return res.status(500).json({
      success: false,
      message: "Profile fetch failed",
    });
  }
};