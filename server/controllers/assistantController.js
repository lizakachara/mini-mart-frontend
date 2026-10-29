
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const AssistantConversation = require("../models/AssistantConversation");

const MAX_MESSAGE_LENGTH = 400;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 12;
const HISTORY_LIMIT = 80;

const requestLog = new Map();

function isRateLimited(key) {
  const now = Date.now();

  const stamps = (requestLog.get(key) || []).filter(
    (time) => now - time < RATE_WINDOW_MS
  );

  if (stamps.length >= RATE_LIMIT) {
    requestLog.set(key, stamps);
    return true;
  }

  stamps.push(now);
  requestLog.set(key, stamps);
  return false;
}

async function saveConversation(userId, customerText, assistantReply) {
  await AssistantConversation.updateOne(
    { userId },
    {
      $push: {
        messages: {
          $each: [
            { role: "customer", text: customerText },
            {
              role: "assistant",
              text: assistantReply.text,
              products: assistantReply.products || [],
              orders: assistantReply.orders || [],
            },
          ],
          $slice: -HISTORY_LIMIT,
        },
      },
    },
    { upsert: true }
  );
}

function toPrivateOrderSummary(order) {
  const id = order._id.toString();
  return {
    id,
    orderNumber: `MM${id.slice(-6).toUpperCase()}`,
    date: order.orderDate || order.createdAt,
    totalAmount: Number(order.totalAmount) || 0,
    orderStatus: order.orderStatus || "Pending",
    paymentStatus: order.paymentStatus || "Pending",
    paymentMethod: order.paymentMethod || "Not specified",
    items: (order.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
    })),
  };
}

