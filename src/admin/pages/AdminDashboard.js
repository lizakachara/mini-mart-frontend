import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaShoppingBag,
  FaShoppingCart,
  FaUsers,
  FaChartBar,
  FaBox,
  FaTags,
  FaArrowRight,
  FaCalendarAlt,
} from "react-icons/fa";

import "../css/AdminDashboard.css";

const PRODUCTS_API = "http://localhost:5000/api/products";
const CATEGORIES_API = "http://localhost:5000/api/categories";
const ORDERS_API = "http://localhost:5000/api/orders";
const USERS_API = "http://localhost:5000/api/users";

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDateLabel(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAdminName() {
  try {
    const saved = JSON.parse(localStorage.getItem("adminUser") || "null");
    return saved?.name || "Admin";
  } catch {
    return "Admin";
  }
}

function getToken() {
  return localStorage.getItem("adminToken");
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminName = getAdminName();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error("Admin login required. Please log in again.");
        }

        const authHeaders = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [
          productsResponse,
          categoriesResponse,
          ordersResponse,
          usersResponse,
        ] = await Promise.all([
          fetch(PRODUCTS_API),
          fetch(CATEGORIES_API),
          fetch(ORDERS_API, { headers: authHeaders }),
          fetch(USERS_API, { headers: authHeaders }),
        ]);

        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();
        const ordersData = await ordersResponse.json();
        const usersData = await usersResponse.json();

        if (!productsResponse.ok) {
          throw new Error(productsData.message || "Unable to load products.");
        }

        if (!ordersResponse.ok) {
          throw new Error(ordersData.message || "Unable to load orders.");
        }

        if (!usersResponse.ok) {
          throw new Error(usersData.message || "Unable to load users.");
        }

        setProducts(
          Array.isArray(productsData)
            ? productsData
            : productsData.products || []
        );

        setCategories(
          categoriesResponse.ok
            ? Array.isArray(categoriesData)
              ? categoriesData
              : categoriesData.categories || []
            : []
        );

        setOrders(
          Array.isArray(ordersData) ? ordersData : ordersData.orders || []
        );

        setUsers(
          Array.isArray(usersData) ? usersData : usersData.users || []
        );
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const activeProducts = products.filter(
      (product) => product.isActive !== false
    );
    const countedOrders = orders.filter(
      (order) => order.orderStatus !== "Cancelled"
    );
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "Pending"
    );
    const customers = users.filter((user) => user.role !== "admin");
    const totalSales = countedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );
    const paidOrders = orders.filter(
      (order) => order.paymentStatus === "Paid"
    );

    return {
      products: products.length,
      activeProducts: activeProducts.length,
      orders: orders.length,
      pendingOrders: pendingOrders.length,
      users: users.length,
      customers: customers.length,
      sales: totalSales,
      paidOrders: paidOrders.length,
      categories: categories.filter((item) => item.isActive !== false).length,
    };
  }, [products, categories, orders, users]);

  const chartBars = useMemo(() => {
    const days = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (5 - index));
      return date;
    });

    const totals = days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      return orders
        .filter((order) => {
          if (order.orderStatus === "Cancelled") return false;
          const created = new Date(order.orderDate || order.createdAt);
          return created >= day && created < nextDay;
        })
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    });

    const max = Math.max(...totals, 1);

    return totals.map((total, index) => ({
      height: `${Math.max(12, Math.round((total / max) * 100))}%`,
      label: days[index].toLocaleDateString("en-IN", { weekday: "short" }),
    }));
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="admin-dashboard">

      <section className="admin-hero">
        <div className="admin-glow admin-glow-one"></div>
        <div className="admin-glow admin-glow-two"></div>

        <div className="admin-hero-container">

          <div className="admin-hero-content">

            <p className="admin-small-title">
              Manage • Track • Grow
            </p>

            <h1>
              Welcome Back,
              <br />
              <span>{adminName}!</span>
            </h1>

            <p className="admin-hero-description">
              Here's what's happening with your store today.
            </p>

            <Link
              to="/admin/analytics"
              className="admin-report-button"
            >
              View Analytics
              <FaArrowRight />
            </Link>

          </div>

          <div className="admin-hero-image">

            <div className="admin-laptop">

              <div className="laptop-screen">

                <div className="mini-dashboard-header">

                  <strong>
                    Mini Mart
                  </strong>

                  <span>
                    Admin
                  </span>

                </div>

                <div className="mini-dashboard-content">

                  <div className="mini-stat">
                    <small>Products</small>
                    <strong>{loading ? "—" : stats.products}</strong>
                  </div>

                  <div className="mini-stat">
                    <small>Orders</small>
                    <strong>{loading ? "—" : stats.orders}</strong>
                  </div>

                  <div className="mini-stat">
                    <small>Users</small>
                    <strong>{loading ? "—" : stats.users}</strong>
                  </div>

                  <div className="mini-stat">
                    <small>Sales</small>
                    <strong>{loading ? "—" : formatCurrency(stats.sales)}</strong>
                  </div>

                </div>

                <div className="mini-chart">

                  <div className="chart-title">
                    Sales Overview
                  </div>

                  <div className="chart-bars">
                    {chartBars.map((bar, index) => (
                      <span
                        key={bar.label}
                        style={{ height: bar.height }}
                        title={bar.label}
                        className={`chart-bar-${index}`}
                      ></span>
                    ))}
                  </div>

                </div>

              </div>

              <div className="laptop-base"></div>

            </div>

          </div>

        </div>
      </section>

      <section className="store-overview">

        <div className="admin-container">

          <div className="section-heading-admin">

            <div>

              <h2>
                Store Overview
              </h2>

              <p>
                Quick statistics about your store
              </p>

            </div>

            <div className="admin-date">

              <FaCalendarAlt />

              <span>
                Today, {formatDateLabel(new Date())}
              </span>

            </div>

          </div>

          {error ? (
            <div className="admin-dashboard-status">
              <p>{error}</p>
              <button
                type="button"
                className="admin-report-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="admin-stat-grid">

              <div className="admin-stat-card accent-products">

                <div className="stat-icon">
                  <FaShoppingBag />
                </div>

                <div className="stat-content">

                  <p>
                    Total Products
                  </p>

                  <h3>
                    {loading ? "—" : stats.products}
                  </h3>

                  <span className="stat-growth">
                    {loading
                      ? "Loading..."
                      : `${stats.activeProducts} active · ${stats.categories} categories`}
                  </span>

                </div>

              </div>

              <div className="admin-stat-card accent-orders">

                <div className="stat-icon">
                  <FaShoppingCart />
                </div>

                <div className="stat-content">

                  <p>
                    Total Orders
                  </p>

                  <h3>
                    {loading ? "—" : stats.orders}
                  </h3>

                  <span className="stat-growth">
                    {loading
                      ? "Loading..."
                      : `${stats.pendingOrders} pending`}
                  </span>

                </div>

              </div>

              <div className="admin-stat-card accent-users">

                <div className="stat-icon">
                  <FaUsers />
                </div>

                <div className="stat-content">

                  <p>
                    Total Users
                  </p>

                  <h3>
                    {loading ? "—" : stats.users}
                  </h3>

                  <span className="stat-growth">
                    {loading
                      ? "Loading..."
                      : `${stats.customers} customers`}
                  </span>

                </div>

              </div>

              <div className="admin-stat-card accent-sales">

                <div className="stat-icon">
                  <FaChartBar />
                </div>

                <div className="stat-content">

                  <p>
                    Total Sales
                  </p>

                  <h3>
                    {loading ? "—" : formatCurrency(stats.sales)}
                  </h3>

                  <span className="stat-growth">
                    {loading
                      ? "Loading..."
                      : `${stats.paidOrders} paid orders`}
                  </span>

                </div>

              </div>

            </div>
          )}

        </div>

      </section>

      <section className="recent-orders-section">
        <div className="admin-container">

          <div className="section-heading-admin">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest activity from your store</p>
            </div>

            <Link to="/admin/orders" className="view-all-orders-link">
              View all
              <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <p className="admin-dashboard-status">Loading orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="admin-dashboard-status">
              Orders placed by customers will appear here.
            </p>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map((order) => {
                const status = order.orderStatus || "Pending";
                const customer =
                  order.userId?.name ||
                  order.customerName ||
                  "Customer";

                return (
                  <div className="recent-order-row" key={order._id}>
                    <div>
                      <strong>{customer}</strong>
                      <span>
                        #{String(order._id).slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <span className={`order-status-pill status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      <section className="quick-actions">

        <div className="admin-container">

          <div className="quick-heading">

            <h2>
              Quick Actions
            </h2>

            <p>
              Manage your store easily
            </p>

          </div>

          <div className="quick-action-grid">

            <Link
              to="/admin/analytics"
              className="quick-action-card"
            >

              <div className="quick-action-icon">
                <FaChartBar />
              </div>

              <div className="quick-action-content">

                <h3>
                  Sales Analytics
                </h3>

                <p>
                  Revenue, charts, and low-stock alerts
                </p>

              </div>

              <div className="quick-arrow">
                <FaArrowRight />
              </div>

            </Link>

            <Link
              to="/admin/products"
              className="quick-action-card"
            >

              <div className="quick-action-icon">
                <FaBox />
              </div>

              <div className="quick-action-content">

                <h3>
                  Manage Products
                </h3>

                <p>
                  Add, edit or remove products
                </p>

              </div>

              <div className="quick-arrow">
                <FaArrowRight />
              </div>

            </Link>

            <Link
              to="/admin/categories"
              className="quick-action-card"
            >

              <div className="quick-action-icon">
                <FaTags />
              </div>

              <div className="quick-action-content">

                <h3>
                  Manage Categories
                </h3>

                <p>
                  Organize your product categories
                </p>

              </div>

              <div className="quick-arrow">
                <FaArrowRight />
              </div>

            </Link>

            <Link
              to="/admin/orders"
              className="quick-action-card"
            >

              <div className="quick-action-icon">
                <FaShoppingCart />
              </div>

              <div className="quick-action-content">

                <h3>
                  Manage Orders
                </h3>

                <p>
                  View and update order status
                </p>

              </div>

              <div className="quick-arrow">
                <FaArrowRight />
              </div>

            </Link>

            <Link
              to="/admin/users"
              className="quick-action-card"
            >

              <div className="quick-action-icon">
                <FaUsers />
              </div>

              <div className="quick-action-content">

                <h3>
                  Manage Users
                </h3>

                <p>
                  View and manage customers
                </p>

              </div>

              <div className="quick-arrow">
                <FaArrowRight />
              </div>

            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}

export default AdminDashboard;
