
const Product = require("../models/Product");

const MAX_MESSAGE_LENGTH = 400;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 12;

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

    return res.status(200).json({
      configured: true,
      mode: "catalog",
      reply,
      products,
    });
  } catch (error) {
    console.error("Assistant Chat Error:", error.message);

    return res.status(500).json({
      message: "The shopping assistant could not complete this request. Please try again.",
    });
  }
};

module.exports = {
  getAssistantStatus,
  chatWithAssistant,
};
