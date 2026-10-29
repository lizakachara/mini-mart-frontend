import React, { useCallback, useEffect, useState } from "react";
import {
FaSearch,
FaShoppingCart,
FaEye,
FaEdit,
FaTimes,
FaSave,
FaBoxOpen,
FaTrash,
} from "react-icons/fa";

import "../css/AdminOrders.css";

const API_URL = "https://mini-mart-cdkr.onrender.com/api/orders";

function AdminOrders() {
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [selectedOrder, setSelectedOrder] = useState(null);
const [editingOrder, setEditingOrder] = useState(null);
const [newStatus, setNewStatus] = useState("");

const statuses = [
"All",
"Pending",
"Processing",
"Shipped",
"Delivered",
"Cancelled",
];

// GET ADMIN TOKEN
const getToken = () => {
return localStorage.getItem("adminToken");
};

// FETCH ORDERS FROM MONGODB
const fetchOrders = useCallback(async () => {
try {
setLoading(true);
setError("");

  const token = getToken();

  if (!token) {
    setError("Admin login required. Please log in again.");
    return;
  }

  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch orders.");
  }

  setOrders(Array.isArray(data) ? data : data.orders || []);
} catch (err) {
  console.error("Fetch orders error:", err);
  setError(err.message || "Unable to load orders.");
} finally {
  setLoading(false);
}


}, []); 
useEffect(() => {
  fetchOrders();
}, [fetchOrders]);

// CUSTOMER NAME
const getCustomerName = (order) => {
return (
order.userId?.name ||
order.customerName ||
order.name ||
order.customer?.name ||
"Customer"
);
};

// CUSTOMER EMAIL
const getCustomerEmail = (order) => {
return (
order.userId?.email ||
order.email ||
order.customer?.email ||
"Not available"
);
};

// ORDER ID
const getOrderId = (order) => {
return order._id || order.id || order.orderId || "N/A";
};

// ORDER DATE
const getOrderDate = (order) => {
const date = order.orderDate || order.createdAt || order.date;

if (!date) return "Not available";

const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
  return date;
}

return parsedDate.toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

};

// ORDER TOTAL
const getOrderTotal = (order) => {
return Number(
order.totalAmount ?? order.total ?? order.grandTotal ?? 0
);
};

// ITEM COUNT
const getItemCount = (order) => {
if (typeof order.items === "number") {
return order.items;
}

if (Array.isArray(order.items)) {
  return order.items.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );
}

if (Array.isArray(order.cartItems)) {
  return order.cartItems.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );
}

return 0;


};

// ORDER STATUS
const getOrderStatus = (order) => {
return order.orderStatus || order.status || "Pending";
};

// PAYMENT STATUS
const getPaymentStatus = (order) => {
return order.paymentStatus || order.payment || "Pending";
};

// FILTER ORDERS
const filteredOrders = orders.filter((order) => {
const customerName = getCustomerName(order).toLowerCase();
const orderId = String(getOrderId(order)).toLowerCase();


const matchesSearch =
  customerName.includes(search.toLowerCase()) ||
  orderId.includes(search.toLowerCase());

const matchesStatus =
  statusFilter === "All" ||
  getOrderStatus(order) === statusFilter;

return matchesSearch && matchesStatus;


});

// STATUS CSS CLASS
const getStatusClass = (status) => {
switch (status) {
case "Delivered":
return "order-status delivered";
case "Processing":
return "order-status processing";
case "Shipped":
return "order-status shipped";
case "Cancelled":
return "order-status cancelled";
default:
return "order-status pending";
}
};

// OPEN UPDATE STATUS MODAL
const openEditStatus = (order) => {
setEditingOrder(order);
setNewStatus(getOrderStatus(order));
};

