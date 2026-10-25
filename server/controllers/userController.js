const User = require("../models/User");

// GET ALL USERS
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Get Users Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch users.",
    });
  }
};

// GET SINGLE USER
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get User Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch user.",
    });
  }
};

// UPDATE USER STATUS
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.status(200).json({
      message: "User status updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update User Status Error:", error.message);

    res.status(500).json({
      message: "Failed to update user status.",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
};