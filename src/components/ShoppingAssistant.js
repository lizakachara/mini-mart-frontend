import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../css/ShoppingAssistant.css";

const ASSISTANT_API = "http://localhost:5000/api/assistant";

function ShoppingAssistant() {
  const { token, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am your Mini Mart shopping assistant. Ask me for products, budgets, prices, or alternatives. Example: Suggest fruits under ₹200.",
      products: [],
    },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  if (!isLoggedIn) {
    return null;
  }

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((current) => [...current, { role: "customer", text, products: [] }]);
    setLoading(true);

    try {
      const response = await fetch(`${ASSISTANT_API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.message || data.reply || "I could not complete that request.",
          products: Array.isArray(data.products) ? data.products : [],
        },
      ]);
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach the Mini Mart assistant. Make sure the backend is running.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-root">
      {open && (
        <section className="assistant-window" aria-label="Mini Mart shopping assistant">
          <header className="assistant-header">
            <div>
              <strong>Mini Mart Assistant</strong>
              <span>Ask about real store products</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <FiX />
            </button>
          </header>

          <div className="assistant-messages" ref={listRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`assistant-bubble ${message.role}`}>
                <p>{message.text}</p>
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
            {loading && <div className="assistant-bubble assistant typing">Finding products...</div>}
          </div>

          <form className="assistant-form" onSubmit={sendMessage}>
            <input
              type="text"
              maxLength={400}
              placeholder="Ask about fruits, prices, or budget..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
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
