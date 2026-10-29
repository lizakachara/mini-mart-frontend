import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../css/ForgotPassword.css";

const API_URL = "https://mini-mart-cdkr.onrender.com/api/auth";

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [demoResetUrl, setDemoResetUrl] = useState("");
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (token && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/${token ? "reset-password" : "forgot-password"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            token ? { token, password } : { email }
          ),
        }
      );
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (!response.ok) {
        throw new Error(data.message || "Password reset request failed.");
      }

      setMessage(data.message);
      setDemoResetUrl(data.demoResetUrl || "");
      if (token) setComplete(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to contact the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="password-reset-page">
      <section className="password-reset-panel">
        <p className="password-reset-eyebrow">Mini Mart account</p>
        <h1>{token ? "Choose a new password" : "Forgot your password?"}</h1>
        <p className="password-reset-intro">
          {token
            ? "Set a new password to get back into your account."
            : "Enter the email address on your account and we will send a reset link."}
        </p>

        {!complete && (
          <form onSubmit={handleSubmit}>
            {token ? (
              <>
                <label className="password-reset-field">
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <label className="password-reset-field">
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </label>
              </>
            ) : (
              <label className="password-reset-field">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
            )}

            {error && <p className="password-reset-error" role="alert">{error}</p>}
            {message && <p className="password-reset-message" role="status">{message}</p>}
            {demoResetUrl && (
              <Link className="password-reset-demo-link" to={demoResetUrl}>
                Continue to reset password
              </Link>
            )}

            <button className="password-reset-submit" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : token
                ? "Reset password"
                : "Send reset link"}
            </button>
          </form>
        )}

        {complete && (
          <p className="password-reset-message" role="status">{message}</p>
        )}

        <Link className="password-reset-back" to="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export default ForgotPassword;