const jwt = require("jsonwebtoken");
const User = require("../models/User");

// VERIFY JWT TOKEN
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

// ADMIN ONLY
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Admin privileges required.",
  });
};

module.exports = {
  protect,
  adminOnly,
};

