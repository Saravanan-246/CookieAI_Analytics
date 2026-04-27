const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // 🔒 Require header
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }

    const token = header.slice(7).trim(); // remove "Bearer "

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not set");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // 🔐 Verify
    const decoded = jwt.verify(token, secret);

    // 👉 attach minimal user context
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    let message = "Unauthorized";

    if (err.name === "TokenExpiredError") message = "Token expired";
    if (err.name === "JsonWebTokenError") message = "Invalid token";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};