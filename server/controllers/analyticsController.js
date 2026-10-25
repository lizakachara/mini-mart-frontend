const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const LOW_STOCK_THRESHOLD = 10;

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function parseDateRange(query) {
  const range = String(query.range || "30d").toLowerCase();
  const now = new Date();
  let start;
  let end = endOfDay(now);

  if (range === "today") {
    start = startOfDay(now);
  } else if (range === "7d") {
    start = startOfDay(now);
    start.setDate(start.getDate() - 6);
  } else if (range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "custom") {
    if (!query.from || !query.to) {
      return {
        error: "Custom range requires both from and to dates.",
      };
    }

    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return { error: "Invalid custom date range." };
    }

    start = startOfDay(fromDate);
    end = endOfDay(toDate);

    if (start > end) {
      return { error: "Start date cannot be after end date." };
    }
  } else {
    start = startOfDay(now);
    start.setDate(start.getDate() - 29);
  }

  return { start, end, range };
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

const getSalesAnalytics = async (req, res) => {
  try {
    const parsed = parseDateRange(req.query);

    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const { start, end, range } = parsed;

    const dateMatch = {
      $gte: start,
      $lte: end,
    };

    const periodMatch = {
      $or: [{ orderDate: dateMatch }, { createdAt: dateMatch }],
    };

    const revenueMatch = {
      ...periodMatch,
      orderStatus: { $ne: "Cancelled" },
    };

    const [
      summaryAgg,
      dailySales,
      monthlyRevenue,
      bestSelling,
      categorySales,
      statusDistribution,
      totalCustomers,
      lowStockProducts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
            totalProductsSold: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ["$items", []] },
                  initialValue: 0,
                  in: {
                    $add: [
                      "$$value",
                      { $ifNull: ["$$this.quantity", 0] },
                    ],
                  },
                },
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $ifNull: ["$orderDate", "$createdAt"] },
              },
            },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: { $ifNull: ["$orderDate", "$createdAt"] },
              },
            },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: revenueMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            image: { $first: "$items.image" },
            quantitySold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: revenueMatch },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $addFields: {
            categoryName: {
              $ifNull: [
                { $arrayElemAt: ["$product.category", 0] },
                "Uncategorized",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$categoryName",
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            quantitySold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: { $ifNull: ["$orderStatus", "Pending"] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments({ role: "customer" }),
      Product.find({
        isActive: { $ne: false },
        stock: { $lte: LOW_STOCK_THRESHOLD },
      })
        .select("name stock price category image")
        .sort({ stock: 1, name: 1 })
        .lean(),
    ]);

    const summary = summaryAgg[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalProductsSold: 0,
    };

    const totalRevenue = roundCurrency(summary.totalRevenue);
    const totalOrders = summary.totalOrders || 0;
    const averageOrderValue =
      totalOrders > 0 ? roundCurrency(totalRevenue / totalOrders) : 0;

    res.status(200).json({
      range,
      start,
      end,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      summary: {
        totalRevenue,
        totalOrders,
        totalProductsSold: summary.totalProductsSold || 0,
        averageOrderValue,
        totalCustomers,
      },
      charts: {
        dailySales: dailySales.map((item) => ({
          date: item._id,
          revenue: roundCurrency(item.revenue),
          orders: item.orders,
        })),
        monthlyRevenue: monthlyRevenue.map((item) => ({
          month: item._id,
          revenue: roundCurrency(item.revenue),
          orders: item.orders,
        })),
        bestSellingProducts: bestSelling.map((item) => ({
          productId: item._id,
          name: item.name,
          image: item.image || "",
          quantitySold: item.quantitySold,
          revenue: roundCurrency(item.revenue),
        })),
        categorySales: categorySales.map((item) => ({
          category: item._id || "Uncategorized",
          revenue: roundCurrency(item.revenue),
          quantitySold: item.quantitySold,
        })),
        orderStatus: statusDistribution.map((item) => ({
          status: item._id,
          count: item.count,
        })),
      },
      topProducts: bestSelling.map((item) => ({
        productId: item._id,
        name: item.name,
        image: item.image || "",
        quantitySold: item.quantitySold,
        revenue: roundCurrency(item.revenue),
      })),
      lowStockProducts,
    });
  } catch (error) {
    console.error("Get Sales Analytics Error:", error.message);

    res.status(500).json({
      message: "Failed to load sales analytics.",
    });
  }
};

module.exports = {
  getSalesAnalytics,
};
