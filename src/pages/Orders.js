import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Orders.css";

const ORDERS_API = "https://mini-mart-cdkr.onrender.com/api/orders/my-orders";

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          throw new Error("Please log in again to view your orders.");
        }

        const response = await fetch(ORDERS_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load orders.");
        }

        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch (err) {
        console.error("My orders error:", err);
        setError(err.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div className="orders-page">
      <section className="orders-header">
        <div className="orders-container">
          <div>
            <p className="orders-kicker">Your shopping history</p>
            <h1>My Orders</h1>
            <p>Track the groceries you have ordered from Mini Mart.</p>
          </div>
          <div className="orders-count">
            {loading ? "Loading..." : `${orders.length} ${orders.length === 1 ? "Order" : "Orders"}`}
          </div>
        </div>
      </section>

      <section className="orders-content">
        <div className="orders-container">
          {loading ? (
            <div className="orders-empty">
              <h2>Loading orders...</h2>
            </div>
          ) : error ? (
            <div className="orders-empty">
              <h2>Unable to load orders</h2>
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <h2>No orders yet</h2>
              <p>When you place an order, it will appear here.</p>
              <Link to="/products" className="orders-shop-button">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const status = order.orderStatus || "Pending";
                const items = Array.isArray(order.items) ? order.items : [];

                return (
                  <article className="order-card" key={order._id}>
                    <div className="order-card-top">
                      <div>
                        <span>Order #{String(order._id).slice(-6).toUpperCase()}</span>
                        <h3>{formatDate(order.orderDate || order.createdAt)}</h3>
                      </div>
                      <span className={`order-status status-${status.toLowerCase()}`}>
                        {status}
                      </span>
                    </div>

                    <div className="order-items">
                      {items.map((item, index) => (
                        <div className="order-item" key={`${order._id}-${index}`}>
                          <img
                            src={
                              item.image ||
                              "https://placehold.co/80x80?text=Mini+Mart"
                            }
                            alt={item.name}
                          />
                          <div>
                            <strong>{item.name}</strong>
                            <p>
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-bottom">
                      <p>{order.paymentMethod || "Payment"} · {order.paymentStatus || "Pending"}</p>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Orders;
