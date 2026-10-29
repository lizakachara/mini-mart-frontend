import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiSend, FiTrash2, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../css/ShoppingAssistant.css";

const ASSISTANT_API =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api/assistant"
    : "https://mini-mart-cdkr.onrender.com/api/assistant";
const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! Ask about your orders or account, or browse products by category, price, or budget.",
  products: [],
  orders: [],
};

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatOrderDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ShoppingAssistant() {
  const { token, isLoggedIn, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(Boolean(token));
  const [historyOwner, setHistoryOwner] = useState(token || "");
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const listRef = useRef(null);
  const activeTokenRef = useRef(token);
  activeTokenRef.current = token;
  const visibleMessages = historyOwner === (token || "")
    ? messages
    : [WELCOME_MESSAGE];

  useEffect(() => {
    let cancelled = false;
    setHistoryOwner(token || "");
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setLoading(false);
    setClearing(false);

    if (!isLoggedIn || !token) {
      setHistoryLoading(false);
      return () => { cancelled = true; };
    }

    setHistoryLoading(true);

    const loadHistory = async () => {
      try {
        const response = await fetch(`${ASSISTANT_API}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your chat history.");
        }

        if (!cancelled && Array.isArray(data.messages) && data.messages.length) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Assistant history error:", error);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => { cancelled = true; };
  }, [isLoggedIn, token, user?.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading, historyLoading]);

  if (!isLoggedIn) {
    return null;
  }

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading || historyLoading) return;

    setInput("");
    setMessages((current) => [...current, { role: "customer", text, products: [] }]);
    setLoading(true);
    const requestToken = token;

    try {
      const response = await fetch(`${ASSISTANT_API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${requestToken}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "The assistant could not answer that.");
      }

      if (activeTokenRef.current !== requestToken) return;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.message || data.reply || "I could not complete that request.",
          products: Array.isArray(data.products) ? data.products : [],
          orders: Array.isArray(data.orders) ? data.orders : [],
        },
      ]);
    } catch (error) {
      console.error("Assistant error:", error);
      if (activeTokenRef.current !== requestToken) return;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach the Mini Mart assistant. Make sure the backend is running.",
          products: [],
          orders: [],
        },
      ]);
    } finally {
      if (activeTokenRef.current === requestToken) setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!token || loading || clearing) return;
    if (!window.confirm("Clear your chat history? This only affects your account.")) return;

    setClearing(true);
    const requestToken = token;
    try {
      const response = await fetch(`${ASSISTANT_API}/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${requestToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to clear your chat history.");
      }

      if (activeTokenRef.current !== requestToken) return;
      setMessages([WELCOME_MESSAGE]);
    } catch (error) {
      console.error("Clear assistant history error:", error);
      if (activeTokenRef.current !== requestToken) return;
      setMessages((current) => [
        ...current,
        { role: "assistant", text: error.message || "Unable to clear chat history.", products: [], orders: [] },
      ]);
    } finally {
      if (activeTokenRef.current === requestToken) setClearing(false);
    }
  };

  return (
    <div className="assistant-root">
      {open && (
        <section className="assistant-window" aria-label="Mini Mart shopping assistant">
          <header className="assistant-header">
            <div>
              <strong>Mini Mart Assistant</strong>
              <span>Private to your account</span>
            </div>
            <button
              type="button"
              onClick={clearChat}
              aria-label="Clear chat"
              title="Clear chat"
              disabled={loading || clearing}
            >
              <FiTrash2 />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <FiX />
            </button>
          </header>

          <div className="assistant-messages" ref={listRef}>
            {visibleMessages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`assistant-bubble ${message.role}`}>
                <p>{message.text}</p>
                {message.orders?.length > 0 && (
                  <div className="assistant-orders">
                    {message.orders.map((order) => (
                      <article key={order.id} className="assistant-order-card">
                        <div className="assistant-order-heading">
                          <strong>Order {order.orderNumber}</strong>
                          <span>{formatOrderDate(order.date)}</span>
                        </div>
                        <p>
                          {order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}
                        </p>
                        <div className="assistant-order-details">
                          <span>{order.orderStatus} · {order.paymentStatus}</span>
                          <strong>{formatCurrency(order.totalAmount)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {message.products?.length > 0 && (
                  <div className="assistant-products">
                    {message.products.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product-details/${product.id}`}
                        className="assistant-product-card"
                      >
                        <img
                          src={product.image || "https://placehold.co/80x80?text=Mini+Mart"}
                          alt={product.name}
                        />
                        <div>
                          <strong>{product.name}</strong>
                          <span>₹{Number(product.price).toLocaleString("en-IN")}</span>
                          <small>
                            {product.inStock
                              ? `${product.stock} in stock`
                              : "Out of stock"}
                          </small>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(loading || historyLoading) && (
              <div className="assistant-bubble assistant typing">
                {historyLoading ? "Loading your private chat..." : "Thinking..."}
              </div>
            )}
          </div>

          <form className="assistant-form" onSubmit={sendMessage}>
            <input
              type="text"
              maxLength={400}
              placeholder="Ask about fruits, prices, or budget..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={historyLoading}
            />
            <button type="submit" disabled={loading || historyLoading || !input.trim()} aria-label="Send message">
              <FiSend />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="assistant-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open shopping assistant"
      >
        <FiMessageCircle />
      </button>
    </div>
  );
}

export default ShoppingAssistant;