async function answerAccountQuestion(userId, message) {
  const text = message.toLowerCase();
  const asksOrders =
    /\bmy\s+(?:orders?|purchases?)\b|\border history\b|\bpurchase history\b|\bhow many\b.*\borders?\b|\btrack\s+(?:my\s+)?order\b|\border status\b|\blast order\b|\bwhat did i order\b|\bwhere(?:'s| is)\s+(?:my\s+)?order\b/i.test(text);

  if (asksOrders) {
    const orderIdMatch = text.match(/\b[a-f\d]{24}\b/i);

    if (orderIdMatch) {
      const selected = await Order.findOne({
        _id: orderIdMatch[0],
        userId,
      }).lean();
      if (!selected) {
        return { text: "I couldn't find that order in your account.", orders: [] };
      }
      return {
        text: `Order ${toPrivateOrderSummary(selected).orderNumber} is ${selected.orderStatus || "Pending"}. Payment status: ${selected.paymentStatus || "Pending"}.`,
        orders: [toPrivateOrderSummary(selected)],
      };
    }

    if (/\bhow many\b/i.test(text)) {
      const orderCount = await Order.countDocuments({ userId });
      return {
        text: `You have ${orderCount} order${orderCount === 1 ? "" : "s"} on your account.`,
        orders: [],
      };
    }

    if (/\blast order\b|\border status\b|\btrack\b|\bwhere(?:'s| is)\s+(?:my\s+)?order\b|\bwhat did i order\b/i.test(text) && !/history|all my orders/i.test(text)) {
      const latestOrder = await Order.findOne({ userId }).sort({ createdAt: -1 }).lean();
      if (!latestOrder) {
        return { text: "I don't see any orders on your account yet.", orders: [] };
      }
      const latest = toPrivateOrderSummary(latestOrder);
      if (/\bwhere(?:'s| is)\s+(?:my\s+)?order\b/i.test(text)) {
        return {
          text: latestOrder.shippingAddress
            ? `Your latest order ${latest.orderNumber} is being delivered to ${latestOrder.shippingAddress}.`
            : "There is no delivery address saved on your latest order.",
          orders: [latest],
        };
      }
      if (/\bwhat did i order\b/i.test(text)) {
        const items = latest.items.map((item) => `${item.quantity} × ${item.name}`).join(", ");
        return {
          text: `Your latest order ${latest.orderNumber} contains ${items || "no item details"}.`,
          orders: [latest],
        };
      }
      return {
        text: `Your latest order ${latest.orderNumber} is ${latest.orderStatus}. Payment status: ${latest.paymentStatus}.`,
        orders: [latest],
      };
    }

    const [orderCount, orders] = await Promise.all([
      Order.countDocuments({ userId }),
      Order.find({ userId }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    if (!orderCount) {
      return { text: "I don't see any orders on your account yet.", orders: [] };
    }

    const summaries = orders.map(toPrivateOrderSummary);
    return {
      text: `You have ${orderCount} order${orderCount === 1 ? "" : "s"}. Here is your recent order history${orderCount > summaries.length ? " (latest 8)" : ""}.`,
      orders: summaries,
    };
  }

  if (/\b(my|mine|account|profile|registered email|phone number)\b/i.test(text)) {
    const user = await User.findById(userId).select("name email phone address").lean();

    if (!user) {
      return { text: "I couldn't load your account details. Please sign in again.", orders: [] };
    }

    if (/\b(email|email address)\b/i.test(text)) {
      return { text: `The email on your account is ${user.email}.`, orders: [] };
    }
    if (/\b(phone|mobile|telephone)\b/i.test(text)) {
      return { text: user.phone ? `The phone number on your account is ${user.phone}.` : "There is no phone number saved on your account.", orders: [] };
    }
    if (/\b(address|delivery address)\b/i.test(text)) {
      return { text: user.address ? `The address saved on your account is ${user.address}.` : "There is no address saved on your account.", orders: [] };
    }
    if (/\b(name|profile|account details)\b/i.test(text)) {
      return { text: `Your account name is ${user.name}. Email: ${user.email}.`, orders: [] };
    }
  }

  return null;
}

const getAssistantHistory = async (req, res) => {
  try {
    const conversation = await AssistantConversation.findOne({ userId: req.user.id }).lean();
    res.status(200).json({ messages: conversation?.messages || [] });
  } catch (error) {
    console.error("Get Assistant History Error:", error.message);
    res.status(500).json({ message: "Unable to load your chat history." });
  }
};

const clearAssistantHistory = async (req, res) => {
  try {
    await AssistantConversation.deleteOne({ userId: req.user.id });
    res.status(200).json({ message: "Your chat history was cleared." });
  } catch (error) {
    console.error("Clear Assistant History Error:", error.message);
    res.status(500).json({ message: "Unable to clear your chat history." });
  }
};

function extractBudget(message) {
  const patterns = [
    /\b(?:under|below|less than|upto|up to|within|max|maximum)\s*₹?\s*(\d+(?:\.\d+)?)/i,
    /₹\s*(\d+(?:\.\d+)?)\s*(?:or less|budget)/i,
    /\bbudget\s*(?:of|is|=)?\s*₹?\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function toPublicProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    unit: product.unit || "piece",
    category: product.category || "Other",
    stock: Number(product.stock) || 0,
    image: product.image || "",
    inStock: Number(product.stock) > 0,
  };
}

function getMatchingProducts(products, message) {
  const text = message.toLowerCase();
  const budget = extractBudget(text);

  let filtered = [...products];

  // Filter by maximum budget.
  if (budget !== null) {
    filtered = filtered.filter(
      (product) => Number(product.price) <= budget
    );
  }

  // Handle minimum and maximum price ranges.
  const rangeMatch = text.match(
    /(?:between|from)\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*₹?\s*(\d+(?:\.\d+)?)/i
  );

  if (rangeMatch) {
    const minimum = Math.min(Number(rangeMatch[1]), Number(rangeMatch[2]));
    const maximum = Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]));

    filtered = filtered.filter(
      (product) =>
        Number(product.price) >= minimum &&
        Number(product.price) <= maximum
    );
  }

  // Find available products.
  if (/\b(in stock|available|available products)\b/i.test(text)) {
    filtered = filtered.filter((product) => Number(product.stock) > 0);
  }

  // Find out-of-stock products.
  if (/\b(out of stock|unavailable)\b/i.test(text)) {
    filtered = filtered.filter((product) => Number(product.stock) <= 0);
  }

  // Find low-stock products.
  if (/\blow stock\b/i.test(text)) {
    filtered = filtered.filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= 10
    );
  }

  // Find cheapest products.
  if (
    /\b(cheapest|cheaper|lowest price|least expensive)\b/i.test(text)
  ) {
    return {
      products: filtered
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 6),
      budget,
      intent: "cheapest",
    };
  }

  // Find most expensive products.
  if (/\b(most expensive|highest price|costliest)\b/i.test(text)) {
    return {
      products: filtered
        .sort((a, b) => Number(b.price) - Number(a.price))
        .slice(0, 6),
      budget,
      intent: "expensive",
    };
  }

  // Find products by category or name.
  const searchWords = text
    .replace(/[^\w\s₹.-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const stopWords = new Set([
    "show", "find", "give", "want", "need", "some", "what",
    "which", "with", "from", "have", "that", "this", "products",
    "product", "under", "below", "less", "than", "price", "cost",
    "cheap", "cheapest", "expensive", "available", "stock",
    "recommend", "suggest", "please", "mini", "mart", "within",
    "budget", "between", "maximum", "maximum", "minimum",
    "rupees", "rs", "for", "the", "and", "are", "you", "can",
    "buy", "purchase", "items", "item", "in", "on", "me",
  ]);

  const keywords = searchWords.filter(
    (word) => !stopWords.has(word) && !/^\d+(?:\.\d+)?$/.test(word)
  );

  const scored = filtered.map((product) => {
    const name = String(product.name || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    const description = String(product.description || "").toLowerCase();

    let score = 0;

    for (const word of keywords) {
      if (name.includes(word)) score += 5;
      if (category.includes(word)) score += 5;
      if (description.includes(word)) score += 2;
    }

    if (budget !== null && Number(product.price) <= budget) {
      score += 1;
    }

    return { product, score };
  });

  const matched = scored
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(a.product.price) - Number(b.product.price)
    )
    .map((entry) => entry.product);

  // For generic shopping requests, show catalog products.
  const genericRequest =
    keywords.length === 0 ||
    /\b(all products|show products|recommend products|suggest products|what can i buy)\b/i.test(text);

  const results = matched.length
    ? matched.slice(0, 6)
    : genericRequest
      ? filtered
          .sort((a, b) => Number(a.price) - Number(b.price))
          .slice(0, 6)
      : [];

  return {
    products: results,
    budget,
    intent: "search",
  };
}

function createReply(message, products, budget, intent) {
  const text = message.toLowerCase();

  if (!products.length) {
    if (budget !== null) {
      return `I couldn't find matching products under ₹${budget}. Try a different category or a higher budget.`;
    }

    if (/\blow stock\b/i.test(text)) {
      return "I couldn't find any products with low stock in the current catalog.";
    }

    return "I couldn't find matching products in the Mini Mart catalog. Try searching for fruits, snacks, dairy, or bakery products.";
  }

  if (intent === "cheapest") {
    const product = products[0];

    return `The cheapest matching product is ${product.name} at ₹${product.price} per ${product.unit}. Here are some other options too.`;
  }

  if (intent === "expensive") {
    const product = products[0];

    return `The most expensive matching product is ${product.name} at ₹${product.price} per ${product.unit}.`;
  }

  if (/\blow stock\b/i.test(text)) {
    return "Here are the products with low stock. Consider restocking these items soon.";
  }

  if (/\b(out of stock|unavailable)\b/i.test(text)) {
    return "Here are the products currently marked as out of stock.";
  }

  if (budget !== null) {
    return `Here are Mini Mart products matching your request within your ₹${budget} budget.`;
  }

  if (/\b(compare|comparison)\b/i.test(text)) {
    return "Here are the matching products. You can compare their prices, categories, and availability.";
  }

  return "Here are some Mini Mart products matching your request!";
}

const getAssistantStatus = (req, res) => {
  res.status(200).json({
    configured: true,
    mode: "catalog",
    message: "Mini Mart shopping assistant is ready. Free catalog mode is active.",
  });
};

const chatWithAssistant = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        message: "Please enter a shopping question.",
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    const rateKey = req.user?.id || req.ip || "anonymous";

    if (isRateLimited(rateKey)) {
      return res.status(429).json({
        message: "Too many assistant requests. Please wait a few minutes and try again.",
      });
    }

    const accountReply = await answerAccountQuestion(req.user.id, message);

    if (accountReply) {
      await saveConversation(req.user.id, message, accountReply);
      return res.status(200).json({
        configured: true,
        mode: "account",
        reply: accountReply.text,
        products: [],
        orders: accountReply.orders || [],
      });
    }

    const dbProducts = await Product.find({
      isActive: { $ne: false },
    })
      .select("name price unit category stock image description")
      .sort({ name: 1 })
      .limit(200)
      .lean();

    const publicProducts = dbProducts.map(toPublicProduct);

    const result = getMatchingProducts(publicProducts, message);

    const products = result.products.slice(0, 6);

    const reply = createReply(
      message,
      products,
      result.budget,
      result.intent
    );

    await saveConversation(req.user.id, message, {
      text: reply,
      products,
      orders: [],
    });

    return res.status(200).json({
      configured: true,
      mode: "catalog",
      reply,
      products,
      orders: [],
    });
  } catch (error) {
    console.error("Assistant Chat Error:", error.message);

    return res.status(500).json({
      message: "The shopping assistant could not complete this request. Please try again.",
    });
  }
};

module.exports = {
  clearAssistantHistory,
  getAssistantHistory,
  getAssistantStatus,
  chatWithAssistant,
};
