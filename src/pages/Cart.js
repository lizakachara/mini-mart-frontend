import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

import {
FiShoppingBag,
FiArrowLeft,
FiMinus,
FiPlus,
FiTrash2,
} from "react-icons/fi";

import "../css/Cart.css";

function Cart() {
const {
cartItems,
removeFromCart,
increaseQuantity,
decreaseQuantity,
} = useContext(CartContext);

// CALCULATE TOTAL AMOUNT
const totalAmount = cartItems.reduce(
(total, item) =>
total +
(Number(item.price) || 0) *
(Number(item.quantity) || 1),
0
);

// IDENTIFY PRODUCTS BY DATABASE ID WHEN AVAILABLE
const getProductKey = (item) =>
item._id || item.id || item.name;

return ( <div className="cart-page"> <div className="cart-container"> <h1>Shopping Cart</h1>

 
    <p className="cart-subtitle">
      Review your items before checkout.
    </p>

    {cartItems.length === 0 ? (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>

        <p>Add some products to your cart.</p>

        <Link
          to="/products"
          className="continue-shopping-button"
        >
          <FiArrowLeft />
          <span>Continue Shopping</span>
        </Link>
      </div>
    ) : (
      <div className="cart-layout">
        {/* CART ITEMS */}
        <div className="cart-items">
          {cartItems.map((item) => {
            const productKey = getProductKey(item);
            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;

            return (
              <div
                className="cart-item"
                key={productKey}
              >
                {/* PRODUCT IMAGE */}
                <div className="cart-product-image">
                  <img
                    src={
                      item.image ||
                      "https://placehold.co/120x120?text=Mini+Mart"
                    }
                    alt={item.name}
                  />
                </div>

                {/* PRODUCT INFORMATION */}
                <div className="cart-product-info">
                  <h3>{item.name}</h3>

                  {item.category && (
                    <span className="product-category">
                      {typeof item.category === "string"
                        ? item.category
                        : item.category.name}
                    </span>
                  )}

                  <p>
                    ₹{price.toLocaleString("en-IN")}

                    {item.unit && (
                      <span> / {item.unit}</span>
                    )}
                  </p>
                </div>

                {/* QUANTITY CONTROLS */}
                <div className="quantity-control">
                  <button
                    type="button"
                    className="quantity-button"
                    onClick={() =>
                      decreaseQuantity(productKey)
                    }
                    disabled={quantity <= 1}
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    <FiMinus />
                  </button>

                  <span className="quantity-value">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    className="quantity-button"
                    onClick={() =>
                      increaseQuantity(productKey)
                    }
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    <FiPlus />
                  </button>
                </div>

                {/* ITEM TOTAL AND REMOVE */}
                <div className="cart-item-right">
                  <h3>
                    ₹{(price * quantity).toLocaleString("en-IN")}
                  </h3>

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() =>
                      removeFromCart(productKey)
                    }
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <FiTrash2 />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY */}
        <div className="order-summary">
          <h2>Order Summary</h2>

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>

            <span>
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="summary-row">
            <span>Delivery</span>

            <span className="free-delivery">
              Free
            </span>
          </div>

          <hr />

          <div className="summary-total">
            <span>Total</span>

            <strong>
              ₹{totalAmount.toLocaleString("en-IN")}
            </strong>
          </div>

          {/* CHECKOUT */}
          <Link
            to="/checkout"
            className="proceed-checkout-button"
          >
            <FiShoppingBag />
            <span>Proceed to Checkout</span>
          </Link>

          {/* CONTINUE SHOPPING */}
          <Link
            to="/products"
            className="continue-shopping-button"
          >
            <FiArrowLeft />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    )}
  </div>
</div>
 

);
}

export default Cart;
