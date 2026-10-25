const express = require("express");

const {
  getUsers,
  getUserById,
  updateUserStatus,
} = require("../controllers/userController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ADMIN ONLY: Get all users
router.get("/", protect, adminOnly, getUsers);

// ADMIN ONLY: Get one user
router.get("/:id", protect, adminOnly, getUserById);

// ADMIN ONLY: Update user status
router.patch("/:id/status", protect, adminOnly, updateUserStatus);

module.exports = router;
