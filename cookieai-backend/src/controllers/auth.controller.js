const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/* ================= HELPERS ================= */
const signToken = (user) => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("❌ JWT_SECRET missing");
      throw new Error("JWT configuration error");
    }

    return jwt.sign(
      {
        id: user._id,
        role: user.role,

        // 🔥 future-proof (optional logout all sessions)
        tokenVersion: user.tokenVersion || 0,
      },
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",

        // 🔐 security metadata
        issuer: "cookieai",
        audience: "cookieai-users",
      }
    );
  } catch (err) {
    console.error("❌ TOKEN SIGN ERROR:", err.message);
    throw new Error("Token generation failed");
  }
};
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const normalized = email.trim().toLowerCase();

  // 🔐 stronger but still practical
  const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  return regex.test(normalized);
};

/* ===================================================== */
/* 🔐 SIGNUP */
/* ===================================================== */
exports.signup = async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    // 🔹 Normalize input
    name = name?.trim();
    email = email?.trim().toLowerCase();

    /* ================= VALIDATION ================= */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name too short",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // 🔐 Strong password check (basic SaaS level)
    const strongPassword =
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password);

    if (!strongPassword) {
      return res.status(400).json({
        success: false,
        message: "Password must contain uppercase, lowercase and number",
      });
    }

    /* ================= DUPLICATE CHECK ================= */

    const exists = await User.exists({ email });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    /* ================= CREATE USER ================= */

    const user = await User.create({
      name,
      email,
      password,
      isActive: true,
      emailVerified: false, // 🔥 future email verification
    });

    /* ================= TOKEN ================= */

    const token = signToken(user);

    /* ================= RESPONSE ================= */

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("❌ SIGNUP ERROR:", err);

    // 🔥 Handle duplicate index safely (Mongo fallback)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===================================================== */
/* 🔐 LOGIN */
/* ===================================================== */
exports.login = async (req, res) => {
  console.log("LOGIN BODY:", req.body);

  try {
    let { email, password } = req.body || {};

    /* ================= NORMALIZE ================= */
    email = email?.trim().toLowerCase();

    /* ================= VALIDATION ================= */
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    /* ================= FIND USER ================= */
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* ================= ACCOUNT STATUS ================= */
    if (!user.canLogin()) {
      return res.status(403).json({
        success: false,
        message: user.isLocked()
          ? "Account locked. Try later"
          : "Account disabled",
      });
    }

    /* ================= PASSWORD CHECK ================= */
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incLoginAttempts(); // 🔥 track attempts

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* ================= SUCCESS ================= */
    await user.markLoginSuccess(); // 🔥 reset attempts + set lastLogin

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===================================================== */
/* 👤 GET PROFILE */
/* ===================================================== */
exports.getMe = async (req, res) => {
  try {
    /* ================= AUTH CHECK ================= */
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /* ================= FETCH USER ================= */
    const user = await User.findById(req.user.id)
      .select("name email role createdAt lastLogin isActive")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= ACCOUNT STATUS ================= */
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account disabled",
      });
    }

    /* ================= RESPONSE ================= */
    return res.json({
      success: true,
      user,
    });

  } catch (err) {
    console.error("❌ GETME ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/* ===================================================== */
/* 🔑 FORGOT PASSWORD */
/* ===================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();

    /* ================= VALIDATION ================= */
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    /* ================= FIND USER ================= */
    const user = await User.findOne({ email });

    // 🔐 Always return same response (prevent email enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    /* ================= CREATE TOKEN ================= */
    const resetToken = user.createPasswordResetToken();

    // IMPORTANT: validateBeforeSave false (skip other validations)
    await user.save({ validateBeforeSave: false });

    /* ================= BUILD RESET URL ================= */
    const baseUrl =
      process.env.CLIENT_URL || "http://localhost:5173";

    const resetURL = `${baseUrl}/reset-password?token=${resetToken}`;

    /* ================= EMAIL SEND (placeholder) ================= */
    // TODO: replace with real email service (nodemailer / resend / sendgrid)
    console.log("🔗 RESET LINK:", resetURL);

    /* ================= RESPONSE ================= */
    return res.json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });

  } catch (err) {
    console.error("❌ FORGOT PASSWORD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ===================================================== */
/* 🔁 RESET PASSWORD */
/* ===================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};

    /* ================= VALIDATION ================= */
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // 🔐 Strong password rule (same as signup)
    const strongPassword =
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password);

    if (!strongPassword) {
      return res.status(400).json({
        success: false,
        message: "Password must contain uppercase, lowercase and number",
      });
    }

    /* ================= HASH TOKEN ================= */
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    /* ================= FIND USER ================= */
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    /* ================= UPDATE PASSWORD ================= */
    user.password = password; // 🔥 auto-hashed via pre("save")
    user.clearResetToken();

    // 🔥 Optional: invalidate old tokens (if using tokenVersion)
    if (user.tokenVersion !== undefined) {
      user.tokenVersion += 1;
    }

    await user.save();

    /* ================= RESPONSE ================= */
    return res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (err) {
    console.error("❌ RESET PASSWORD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};