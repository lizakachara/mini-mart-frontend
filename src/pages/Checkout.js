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

const API_URL = "http://localhost:5000/api/orders";
const PROFILE_URL = "http://localhost:5000/api/auth/profile";

const BANKS = [
  "HDFC Bank",
  "SBI",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
];

function luhnCheck(number) {
  const digits = number.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return digits.length >= 13 && digits.length <= 19 && sum % 10 === 0;
}

function detectCardBrand(number) {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "RuPay";
  return "Card";
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isExpiryValid(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59);
  return expiry >= now;
}

function Checkout() {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [onlineChannel, setOnlineChannel] = useState("upi");
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({
    number: "",
    holder: "",
    expiry: "",
    cvv: "",
  });
  const [bank, setBank] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

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

  const buildPaymentPayload = () => {
    if (paymentMethod !== "Online Payment") return undefined;

    if (onlineChannel === "upi") {
      const value = upiId.trim().toLowerCase();
      if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(value)) {
        throw new Error("Enter a valid UPI ID, for example yourname@oksbi.");
      }
      return { channel: "upi", upiId: value };
    }

    if (onlineChannel === "card") {
      const number = card.number.replace(/\s/g, "");
      const holder = card.holder.trim();
      const cvv = card.cvv.trim();

      if (!luhnCheck(number)) {
        throw new Error("Enter a valid card number to pay online.");
      }
      if (holder.length < 2) {
        throw new Error("Enter the name printed on the card.");
      }
      if (!isExpiryValid(card.expiry)) {
        throw new Error("Enter a valid card expiry date.");
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        throw new Error("Enter a valid CVV.");
      }

      return {
        channel: "card",
        cardLast4: number.slice(-4),
        cardHolder: holder,
        cardBrand: detectCardBrand(number),
      };
    }

    if (!bank) {
      throw new Error("Select your bank to continue with net banking.");
    }

    return { channel: "netbanking", bank };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

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

    const authToken =
      token ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

    if (!authToken) {
      setError("Please log in before placing your order.");
      return;
    }

    const items = cartItems.map((item) => ({
      productId: item._id || item.id,
      name: item.name,
      image: item.image || "",
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      unit: item.unit || "",
    }));

    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isFinite(item.price) ||
          item.price < 0 ||
          item.quantity < 1
      )
    ) {
      setError(
        "One or more cart items have invalid product information. Please review your cart."
      );
      return;
    }

    let payment;
    try {
      payment = buildPaymentPayload();
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    const shippingAddress = [
      formData.fullName.trim(),
      formData.address.trim(),
      formData.city.trim(),
      formData.state.trim(),
      `Pincode: ${pincode}`,
    ].join(", ");

    const orderData = {
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      phone: mobile,
      ...(payment ? { payment } : {}),
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

      if (typeof clearCart === "function") {
        clearCart();
      }

      navigate("/order-confirmation", {
        state: {
          order: data.order || data,
          customerName: formData.fullName,
          totalAmount,
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

  const cardBrand = detectCardBrand(card.number);
  const payLabel =
    paymentMethod === "Online Payment"
      ? `Pay ₹${totalAmount.toLocaleString("en-IN")}`
      : `Place Order · ₹${totalAmount.toLocaleString("en-IN")}`;

  return (
    <div className="checkout-page">
      <div className="checkout-glow checkout-glow-one" />
      <div className="checkout-glow checkout-glow-two" />

      <div className="checkout-shell">
        <div className="checkout-heading">
          <p className="checkout-kicker">Secure grocery checkout</p>
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
                      Pay on delivery or complete a secure online payment now.
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
                  >
                    <FiLock />
                    <strong>Pay online</strong>
                    <span>UPI, card or net banking</span>
                  </button>
                </div>

                {paymentMethod === "Online Payment" && (
                  <div className="online-pay-panel">
                    <div className="channel-tabs">
                      <button
                        type="button"
                        className={onlineChannel === "upi" ? "active" : ""}
                        onClick={() => setOnlineChannel("upi")}
                      >
                        UPI
                      </button>
                      <button
                        type="button"
                        className={onlineChannel === "card" ? "active" : ""}
                        onClick={() => setOnlineChannel("card")}
                      >
                        Card
                      </button>
                      <button
                        type="button"
                        className={onlineChannel === "netbanking" ? "active" : ""}
                        onClick={() => setOnlineChannel("netbanking")}
                      >
                        Net banking
                      </button>
                    </div>

                    {onlineChannel === "upi" && (
                      <div className="pay-fields">
                        <label>
                          UPI ID
                          <input
                            type="text"
                            className="checkout-input"
                            placeholder="yourname@oksbi"
                            value={upiId}
                            onChange={(event) => setUpiId(event.target.value)}
                            autoComplete="off"
                          />
                        </label>
                        <p className="pay-hint">
                          We will request ₹{totalAmount.toLocaleString("en-IN")} from this UPI ID.
                        </p>
                      </div>
                    )}

                    {onlineChannel === "card" && (
                      <div className="card-pay-layout">
                        <div className="preview-card">
                          <div className="preview-card-top">
                            <span>Mini Mart Pay</span>
                            <strong>{cardBrand}</strong>
                          </div>
                          <p className="preview-card-number">
                            {card.number || "•••• •••• •••• ••••"}
                          </p>
                          <div className="preview-card-bottom">
                            <span>{card.holder || "CARD HOLDER"}</span>
                            <span>{card.expiry || "MM/YY"}</span>
                          </div>
                        </div>

                        <div className="pay-fields">
                          <label>
                            Card number
                            <input
                              type="text"
                              className="checkout-input"
                              placeholder="ACCT-000015"
                              value={card.number}
                              onChange={(event) =>
                                setCard((previous) => ({
                                  ...previous,
                                  number: formatCardNumber(event.target.value),
                                }))
                              }
                              inputMode="numeric"
                              autoComplete="cc-number"
                            />
                          </label>
                          <label>
                            Name on card
                            <input
                              type="text"
                              className="checkout-input"
                              placeholder="Name as on card"
                              value={card.holder}
                              onChange={(event) =>
                                setCard((previous) => ({
                                  ...previous,
                                  holder: event.target.value.toUpperCase(),
                                }))
                              }
                              autoComplete="cc-name"
                            />
                          </label>
                          <div className="pay-fields-row">
                            <label>
                              Expiry
                              <input
                                type="text"
                                className="checkout-input"
                                placeholder="MM/YY"
                                value={card.expiry}
                                onChange={(event) =>
                                  setCard((previous) => ({
                                    ...previous,
                                    expiry: formatExpiry(event.target.value),
                                  }))
                                }
                                inputMode="numeric"
                                autoComplete="cc-exp"
                              />
                            </label>
                            <label>
                              CVV
                              <input
                                type="password"
                                className="checkout-input"
                                placeholder="•••"
                                value={card.cvv}
                                onChange={(event) =>
                                  setCard((previous) => ({
                                    ...previous,
                                    cvv: event.target.value.replace(/\D/g, "").slice(0, 4),
                                  }))
                                }
                                inputMode="numeric"
                                autoComplete="cc-csc"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {onlineChannel === "netbanking" && (
                      <div className="pay-fields">
                        <label>
                          Choose bank
                          <select
                            className="checkout-input"
                            value={bank}
                            onChange={(event) => setBank(event.target.value)}
                          >
                            <option value="">Select your bank</option>
                            {BANKS.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p className="pay-hint">
                          You will be charged ₹{totalAmount.toLocaleString("en-IN")} through Mini Mart Pay.
                        </p>
                      </div>
                    )}

                    <div className="secure-note">
                      <FiShield />
                      Card details stay in your browser. We only store a payment reference after success.
                    </div>
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
                {cartItems.map((item) => (
                  <div
                    className="checkout-item"
                    key={item._id || item.id || item.name}
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
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-line">
                <span>Delivery</span>
                <span className="free-text">Free</span>
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
              </div>

              {error && (
                <div className="checkout-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="place-order-button"
                disabled={placingOrder}
              >
                {placingOrder ? (
                  paymentMethod === "Online Payment"
                    ? "Processing payment..."
                    : "Placing order..."
                ) : (
                  <>
                    <FiCheck />
                    {payLabel}
                  </>
                )}
              </button>

              <p className="trust-row">
                <FiLock /> Encrypted checkout · Free same-day delivery slot
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
                ? "Confirming your payment"
                : "Placing your order"}
            </h3>
            <p>
              {paymentMethod === "Online Payment"
                ? "Hold on while Mini Mart Pay completes this transaction."
                : "Saving your grocery order."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
