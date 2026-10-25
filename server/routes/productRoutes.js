const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// PUBLIC: Get all products
router.get("/", getProducts);

// PUBLIC: Get one product
router.get("/:id", getProductById);

// ADMIN ONLY: Add product
router.post("/", protect, adminOnly, createProduct);

// ADMIN ONLY: Update product
router.put("/:id", protect, adminOnly, updateProduct);

// ADMIN ONLY: Delete product
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;