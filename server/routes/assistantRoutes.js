const express = require("express");

const {
  getAssistantStatus,
  chatWithAssistant,
} = require("../controllers/assistantController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/status", protect, getAssistantStatus);
router.post("/chat", protect, chatWithAssistant);

module.exports = router;
