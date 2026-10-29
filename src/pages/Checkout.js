import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  FiMapPin,
  FiCreditCard,
  FiShield,
  FiCheck,
  FiLock,
  FiShoppingBag,
  FiTruck,
  FiArrowLeft,
} from "react-icons/fi";
import "../css/Checkout.css";

const API_URL = "https://mini-mart-cdkr.onrender.com/api/orders";
const PROFILE_URL = "https://mini-mart-cdkr.onrender.com/api/auth/profile";

function Checkout() {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [cardData, setCardData] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [activePayment, setActivePayment] = useState(null);
  const [serverOrder, setServerOrder] = useState(null);
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState(60);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [completingDemoPayment, setCompletingDemoPayment] = useState(false);
  const [pendingCardPayment, setPendingCardPayment] = useState(null);
  const [completingCardPayment, setCompletingCardPayment] = useState(false);
  const authToken =
    token || sessionStorage.getItem("token") || localStorage.getItem("token");

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      ),
    [cartItems]
  );

  const itemCount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (Number(item.quantity) || 1),
        0
      ),
    [cartItems]
  );

  const displayedItems = serverOrder?.items || cartItems;
  const displayedTotalAmount = Number(serverOrder?.totalAmount ?? totalAmount);

  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      try {
        const response = await fetch(PROFILE_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) return;

        const customer = data.user || data;
        setFormData((previous) => ({
          ...previous,
          fullName: previous.fullName || customer.name || user?.name || "",
          mobile: previous.mobile || customer.phone || user?.phone || "",
          address: previous.address || customer.address || "",
        }));
      } catch (err) {
        console.error("Checkout profile load:", err);
      }
    };

    loadProfile();
  }, [token, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "number") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
    } else if (name === "expiry") {
      const digits = value.replace(/\D/g, "").slice(0, 4);
      nextValue = digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
    } else if (name === "cvv") {
      nextValue = value.replace(/\D/g, "").slice(0, 3);
    }

    setCardData((previous) => ({ ...previous, [name]: nextValue }));
  };

  const completeCardPayment = async (cardPayment) => {
    if (!cardPayment || !authToken || completingCardPayment) return;

    setError("");
    setCompletingCardPayment(true);

    try {
      const response = await fetch(
        `${API_URL}/${cardPayment.orderId}/payment/demo-complete`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete the card payment.");
      }

      if (typeof clearCart === "function") clearCart();
      setPendingCardPayment(null);
      navigate("/order-confirmation", {
        state: {
          order: data.order,
          customerName: formData.fullName,
          totalAmount: data.order.totalAmount,
        },
      });
    } catch (paymentError) {
      console.error("Complete Card Payment Error:", paymentError);
      setError(paymentError.message || "Unable to complete the card payment.");
    } finally {
      setCompletingCardPayment(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (activePayment || pendingCardPayment) return;

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const mobile = formData.mobile.trim();
    const pincode = formData.pincode.trim();

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    if (!authToken) {
      setError("Please log in before placing your order.");
      return;
    }

    if (paymentMethod === "Card Payment") {
      const cardNumber = cardData.number.replace(/\s/g, "");
      const [monthText, yearText] = cardData.expiry.split("/");
      const month = Number(monthText);
      const year = Number("20" + yearText);
      const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);
      const testCardIsValid =
        cardData.holder.trim().length >= 2 &&
        cardNumber === "4242424242424242" &&
        month >= 1 &&
        month <= 12 &&
        yearText &&
        yearText.length === 2 &&
        expiryDate > new Date() &&
        /^\d{3}$/.test(cardData.cvv);

      if (!testCardIsValid) {
        setError("Use the test card details shown below. No real card is charged.");
        return;
      }
    }

    const items = cartItems.map((item) => ({
      productId: item._id || item.id,
      quantity: Number(item.quantity) || 1,
    }));

    if (
      items.some(
        (item) =>
          !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1
      )
    ) {
      setError(
        "One or more cart items have invalid product information. Please review your cart."
      );
      return;
    }

    const shippingAddress = [
      formData.fullName.trim(),
      formData.address.trim(),
      formData.city.trim(),
      formData.state.trim(),
      "Pincode: " + pincode
    ].join(", ");

    const orderData = {
      items,
      paymentMethod:
        paymentMethod === "Card Payment" ? "Online Payment" : paymentMethod,
      shippingAddress,
      phone: mobile,
    };

    try {
      setPlacingOrder(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not place your order.");
      }

      if (paymentMethod === "Online Payment") {
        if (!data.order?._id || !data.paymentQr?.imageUrl || !data.paymentQr?.expiresAt) {
          throw new Error("The payment server returned an invalid QR response.");
        }

        setPaymentExpired(false);
        setPaymentSecondsLeft(60);
        setServerOrder(data.order);
        setActivePayment({
          orderId: data.order._id,
          imageUrl: data.paymentQr.imageUrl,
          expiresAt: data.paymentQr.expiresAt,
          order: data.order,
        });
        return;
      }

      if (paymentMethod === "Card Payment") {
        if (!data.order?._id) {
          throw new Error("The payment server returned an invalid card order.");
        }

        const cardPayment = { orderId: data.order._id, order: data.order };
        setPendingCardPayment(cardPayment);
        await completeCardPayment(cardPayment);
        return;
      }

      if (typeof clearCart === "function") {
        clearCart();
      }

      navigate("/order-confirmation", {
        state: {
          order: data.order || data,
          customerName: formData.fullName,
          totalAmount: data.order?.totalAmount ?? totalAmount,
        },
      });
    } catch (err) {
      console.error("Place Order Error:", err);
      setError(
        err.message || "Something went wrong while placing your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCompleteDemoPayment = async () => {
    if (!activePayment || !authToken || completingDemoPayment) return;

    setError("");
    setCompletingDemoPayment(true);

    try {
      const response = await fetch(
        `${API_URL}/${activePayment.orderId}/payment/demo-complete`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete the payment.");
      }

      if (typeof clearCart === "function") clearCart();
      setActivePayment(null);
      navigate("/order-confirmation", {
        state: {
          order: data.order,
          customerName: formData.fullName,
          totalAmount: data.order.totalAmount,
        },
      });
    } catch (demoError) {
      setError(demoError.message || "Unable to complete the payment.");
    } finally {
      setCompletingDemoPayment(false);
    }
  };

  useEffect(() => {
    if (!activePayment || !authToken) return undefined;

    let stopped = false;
    let pollTimeout;
    const expiresAt = new Date(activePayment.expiresAt).getTime();

    const checkPayment = async () => {
      if (stopped) return;

      setPaymentSecondsLeft(
        Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      );

      try {
        const response = await fetch(
          `${API_URL}/${activePayment.orderId}/payment`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to verify payment.");
        }

        if (data.paymentStatus === "Paid") {
          if (typeof clearCart === "function") clearCart();
          setActivePayment(null);
          navigate("/order-confirmation", {
            state: {
              order: data.order,
              customerName: formData.fullName,
              totalAmount: data.order.totalAmount,
            },
          });
          return;
        }

        if (data.paymentStatus === "Expired" || Date.now() >= expiresAt) {
          setActivePayment(null);
          setPaymentExpired(true);
          return;
        }
      } catch (paymentError) {
        setError(paymentError.message || "Unable to verify payment.");
      }

      if (!stopped) pollTimeout = setTimeout(checkPayment, 2000);
    };

    checkPayment();

    return () => {
      stopped = true;
      clearTimeout(pollTimeout);
    };
  }, [activePayment, authToken, clearCart, formData.fullName, navigate]);

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-shell">
          <div className="empty-checkout">
            <span className="empty-checkout-icon">🧺</span>
            <h2>Your basket is empty</h2>
            <p>Add some groceries before heading to checkout.</p>
            <Link to="/products" className="checkout-shopping-button">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const payLabel =
    paymentMethod === "Online Payment"
      ? activePayment
        ? "UPI payment pending..."
        : paymentExpired
          ? `Generate new QR · ₹${displayedTotalAmount.toLocaleString("en-IN")}`
          : `Generate UPI QR · ₹${displayedTotalAmount.toLocaleString("en-IN")}`
      : paymentMethod === "Card Payment"
        ? `Pay by card · ₹${displayedTotalAmount.toLocaleString("en-IN")}`
        : `Place Order · ₹${displayedTotalAmount.toLocaleString("en-IN")}`;

  return (
    <div className="checkout-page">
      <div className="checkout-glow checkout-glow-one" />
      <div className="checkout-glow checkout-glow-two" />

      <div className="checkout-shell">
        <div className="checkout-heading">
          <p className="checkout-kicker">Grocery checkout</p>
          <h1>Almost there</h1>
          <p>Confirm delivery details and pay in a few seconds.</p>
        </div>

        <ol className="checkout-steps">
          <li className="done">
            <span>1</span>
            Cart
          </li>
          <li className="current">
            <span>2</span>
            Delivery & pay
          </li>
          <li>
            <span>3</span>
            Confirmation
          </li>
        </ol>

        <form onSubmit={handleSubmit}>
          <div className="checkout-layout">
            <div className="checkout-main">
              <section className="checkout-card">
                <div className="checkout-card-title">
                  <span className="checkout-icon-badge">
                    <FiMapPin />
                  </span>
                  <div>
                    <h4>Delivery information</h4>
                    <p className="checkout-card-text">
                      Where should we drop off your groceries?
                    </p>
                  </div>
                </div>

                <div className="checkout-form-grid">
                  <label className="span-2">
                    Full name
                    <input
                      type="text"
                      name="fullName"
                      className="checkout-input"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={Boolean(activePayment)}
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    Mobile number
                    <input
                      type="tel"
                      name="mobile"
                      className="checkout-input"
                      placeholder="10-digit mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      disabled={Boolean(activePayment)}
                      autoComplete="tel"
                      maxLength="10"
                      inputMode="numeric"
                      required
                    />
                  </label>

                  <label>
                    Pincode
                    <input
                      type="text"
                      name="pincode"
                      className="checkout-input"
                      placeholder="6-digit pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      disabled={Boolean(activePayment)}
                      autoComplete="postal-code"
                      maxLength="6"
                      inputMode="numeric"
                      required
                    />
                  </label>

                  <label className="span-2">
                    Address
                    <textarea
                      name="address"
                      className="checkout-input"
                      rows="3"
                      placeholder="House no, street, landmark"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={Boolean(activePayment)}
                      autoComplete="street-address"
                      required
                    />
                  </label>

                  <label>
                    City
                    <input
                      type="text"
                      name="city"
                      className="checkout-input"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={Boolean(activePayment)}
                      autoComplete="address-level2"
                      required
                    />
                  </label>

                  <label>
                    State
                    <input
                      type="text"
                      name="state"
                      className="checkout-input"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleChange}
                      disabled={Boolean(activePayment)}
                      autoComplete="address-level1"
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="checkout-card">
                <div className="checkout-card-title">
                  <span className="checkout-icon-badge">
                    <FiCreditCard />
                  </span>
                  <div>
                    <h4>Payment method</h4>
                    <p className="checkout-card-text">
                      Choose cash on delivery, UPI QR, or card.
                    </p>
                  </div>
                </div>

                <div className="payment-grid">
                  <button
                    type="button"
                    className={
                      paymentMethod === "Cash on Delivery"
                        ? "payment-tile selected"
                        : "payment-tile"
                    }
                    onClick={() => setPaymentMethod("Cash on Delivery")}
                    disabled={Boolean(activePayment || pendingCardPayment)}
                  >
                    <FiTruck />
                    <strong>Cash on Delivery</strong>
                    <span>Pay when the bag arrives</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "Online Payment"
                        ? "payment-tile selected"
                        : "payment-tile"
                    }
                    onClick={() => setPaymentMethod("Online Payment")}
                    disabled={Boolean(activePayment || pendingCardPayment)}
                  >
                    <FiLock />
                    <strong>UPI QR</strong>
                    <span>Test payment · no real charge</span>
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod === "Card Payment"
                        ? "payment-tile selected"
                        : "payment-tile"
                    }
                    onClick={() => setPaymentMethod("Card Payment")}
                    disabled={Boolean(activePayment || pendingCardPayment)}
                  >
                    <FiCreditCard />
                    <strong>Card</strong>
                    <span>Test payment · no real charge</span>
                  </button>
                </div>

                {paymentMethod === "Online Payment" && (
                  <div className="online-pay-panel">
                    <div className="qr-payment-heading">
                      <strong>UPI QR payment</strong>
                      <span>Fixed amount · 1 minute</span>
                    </div>

                    {activePayment ? (
                      <div className="payment-qr-view">
                        <img
                          src={activePayment.imageUrl}
                          alt={`UPI payment QR for ₹${activePayment.order.totalAmount}`}
                        />
                        <strong>
                          ₹{Number(activePayment.order.totalAmount).toLocaleString("en-IN")}
                        </strong>
                        <span>
                          {paymentSecondsLeft > 0
                            ? `Scan within ${String(Math.floor(paymentSecondsLeft / 60)).padStart(2, "0")}:${String(paymentSecondsLeft % 60).padStart(2, "0")}`
                            : "Checking payment status..."}
                        </span>
                        <p>Scanning this code will not charge money.</p>
                        <button
                          className="demo-payment-complete-button"
                          type="button"
                          onClick={handleCompleteDemoPayment}
                          disabled={completingDemoPayment || paymentSecondsLeft === 0}
                        >
                          {completingDemoPayment
                            ? "Completing payment..."
                            : "Complete test payment"}
                        </button>
                      </div>
                    ) : paymentExpired ? (
                      <p className="payment-qr-expired" role="status">
                        This QR has expired. Generate a new one to try again.
                      </p>
                    ) : (
                      <p className="pay-hint">
                        A QR for ₹{displayedTotalAmount.toLocaleString("en-IN")} will appear. It does not collect money.
                      </p>
                    )}

                    <div className="secure-note">
                      <FiShield />
                      The amount is fixed by the server. No real payment is made.
                    </div>
                  </div>
                )}

                {paymentMethod === "Card Payment" && (
                  <div className="online-pay-panel">
                    {pendingCardPayment ? (
                      <div className="payment-qr-view">
                        <strong>Card payment pending</strong>
                        <p>No money has been charged. Retry to finish this test payment.</p>
                        <button
                          className="demo-payment-complete-button"
                          type="button"
                          onClick={() => completeCardPayment(pendingCardPayment)}
                          disabled={completingCardPayment}
                        >
                          {completingCardPayment
                            ? "Completing payment..."
                            : "Complete test payment"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="card-pay-layout">
                          <div className="preview-card" aria-hidden="true">
                            <div className="preview-card-top">
                              <span>TEST CARD</span>
                              <span>•••</span>
                            </div>
                            <div className="preview-card-number">
                              {cardData.number || "•••• •••• •••• 4242"}
                            </div>
                            <div className="preview-card-bottom">
                              <span>{cardData.holder || "CARDHOLDER"}</span>
                              <span>{cardData.expiry || "MM/YY"}</span>
                            </div>
                          </div>

                          <div className="pay-fields">
                            <label>
                              Cardholder name
                              <input
                                className="checkout-input"
                                name="holder"
                                autoComplete="off"
                                value={cardData.holder}
                                onChange={handleCardChange}
                                required
                              />
                            </label>
                            <label>
                              Test card number
                              <input
                                className="checkout-input"
                                name="number"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="4242 4242 4242 4242"
                                value={cardData.number}
                                onChange={handleCardChange}
                                required
                              />
                            </label>
                            <div className="pay-fields-row">
                              <label>
                                Expiry date
                                <input
                                  className="checkout-input"
                                  name="expiry"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  placeholder="MM/YY"
                                  maxLength="5"
                                  value={cardData.expiry}
                                  onChange={handleCardChange}
                                  required
                                />
                              </label>
                              <label>
                                Security code
                                <input
                                  className="checkout-input"
                                  name="cvv"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  placeholder="123"
                                  maxLength="3"
                                  value={cardData.cvv}
                                  onChange={handleCardChange}
                                  required
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="secure-note">
                          Test card only: use 4242 4242 4242 4242, any future
                          expiry, and any 3-digit code. Card details stay in
                          this browser and are never sent or charged.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>

            <aside className="checkout-summary">
              <div className="summary-ribbon">
                <FiShoppingBag />
                {itemCount} {itemCount === 1 ? "item" : "items"} ready to go
              </div>

              <h4>Order summary</h4>

              <div className="checkout-items">
                {displayedItems.map((item) => (
                  <div
                    className="checkout-item"
                    key={item._id || item.productId || item.id || item.name}
                  >
                    <div className="checkout-item-image">
                      <img
                        src={
                          item.image ||
                          "https://placehold.co/100x100?text=Product"
                        }
                        alt={item.name}
                      />
                    </div>
                    <div className="checkout-item-info">
                      <h6>{item.name}</h6>
                      <p>
                        {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <strong>
                      ₹
                      {(
                        Number(item.price) * Number(item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="summary-line">
                <span>Subtotal</span>
                <span>₹{displayedTotalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-line">
                <span>Delivery</span>
                <span className="free-text">Free</span>
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <strong>₹{displayedTotalAmount.toLocaleString("en-IN")}</strong>
              </div>

              {error && (
                <div className="checkout-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="place-order-button"
                disabled={
                  placingOrder ||
                  Boolean(activePayment || pendingCardPayment) ||
                  completingCardPayment
                }
              >
                {placingOrder ? (
                  paymentMethod === "Online Payment"
                      ? "Generating payment QR..."
                    : paymentMethod === "Card Payment"
                      ? "Processing test card..."
                    : "Placing order..."
                ) : (
                  <>
                    <FiCheck />
                    {payLabel}
                  </>
                )}
              </button>

              <p className="trust-row">
                <FiLock /> Test payments are not charged · Free same-day delivery slot
              </p>

              <Link to="/cart" className="back-cart-link">
                <FiArrowLeft /> Back to cart
              </Link>
            </aside>
          </div>
        </form>
      </div>

      {placingOrder && (
        <div className="checkout-overlay" role="status">
          <div className="checkout-overlay-card">
            <div className="pay-spinner" />
            <h3>
              {paymentMethod === "Online Payment"
                ? "Generating QR"
                : "Placing your order"}
            </h3>
            <p>
              {paymentMethod === "Online Payment"
                ? "Setting up a fixed-amount UPI payment."
                : "Saving your grocery order."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
