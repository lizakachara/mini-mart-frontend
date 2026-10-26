import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
} from "react-icons/fa";

import "../css/AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ADMIN LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // Connect to the backend login API
      const response = await fetch(
        "https://mini-mart-cdkr.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      // Handle login errors
      if (!response.ok) {
        setError(
          data.message || "Invalid email or password."
        );
        return;
      }

      // Make sure the account is an admin
      if (data.user?.role !== "admin") {
        setError(
          "Access denied. Admin account required."
        );
        return;
      }

      // Check that the backend returned a token
      if (!data.token) {
        setError(
          "Authentication failed. Please try again."
        );
        return;
      }

      // Save admin authentication details
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem(
        "adminEmail",
        data.user.email
      );
      localStorage.setItem(
        "adminToken",
        data.token
      );

      // Save admin information
      localStorage.setItem(
        "adminUser",
        JSON.stringify(data.user)
      );

      // Open admin dashboard
      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Admin Login Error:", error);

      setError(
        "Cannot connect to the server. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        {/* LEFT SIDE */}
        <div className="admin-login-left">
          <div className="admin-login-brand">
            Mini Mart
          </div>

          <p className="admin-login-label">
            ADMIN PANEL
          </p>

          <h1>
            Welcome Back,
            <br />
            <span>Admin!</span>
          </h1>

          <p className="admin-login-description">
            Login to manage your Mini Mart
            store, products, orders and customers.
          </p>

          <div className="admin-login-icon">
            <FaUserShield />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="admin-login-right">
          <div className="admin-login-heading">
            <h2>Admin Login</h2>

            <p>
              Sign in to access your dashboard
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="admin-login-form"
          >
            {/* EMAIL */}
            <div className="admin-input-group">
              <label>Email Address</label>

              <div className="admin-input-wrapper">
                <FaEnvelope />

                <input
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="admin-input-group">
              <label>Password</label>

              <div className="admin-input-wrapper">
                <FaLock />

                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div
                className="admin-login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Logging in..."
                  : "Login to Dashboard"}
              </span>

              {!loading && <FaArrowRight />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;