
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const createMailTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const port = Number(SMTP_PORT);

  if (!Number.isInteger(port) || port <= 0) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ===============================
// REGISTER USER
// ===============================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || "",
      address: address || "",
      role: "customer",
      status: "active",
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);

    res.status(500).json({
      message: "Server error during registration.",
    });
  }
};

// ===============================
// LOGIN USER
// ===============================

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    res.status(500).json({
      message: "Server error during login.",
    });
  }
};

// REQUEST PASSWORD RESET
const requestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email address is required." });
    }

    const frontendUrl = process.env.FRONTEND_URL;
    const mailTransport = createMailTransport();

    if (!frontendUrl || !mailTransport) {
      return res.status(503).json({
        message: "Password reset email is not configured on the server.",
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const resetUrl = new URL("/forgot-password", frontendUrl);

      resetUrl.searchParams.set("token", resetToken);

      user.passwordResetToken = resetTokenHash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      try {
        await mailTransport.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: "Reset your Mini Mart password",
          text: `Use this link within one hour to reset your password: ${resetUrl.toString()}`,
          html: `<p>Use this link within one hour to reset your Mini Mart password:</p><p><a href="${resetUrl.toString()}">Reset password</a></p>`,
        });
      } catch (mailError) {
        user.passwordResetToken = "";
        user.passwordResetExpires = null;
        await user.save();
        throw mailError;
      }
    }

    res.status(200).json({
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Request Password Reset Error:", error.message);

    res.status(500).json({
      message: "Unable to send a password reset email. Please try again later.",
    });
  }
};

// RESET PASSWORD WITH A SINGLE-USE TOKEN
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !token || typeof password !== "string") {
      return res.status(400).json({
        message: "A reset token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or has expired.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = "";
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error.message);

    res.status(500).json({
      message: "Unable to reset your password. Please try again.",
    });
  }
};

// ===============================
// GET CUSTOMER PROFILE
// ===============================

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch profile.",
    });
  }
};

// ===============================
// UPDATE CUSTOMER PROFILE
// ===============================

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        message: "Name cannot be empty.",
      });
    }

    if (
      phone !== undefined &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message: "Phone must be text.",
      });
    }

    if (
      address !== undefined &&
      typeof address !== "string"
    ) {
      return res.status(400).json({
        message: "Address must be text.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (address !== undefined) {
      user.address = address.trim();
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password");

    res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);

    res.status(500).json({
      message: "Failed to update profile.",
    });
  }
};

// ===============================
// EXPORT FUNCTIONS
// ===============================

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile,
};
 
