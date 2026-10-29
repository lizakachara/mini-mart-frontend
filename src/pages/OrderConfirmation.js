import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/OrderConfirmation.css";

function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;
  const customerName = location.state?.customerName;
  const totalAmount = location.state?.totalAmount ?? order?.totalAmount;

  const orderNumber = order?._id
    ? `MM${String(order._id).slice(-6).toUpperCase()}`
    : "MM" + Math.floor(100000 + Math.random() * 900000);

  const paymentStatus = order?.paymentStatus || "Pending";
  const paymentMethod = order?.paymentMethod || "Payment";
  const isDemoPayment = paymentMethod === "Demo Online Payment";
  const orderStatus = order?.orderStatus || "Pending";

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="confirmation-icon">✓</div>

          <h1>
            {isDemoPayment
              ? "Demo payment complete"
              : paymentStatus === "Paid"
              ? "Payment successful"
              : "Order placed successfully"}
          </h1>

          <p className="confirmation-message">
            {customerName ? `Thanks, ${customerName}. ` : "Thank you for shopping with Mini Mart. "}
            {isDemoPayment
              ? "This was a simulated payment. No real money was charged."
              : paymentStatus === "Paid"
              ? "Your online payment has been received and the order is confirmed."
              : "Your order has been received and will be prepared for delivery."}
          </p>

          <div className="order-number-box">
            <span>Order Number</span>
            <strong>{orderNumber}</strong>
          </div>

          {order?.paymentId ? (
            <p className="confirmation-message">
              Payment ID: {order.paymentId}
            </p>
          ) : null}

          <div className="confirmation-details">
            <div className="detail-item">
              <span>Order Status</span>
              <strong>{orderStatus}</strong>
            </div>

            <div className="detail-item">
              <span>Payment</span>
              <strong>
                {paymentStatus}
                {paymentMethod ? ` · ${paymentMethod}` : ""}
              </strong>
            </div>

            <div className="detail-item">
              <span>Amount</span>
              <strong>
                ₹{Number(totalAmount || 0).toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <div className="confirmation-info">
            <h5>What's Next?</h5>
            <p>
              We will pack your groceries and deliver them to the address you provided.
            </p>
          </div>

          <div className="confirmation-buttons">
            <Link to="/orders" className="shop-more-button">
              View Orders
            </Link>
            <Link to="/products" className="home-button">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
