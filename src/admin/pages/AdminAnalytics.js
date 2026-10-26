import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaChartLine, FaExclamationTriangle } from "react-icons/fa";

import "../css/AdminAnalytics.css";

const ANALYTICS_API = "https://mini-mart-cdkr.onrender.com/api/analytics";
const CHART_COLORS = ["#ed456c", "#ff8a4c", "#2bbbad", "#5b8def", "#9b6bff", "#f5a623"];

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getToken() {
  return localStorage.getItem("adminToken");
}

function AdminAnalytics() {
  const [range, setRange] = useState("30d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      if (!token) {
        throw new Error("Admin login required. Please log in again.");
      }

      const params = new URLSearchParams({ range });
      if (range === "custom") {
        params.set("from", fromDate);
        params.set("to", toDate);
      }

      const response = await fetch(`${ANALYTICS_API}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Unable to load analytics.");
      }

      setData(payload);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(err.message || "Unable to load analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, fromDate, toDate]);

  useEffect(() => {
    if (range === "custom" && (!fromDate || !toDate)) {
      setLoading(false);
      return;
    }

    loadAnalytics();
  }, [loadAnalytics, range, fromDate, toDate]);

  const summaryCards = useMemo(() => {
    const summary = data?.summary || {};
    return [
      { label: "Total Revenue", value: formatCurrency(summary.totalRevenue) },
      { label: "Total Orders", value: summary.totalOrders ?? 0 },
      { label: "Products Sold", value: summary.totalProductsSold ?? 0 },
      { label: "Average Order Value", value: formatCurrency(summary.averageOrderValue) },
      { label: "Total Customers", value: summary.totalCustomers ?? 0 },
    ];
  }, [data]);

  const hasOrders = Number(data?.summary?.totalOrders || 0) > 0
    || (data?.charts?.orderStatus || []).some((item) => item.count > 0);

  return (
    <div className="admin-analytics">
      <section className="analytics-header">
        <div>
          <p className="analytics-kicker">Sales Analytics</p>
          <h1>Store performance from live orders</h1>
          <p>
            Metrics use MongoDB order data. Cancelled orders are excluded from
            revenue, products sold, and average order value.
          </p>
        </div>
      </section>

      <section className="analytics-filters">
        {[
          { id: "today", label: "Today" },
          { id: "7d", label: "Last 7 days" },
          { id: "30d", label: "Last 30 days" },
          { id: "month", label: "This month" },
          { id: "custom", label: "Custom range" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            className={range === option.id ? "filter-chip active" : "filter-chip"}
            onClick={() => setRange(option.id)}
          >
            {option.label}
          </button>
        ))}

        {range === "custom" && (
          <div className="custom-range">
            <label>
              From
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {range === "custom" && (!fromDate || !toDate) ? (
        <div className="analytics-status">
          Choose a start and end date to load analytics.
        </div>
      ) : loading ? (
        <div className="analytics-status">Loading live sales analytics...</div>
      ) : error ? (
        <div className="analytics-status error">
          <p>{error}</p>
          <button type="button" className="filter-chip active" onClick={loadAnalytics}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="analytics-summary">
            {summaryCards.map((card) => (
              <article key={card.label} className="summary-card">
                <p>{card.label}</p>
                <h2>{card.value}</h2>
              </article>
            ))}
          </section>

          {!hasOrders ? (
            <div className="analytics-status">
              No orders were found for this period. Place or import real orders
              to see charts and best-seller data.
            </div>
          ) : (
            <section className="analytics-charts">
              <article className="chart-card">
                <h3>
                  <FaChartLine /> Daily sales
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.charts.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0dce2" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#ed456c"
                      fill="#ffd6e0"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </article>

              <article className="chart-card">
                <h3>Monthly revenue</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.charts.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0dce2" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#ed456c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </article>

              <article className="chart-card">
                <h3>Best-selling products</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.charts.bestSellingProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0dce2" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="quantitySold" fill="#ff8a4c" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </article>

              <article className="chart-card">
                <h3>Category-wise sales</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.charts.categorySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0dce2" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#2bbbad" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </article>

              <article className="chart-card">
                <h3>Order status distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.charts.orderStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {data.charts.orderStatus.map((entry, index) => (
                        <Cell
                          key={entry.status}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </article>
            </section>
          )}

          <section className="analytics-tables">
            <article className="table-card">
              <h3>Top 5 best-selling products</h3>
              {data.topProducts.length === 0 ? (
                <p className="empty-note">No sold products in this period.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((product) => (
                      <tr key={product.productId || product.name}>
                        <td>{product.name}</td>
                        <td>{product.quantitySold}</td>
                        <td>{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>

            <article className="table-card">
              <h3>
                <FaExclamationTriangle /> Low-stock alerts
              </h3>
              {data.lowStockProducts.length === 0 ? (
                <p className="empty-note">
                  No active products are at or below {data.lowStockThreshold} units.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStockProducts.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td className={product.stock <= 0 ? "stock-out" : "stock-low"}>
                          {product.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminAnalytics;
