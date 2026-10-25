import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import "../css/Navbar.css";

import { useAuth } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    user,
    isLoggedIn,
    logout,
  } = useAuth();

  const { cartItems } = useContext(CartContext);

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0
  );

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">

      <div className="navbar-container">

        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          Mini Mart
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>

          <Link
            to="/"
            onClick={closeMenu}
            className={
              location.pathname === "/"
                ? "active"
                : ""
            }
          >
            Home
          </Link>


          <Link
            to="/products"
            onClick={closeMenu}
            className={
              location.pathname === "/products"
                ? "active"
                : ""
            }
          >
            Products
          </Link>


          <Link
            to="/cart"
            onClick={closeMenu}
            className={`nav-cart ${
              location.pathname === "/cart"
                ? "active"
                : ""
            }`}
          >
            <FiShoppingCart />
            <span>Cart</span>
            <em className="cart-count">{cartCount}</em>
          </Link>

          {isLoggedIn && (
            <Link
              to="/wishlist"
              onClick={closeMenu}
              className={
                location.pathname === "/wishlist"
                  ? "active"
                  : ""
              }
            >
              Wishlist
            </Link>
          )}

          {isLoggedIn && (
            <Link
              to="/orders"
              onClick={closeMenu}
              className={
                location.pathname === "/orders"
                  ? "active"
                  : ""
              }
            >
              Orders
            </Link>
          )}


          {!isLoggedIn && (
            <Link
              to="/login"
              onClick={closeMenu}
              className={
                location.pathname === "/login"
                  ? "active"
                  : ""
              }
            >
              Login
            </Link>
          )}

        </div>


        <div className="navbar-actions">

          {isLoggedIn ? (
            <div className="logged-in-account">

              <Link
                to="/profile"
                className="account-button"
                onClick={closeMenu}
              >
                <FiUser />

                <span>
                  {user?.name || "My Account"}
                </span>
              </Link>

              <button
                type="button"
                className="navbar-logout-button"
                onClick={handleLogout}
                title="Logout"
              >
                <FiLogOut />
              </button>

            </div>
          ) : (

            <Link
              to="/login"
              className="account-button"
              onClick={closeMenu}
            >
              <FiUser />
              <span>Sign in</span>
            </Link>

          )}

        </div>

      </div>

    </nav>
  );
}

export default Navbar;
