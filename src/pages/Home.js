import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaShoppingCart,
  FaEye,
} from "react-icons/fa";

import { CartContext } from "../context/CartContext";
import "../css/Home.css";

const PRODUCTS_API = "http://localhost:5000/api/products";
const CATEGORIES_API = "http://localhost:5000/api/categories";

const CATEGORY_FALLBACK_IMAGES = {
  Vegetables:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
  Fruits:
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500",
  Dairy:
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500",
  Beverages:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500",
  Snacks:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
  Household:
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500",
};

const DEFAULT_CATEGORY_IMAGE =
  "https://placehold.co/500x400?text=Mini+Mart";

function getCategoryName(product) {
  if (!product) return "";
  return typeof product.category === "string"
    ? product.category
    : product.category?.name || "";
}

function Home() {
  const { addToCart } = useContext(CartContext);

  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  const [addedProduct, setAddedProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            fetch(PRODUCTS_API),
            fetch(CATEGORIES_API),
          ]);

        if (!productsResponse.ok) {
          throw new Error("Unable to load products.");
        }

        const productsData = await productsResponse.json();
        const fetchedProducts = Array.isArray(productsData)
          ? productsData
          : productsData.products || [];

        setProducts(
          fetchedProducts.filter(
            (product) => product.isActive !== false
          )
        );

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const fetchedCategories = (
            Array.isArray(categoriesData)
              ? categoriesData
              : categoriesData.categories || []
          ).filter(
            (item) => item && item.isActive !== false && item.name
          );

          setCategories(fetchedCategories);
        }
      } catch (err) {
        console.error("Home data error:", err);
        setError(
          err.message ||
            "Unable to connect to the store. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const popularProducts = [...products]
    .sort(
      (a, b) =>
        Number(b.rating || 0) - Number(a.rating || 0)
    )
    .slice(0, 6);

  const toggleWishlist = (product) => {
    const productId = product._id || product.name;

    const alreadyAdded = wishlist.some(
      (item) =>
        String(item.id) === String(productId) ||
        String(item._id) === String(productId) ||
        item.name === product.name
    );

    let updatedWishlist;

    if (alreadyAdded) {
      updatedWishlist = wishlist.filter(
        (item) =>
          String(item.id) !== String(productId) &&
          String(item._id) !== String(productId) &&
          item.name !== product.name
      );
    } else {
      updatedWishlist = [
        ...wishlist,
        {
          id: productId,
          _id: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          category: getCategoryName(product),
          rating: product.rating || 0,
          image: product.image,
          description: product.description,
        },
      ];
    }

    setWishlist(updatedWishlist);

    localStorage.setItem(
      "wishlist",
      JSON.stringify(updatedWishlist)
    );
  };

  const isInWishlist = (product) => {
    const productId = product._id || product.name;

    return wishlist.some(
      (item) =>
        String(item.id) === String(productId) ||
        String(item._id) === String(productId) ||
        item.name === product.name
    );
  };

  const handleAddToCart = (product) => {
    addToCart(product);

    setAddedProduct(product._id || product.name);

    setTimeout(() => {
      setAddedProduct("");
    }, 1000);
  };

  return (
    <div className="home-page">

      {/* =========================
          HERO SECTION
      ========================== */}

      <section className="hero-section">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>
        <div className="hero-glow hero-glow-three"></div>

        <div className="container hero-container">

          <div className="hero-content">

            <p className="hero-small-text">
              Fresh groceries, happy home
            </p>

            <h1>
              Good Food,
              <br />
              <span>Good Mood!</span>
            </h1>

            <p className="hero-description">
              Fresh and quality groceries delivered right to
              your doorstep.
            </p>

            <Link
              to="/products"
              className="hero-shop-button"
            >
              Shop Now
            </Link>

          </div>

          <div className="hero-image-container">
            <div className="hero-image-ring"></div>
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000"
                alt="Fresh groceries"
                className="hero-image"
              />
            </div>
            <div className="hero-orb hero-orb-one"></div>
            <div className="hero-orb hero-orb-two"></div>
          </div>

        </div>
      </section>


      {/* =========================
          SHOP BY CATEGORY
      ========================== */}

      <section className="categories-section">
        <div className="container">

          <div className="section-heading">
            <h2>Shop By Category</h2>
            <p>Everything you need for your everyday shopping</p>
          </div>

          {loading ? (
            <p className="home-status-text">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="home-status-text">
              Categories added by the store administrator will appear here.
            </p>
          ) : (
            <div className="category-grid">

              {categories.map((category, index) => (
                <Link
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className={`category-card accent-${index % 6}`}
                  key={category._id || category.name}
                >

                  <span className="category-image-wrap">
                    <img
                      src={
                        category.image ||
                        CATEGORY_FALLBACK_IMAGES[category.name] ||
                        DEFAULT_CATEGORY_IMAGE
                      }
                      alt={category.name}
                      className="category-image"
                    />
                  </span>

                  <h4>{category.name}</h4>

                </Link>
              ))}

            </div>
          )}

        </div>
      </section>


      {/* =========================
          POPULAR PRODUCTS
      ========================== */}

      <section className="popular-products-section">

        <div className="container">

          <div className="popular-heading">

            <div>

              <h2>
                Popular Products
              </h2>

              <p>
                Fresh choices for your everyday needs
              </p>

            </div>

            <Link
              to="/products"
              className="view-all-products-button"
            >
              View All Products
            </Link>

          </div>


          {/* PRODUCT GRID */}

          {loading ? (
            <p className="home-status-text">Loading products...</p>
          ) : error ? (
            <div className="home-status-text">
              <p>{error}</p>
              <button
                type="button"
                className="home-add-cart-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : popularProducts.length === 0 ? (
            <p className="home-status-text">
              Products added by the store administrator will appear here.
            </p>
          ) : (
            <div className="home-products-grid">

              {popularProducts.map((product, index) => {
                const productId = product._id || product.name;
                const productCategory = getCategoryName(product);
                const rating = Math.max(
                  0,
                  Math.min(5, Number(product.rating) || 0)
                );
                const stock = Number(product.stock ?? 0);
                const outOfStock = stock <= 0;

                return (
                  <div
                    className={`home-product-card${index === 0 ? " featured" : ""}`}
                    key={productId}
                  >

                    {/* PRODUCT IMAGE */}

                    <div className="home-product-image">

                      <img
                        src={
                          product.image ||
                          DEFAULT_CATEGORY_IMAGE
                        }
                        alt={product.name}
                      />

                      <span className={`home-stock-badge${outOfStock ? " out" : ""}`}>
                        {outOfStock ? "Out of stock" : `${stock} in stock`}
                      </span>

                      <span className="home-product-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>


                      {/* WISHLIST BUTTON */}

                      <button
                        type="button"
                        className={
                          isInWishlist(product)
                            ? "home-wishlist-button active"
                            : "home-wishlist-button"
                        }
                        onClick={() =>
                          toggleWishlist(product)
                        }
                        aria-label={
                          isInWishlist(product)
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >

                        <FaHeart />

                      </button>

                    </div>


                    {/* PRODUCT INFORMATION */}

                    <div className="home-product-info">

                      {/* CATEGORY */}

                      <div className="home-product-category">
                        {productCategory}
                      </div>


                      {/* NAME */}

                      <h3>
                        {product.name}
                      </h3>


                      {/* RATING */}

                      <div className="home-product-rating">

                        <span className="stars">
                          {"★".repeat(rating)}
                        </span>

                        <span className="rating-number">
                          ({rating}.0)
                        </span>

                      </div>


                      {/* DESCRIPTION */}

                      <p className="home-product-description">
                        {product.description}
                      </p>


                      {/* BOTTOM */}

                      <div className="home-product-bottom">

                        {/* PRICE */}

                        <div className="home-product-price">

                          <strong>
                            ₹{product.price}
                          </strong>

                          <span>
                            / {product.unit || "unit"}
                          </span>

                        </div>


                        {/* BUTTONS */}

                        <div className="home-product-actions">

                          {/* VIEW DETAILS */}

                          <Link
                            to={`/product-details/${productId}`}
                            state={{ product }}
                            className="home-view-details-button"
                          >

                            <FaEye />

                            <span>
                              View Details
                            </span>

                          </Link>


                          {/* ADD TO CART */}

                          <button
                            type="button"
                            className="home-add-cart-button"
                            onClick={() =>
                              handleAddToCart(product)
                            }
                            disabled={outOfStock}
                          >

                            <FaShoppingCart />

                            <span>
                              {outOfStock
                                ? "Out of Stock"
                                : addedProduct === productId
                                ? "Added"
                                : "Add to Cart"}
                            </span>

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </section>


      {/* =========================
          WHY MINI MART
      ========================== */}

      <section className="home-features-section">

        <div className="container">

          <div className="home-features-grid">

            <div className="home-feature">

              <div className="home-feature-icon">
                🛡️
              </div>

              <div>
                <h4>
                  Secure Shopping
                </h4>

                <p>
                  Safe and reliable shopping experience
                </p>
              </div>

            </div>


            <div className="home-feature">

              <div className="home-feature-icon">
                🚚
              </div>

              <div>
                <h4>
                  Fast Delivery
                </h4>

                <p>
                  Fresh products delivered to your doorstep
                </p>
              </div>

            </div>


            <div className="home-feature">

              <div className="home-feature-icon">
                ✨
              </div>

              <div>
                <h4>
                  Best Quality
                </h4>

                <p>
                  Fresh and quality products
                </p>
              </div>

            </div>


            <div className="home-feature">

              <div className="home-feature-icon">
                💗
              </div>

              <div>
                <h4>
                  Customer Support
                </h4>

                <p>
                  We're always here to help
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;
