import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        setLoading(false);
        return;
      }

      // Save authentication information
      login(
  data.user,
  data.token,
  rememberMe
);

      // Login successful
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);

      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="container">

        <div className="login-card">

          {/* Left Side */}

          <div className="login-left">

            <div className="login-left-content">

              <div className="login-visual">
                <div className="visual-circle">M</div>
              </div>

              <h2>
                Freshness
                <br />
                Delivered
              </h2>

              <p>
                Your everyday groceries,
                <br />
                just a few clicks away.
              </p>

              <div className="login-features">

                <span>
                  Fresh Products
                </span>

                <span>
                  Fast Delivery
                </span>

              </div>

            </div>

          </div>


          {/* Right Side */}

          <div className="login-right">

            <div className="login-form-container">

              <h1>
                Welcome Back!
              </h1>

              <p className="login-subtitle">
                Login to continue shopping
              </p>


              <form onSubmit={handleSubmit}>

                {/* Email */}

                <div className="form-group">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />

                </div>


                {/* Password */}

                <div className="form-group">

                  <label>
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                </div>


                {/* Error Message */}

                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}


                {/* Remember & Forgot */}

                <div className="login-options">

                  <div className="remember-option">

                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(e.target.checked)
                      }
                    />

                    <label htmlFor="rememberMe">
                      Remember me
                    </label>

                  </div>


                  <button
                    type="button"
                    className="forgot-button"
                    onClick={() =>
                      alert(
                        "Password reset will be added later."
                      )
                    }
                  >
                    Forgot Password?
                  </button>

                </div>


                {/* Login Button */}

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

              </form>


              {/* Register Link */}

              <div className="register-text">

                Don't have an account?

                <Link to="/register">
                  Create Account
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;