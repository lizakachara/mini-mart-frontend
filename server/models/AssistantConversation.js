const mongoose = require("mongoose");

const assistantMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["customer", "assistant"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1200,
    },
    products: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    orders: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const assistantConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      type: [assistantMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistantConversation", assistantConversationSchema);