// UPDATE STATUS IN MONGODB
const updateOrderStatus = async () => {
if (!editingOrder || !newStatus) return;

try {
  setSaving(true);
  setError("");

  const token = getToken();

  if (!token) {
    throw new Error("Admin login required. Please log in again.");
  }

  const response = await fetch(
    `${API_URL}/${getOrderId(editingOrder)}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderStatus: newStatus,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update order status.");
  }

  // Reload orders so the page shows the saved database data.
  await fetchOrders();

  setEditingOrder(null);
  setNewStatus("");

  alert("Order status updated successfully!");
} catch (err) {
  console.error("Update order error:", err);
  alert(err.message || "Unable to update order status.");
} finally {
  setSaving(false);
}


};

const deleteOrder = async (order) => {
  const orderId = getOrderId(order);

  if (!orderId || orderId === "N/A") {
    alert("This order does not have a valid ID.");
    return;
  }

  if (!window.confirm(`Permanently delete order #${String(orderId).slice(-8)}?`)) {
    return;
  }

  try {
    setSaving(true);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error("Admin login required. Please log in again.");
    }

    const response = await fetch(`${API_URL}/${orderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : { message: "Order deletion is not enabled on the server yet. Deploy the latest backend, then try again." };

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete order.");
    }

    setOrders((previous) =>
      previous.filter((item) => String(getOrderId(item)) !== String(orderId))
    );
    alert(data.message || "Order deleted successfully.");
  } catch (err) {
    console.error("Delete order error:", err);
    alert(err.message || "Unable to delete order.");
  } finally {
    setSaving(false);
  }
};

return ( <div className="admin-orders-page">
{/* HEADER */} <section className="admin-orders-header"> <div className="admin-orders-container"> <div> <p className="admin-orders-label">Store Management</p> <h1>Manage Orders</h1> <p className="admin-orders-description">
View, track and manage customer orders. </p> </div>

      <div className="orders-total-badge">
        <FaShoppingCart />
        {orders.length} Total Orders
      </div>
    </div>
  </section>

  {/* CONTENT */}
  <section className="admin-orders-content">
    <div className="admin-orders-container">
      {/* SEARCH AND FILTER */}
      <div className="orders-controls">
        <div className="orders-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="orders-status-filters">
          {statuses.map((status) => (
            <button
              key={status}
              className={
                statusFilter === status
                  ? "order-filter active"
                  : "order-filter"
              }
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* HEADING */}
      <div className="orders-heading">
        <div>
          <h2>All Orders</h2>
          <p>{filteredOrders.length} orders found</p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div role="alert" style={{ marginBottom: "16px" }}>
          {error}
          <button
            type="button"
            onClick={fetchOrders}
            style={{ marginLeft: "12px" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ORDERS TABLE */}
      <div className="admin-orders-table-wrapper">
        <table className="admin-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="no-orders">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-orders">
                  <FaBoxOpen />
                  <h3>No Orders Found</h3>
                  <p>
                    {orders.length === 0
                      ? "No orders have been placed yet."
                      : "There are no orders matching your search."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={getOrderId(order)}>
                  <td>
                    <strong className="order-id">
                      #{String(getOrderId(order)).slice(-8)}
                    </strong>
                  </td>

                  <td>
                    <div className="customer-info">
                      <div className="customer-avatar">
                        {getCustomerName(order).charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{getCustomerName(order)}</strong>
                        <span>{getCustomerEmail(order)}</span>
                      </div>
                    </div>
                  </td>

                  <td>{getOrderDate(order)}</td>

                  <td>{getItemCount(order)}</td>

                  <td>
                    <strong className="order-total">
                      ₹{getOrderTotal(order).toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={
                        getPaymentStatus(order).toLowerCase() === "paid"
                          ? "payment-status paid"
                          : "payment-status pending"
                      }
                    >
                      {getPaymentStatus(order)}
                    </span>
                  </td>

                  <td>
                    <span className={getStatusClass(getOrderStatus(order))}>
                      {getOrderStatus(order)}
                    </span>
                  </td>

                  <td>
                    <div className="order-actions">
                      <button
                        type="button"
                        className="view-order-button"
                        title="View Order"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <FaEye />
                      </button>

                      <button
                        type="button"
                        className="edit-order-button"
                        title="Update Status"
                        onClick={() => openEditStatus(order)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        className="delete-order-button"
                        title="Delete Order"
                        aria-label={`Delete order ${String(getOrderId(order)).slice(-8)}`}
                        onClick={() => deleteOrder(order)}
                        disabled={saving}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  {/* VIEW ORDER MODAL */}
  {selectedOrder && (
    <div className="admin-order-modal-overlay">
      <div className="admin-order-modal">
        <div className="order-modal-header">
          <div>
            <h2>
              Order #{String(getOrderId(selectedOrder)).slice(-8)}
            </h2>
            <p>Order details</p>
          </div>

          <button
            type="button"
            className="close-order-modal"
            onClick={() => setSelectedOrder(null)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="order-modal-body">
          <div className="order-detail-row">
            <span>Customer</span>
            <strong>{getCustomerName(selectedOrder)}</strong>
          </div>

          <div className="order-detail-row">
            <span>Email</span>
            <strong>{getCustomerEmail(selectedOrder)}</strong>
          </div>

          <div className="order-detail-row">
            <span>Date</span>
            <strong>{getOrderDate(selectedOrder)}</strong>
          </div>

          <div className="order-detail-row">
            <span>Items</span>
            <strong>{getItemCount(selectedOrder)}</strong>
          </div>

          <div className="order-detail-row">
            <span>Payment</span>
            <strong>{getPaymentStatus(selectedOrder)}</strong>
          </div>

          <div className="order-detail-row">
            <span>Order Status</span>
            <strong>{getOrderStatus(selectedOrder)}</strong>
          </div>

          <div className="order-detail-row">
            <span>Shipping Address</span>
            <strong>
              {selectedOrder.shippingAddress || "Not available"}
            </strong>
          </div>

          <div className="order-detail-row total-row">
            <span>Total</span>
            <strong>
              ₹{getOrderTotal(selectedOrder).toLocaleString("en-IN")}
            </strong>
          </div>

          {Array.isArray(selectedOrder.items) &&
            selectedOrder.items.length > 0 && (
              <div style={{ marginTop: "18px" }}>
                <h3>Order Items</h3>

                {selectedOrder.items.map((item, index) => (
                  <div
                    className="order-detail-row"
                    key={item.productId || index}
                  >
                    <span>
                      {item.name || "Product"} × {item.quantity || 1}
                    </span>
                    <strong>
                      ₹
                      {(
                        Number(item.price || 0) *
                        Number(item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )}

  {/* UPDATE STATUS MODAL */}
  {editingOrder && (
    <div className="admin-order-modal-overlay">
      <div className="admin-order-modal small">
        <div className="order-modal-header">
          <div>
            <h2>Update Order</h2>
            <p>#{String(getOrderId(editingOrder)).slice(-8)}</p>
          </div>

          <button
            type="button"
            className="close-order-modal"
            onClick={() => setEditingOrder(null)}
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        <div className="order-status-form">
          <label>Order Status</label>

          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={saving}
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            className="save-order-status"
            onClick={updateOrderStatus}
            disabled={saving}
          >
            <FaSave />
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  )}
</div>

);
}

export default AdminOrders;