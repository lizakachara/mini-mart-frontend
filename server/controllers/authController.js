
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
  getProfile,
  updateProfile,
};
 
