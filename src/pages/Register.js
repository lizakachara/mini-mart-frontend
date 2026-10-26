import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Register.css";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://mini-mart-cdkr.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }

      setSuccess("Account created successfully!");

      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Go to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Registration Error:", error);

      setError(
        "Unable to connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="container">

        <div className="register-card">

          {/* Left Side */}

          <div className="register-left">

            <div className="register-left-content">

              <div className="register-visual">
                <div className="register-circle">M</div>
              </div>

              <h2>
                Start Your
                <br />
                Fresh Journey
              </h2>

              <p>
                Fresh groceries,
                <br />
                simple shopping,
                <br />
                happy living.
              </p>

              <div className="register-features">

                <span>
                  Quality Products
                </span>

                <span>
                  Easy Shopping
                </span>

              </div>

            </div>

          </div>


          {/* Right Side */}

          <div className="register-right">

            <div className="register-form-container">

              <h1>
                Create Account
              </h1>

              <p className="register-subtitle">
                Join Mini Mart and start shopping
              </p>


              <form onSubmit={handleSubmit}>

                {/* Full Name */}

                <div className="form-group">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    required
                  />

                </div>


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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                </div>


                {/* Confirm Password */}

                <div className="form-group">

                  <label>
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
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


                {/* Success Message */}

                {success && (
                  <div
                    style={{
                      color: "#188038",
                      background: "#eefaf1",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      marginBottom: "15px",
                      fontSize: "14px",
                    }}
                  >
                    {success}
                  </div>
                )}


                {/* Create Account */}

                <button
                  type="submit"
                  className="register-button"
                  disabled={loading}
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account"}
                </button>

              </form>


              {/* Login Link */}

              <div className="login-text">

                Already have an account?

                <Link to="/login">
                  Login
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;