const express = require("express");

const {
  clearAssistantHistory,
  getAssistantHistory,
  getAssistantStatus,
  chatWithAssistant,
} = require("../controllers/assistantController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/status", protect, getAssistantStatus);
router.get("/history", protect, getAssistantHistory);
router.delete("/history", protect, clearAssistantHistory);
router.post("/chat", protect, chatWithAssistant);

module.exports = router;
