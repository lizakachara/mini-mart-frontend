const express = require("express");

const { getSalesAnalytics } = require("../controllers/analyticsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getSalesAnalytics);

module.exports = router;
