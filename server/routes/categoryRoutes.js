const express = require("express");

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// PUBLIC: View all active categories
router.get("/", getCategories);

// PUBLIC: View one category
router.get("/:id", getCategoryById);

// ADMIN ONLY: Create category
router.post("/", protect, adminOnly, createCategory);

// ADMIN ONLY: Update category
router.put("/:id", protect, adminOnly, updateCategory);

// ADMIN ONLY: Delete category
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;