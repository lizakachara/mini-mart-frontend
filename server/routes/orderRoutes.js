const express = require("express");

const {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ADMIN ONLY: Get all orders
router.get("/", protect, adminOnly, getOrders);

// CUSTOMER: Get only their own orders
router.get("/my-orders", protect, getMyOrders);

// CUSTOMER OR ADMIN: Get one authorized order
router.get("/:id", protect, getOrderById);

// CUSTOMER: Place an order
router.post("/", protect, createOrder);

// ADMIN ONLY: Update order and payment status
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);

// ADMIN ONLY: Delete an order
router.delete("/:id", protect, adminOnly, deleteOrder);

module.exports = router;
