const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ===================================================== */
/* 🔐 SIGNUP */
/* ===================================================== */
exports.signup = async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    name = name?.trim();
    email = email?.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Signup failed" });
  }
};

/* ===================================================== */
/* 🔐 LOGIN */
/* ===================================================== */
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};

/* ===================================================== */
/* 👤 GET PROFILE */
/* ===================================================== */
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select(
      "name email role isActive createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });

  } catch (err) {
    console.error("GetMe error:", err);
    return res.status(500).json({ message: "Profile fetch failed" });
  }
};

/* ===================================================== */
/* 🔑 FORGOT PASSWORD */
/* ===================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    // 🔥 For now just return link (later send email)
    const resetURL = `http://localhost:5173/reset-password?token=${resetToken}`;

    return res.json({
      message: "Reset link generated",
      resetURL,
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

/* ===================================================== */
/* 🔁 RESET PASSWORD */
/* ===================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    user.clearResetToken();

    await user.save();

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Reset failed" });
  }
};