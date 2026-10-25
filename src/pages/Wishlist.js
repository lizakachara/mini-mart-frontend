import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import { FaHeart, FaTrash, FaShoppingCart } from "react-icons/fa";
import "../css/Wishlist.css";

function Wishlist() {
  const { addToCart } = useContext(CartContext);

  const [wishlist, setWishlist] = React.useState(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  const removeFromWishlist = (productName) => {
    const updatedWishlist = wishlist.filter(
      (product) => product.name !== productName
    );

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <div className="wishlist-page">

      {/* Wishlist Header */}
      <section className="wishlist-header">
        <div className="wishlist-container">

          <div>
            <h1>My Wishlist</h1>

            <p>
              Save your favorite products and shop them anytime.
            </p>
          </div>

          <div className="wishlist-count">
            <FaHeart />
            <span>
              {wishlist.length}{" "}
              {wishlist.length === 1 ? "Item" : "Items"}
            </span>
          </div>

        </div>
      </section>

      {/* Wishlist Products */}
      <section className="wishlist-products">

        <div className="wishlist-container">

          {wishlist.length === 0 ? (

            <div className="empty-wishlist">

              <div className="empty-wishlist-icon">
                <FaHeart />
              </div>

              <h2>Your Wishlist is Empty</h2>

              <p>
                Save your favorite products here and shop them later.
              </p>

              <Link
                to="/products"
                className="browse-products-button"
              >
                <FaShoppingCart />
                Browse Products
              </Link>

            </div>

          ) : (

            <div className="wishlist-grid">

              {wishlist.map((product) => (

                <div
                  className="wishlist-card"
                  key={product.name}
                >

                  {/* Product Image */}
                  <div className="wishlist-image-wrapper">

                    <img
                      src={product.image}
                      alt={product.name}
                      className="wishlist-image"
                    />

                    {/* Remove Button */}
                    <button
                      className="wishlist-remove-button"
                      onClick={() =>
                        removeFromWishlist(product.name)
                      }
                      title="Remove from wishlist"
                    >
                      <FaTrash />
                    </button>

                  </div>

                  {/* Product Information */}
                  <div className="wishlist-info">

                    <span className="wishlist-category">
                      {product.category}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="wishlist-price">
                      ₹{product.price}
                      <span> / {product.unit}</span>
                    </p>

                    {/* Add To Cart */}
                    <button
                      className="wishlist-cart-button"
                      onClick={() =>
                        handleAddToCart(product)
                      }
                    >
                      <FaShoppingCart />
                      Add to Cart
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default Wishlist;