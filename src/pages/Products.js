import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FiHeart } from "react-icons/fi";
import "../css/Products.css";

const API_URL = "https://mini-mart-cdkr.onrender.com/api/products";
const CATEGORIES_API = "https://mini-mart-cdkr.onrender.com/api/categories";

function Products() {
const { addToCart } = useContext(CartContext);
const [searchParams, setSearchParams] = useSearchParams();

const [products, setProducts] = useState([]);
const [categories, setCategories] = useState(["All"]);
const [search, setSearch] = useState("");
const [category, setCategory] = useState(
  searchParams.get("category") || "All"
);
const [sortBy, setSortBy] = useState("featured");
const [addedProduct, setAddedProduct] = useState("");
const [wishlist, setWishlist] = useState(() => {
try {
return JSON.parse(localStorage.getItem("wishlist")) || [];
} catch {
return [];
}
});

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

// FETCH PRODUCTS AND CATEGORIES FROM MONGODB
useEffect(() => {
const fetchStoreData = async () => {
try {
setLoading(true);
setError("");


    const [productsResponse, categoriesResponse] =
      await Promise.all([
        fetch(API_URL),
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

      const categoryNames = (
        Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.categories || []
      )
        .map((item) =>
          typeof item === "string" ? item : item.name
        )
        .filter(Boolean);

      setCategories([
        "All",
        ...new Set(categoryNames),
      ]);
    }
  } catch (err) {
    console.error("Store data error:", err);
    setError(
      err.message ||
        "Unable to connect to the store. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

fetchStoreData();


}, []);

const filteredProducts = useMemo(() => {
  const query = search.toLowerCase();

  const filtered = products.filter((product) => {
    const matchesSearch = (product.name || "")
      .toLowerCase()
      .includes(query);

    const productCategory =
      typeof product.category === "string"
        ? product.category
        : product.category?.name || "";

    const matchesCategory =
      category === "All" || productCategory === category;

    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered];

  if (sortBy === "price-low") {
    sorted.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === "price-high") {
    sorted.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy === "name") {
    sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  } else if (sortBy === "rating") {
    sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }

  return sorted;
}, [products, search, category, sortBy]);

// ADD PRODUCT TO CART
const handleAddToCart = (product) => {
addToCart(product);


setAddedProduct(product._id || product.name);

setTimeout(() => {
  setAddedProduct("");
}, 1000);


};

// ADD / REMOVE PRODUCT FROM WISHLIST
const toggleWishlist = (product) => {
const productId = product._id || product.name;


const alreadyWishlisted = wishlist.some(
  (item) =>
    String(item.id) === String(productId) ||
    String(item._id) === String(productId) ||
    item.name === product.name
);

let updatedWishlist;

if (alreadyWishlisted) {
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
      category:
        typeof product.category === "string"
          ? product.category
          : product.category?.name || "",
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

// CHECK WISHLIST
const isWishlisted = (product) => {
const productId = product._id || product.name;


return wishlist.some(
  (item) =>
    String(item.id) === String(productId) ||
    String(item._id) === String(productId) ||
    item.name === product.name
);


};

return ( <div className="products-page">
{/* PAGE HEADER */} <section className="products-header"> <div className="container"> <h1>All Products</h1>

      <p>
        Fresh groceries and everyday essentials
        at affordable prices.
      </p>
    </div>
  </section>

  {/* SEARCH AND CATEGORY FILTER */}
  <section className="products-controls">
    <div className="container">
      <div className="row align-items-center">
        <div className="col-md-6 mb-3 mb-md-0">
          <input
            type="text"
            className="form-control search-box"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <div className="products-toolbar">
            <div className="category-buttons">
              {categories.map((item) => (
                <button
                  key={item}
                  className={
                    category === item
                      ? "category-button active"
                      : "category-button"
                  }
                  onClick={() => {
                    setCategory(item);
                    if (item === "All") {
                      setSearchParams({});
                    } else {
                      setSearchParams({ category: item });
                    }
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort products"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* PRODUCT LIST */}
  <section className="products-list-section">
    <div className="container">
      <div className="products-result">
        <h4>
          {category === "All" ? "All Products" : category}
        </h4>

        <span>{filteredProducts.length} products</span>
      </div>

      {loading ? (
        <div className="no-products">
          <h4>Loading products...</h4>
        </div>
      ) : error ? (
        <div className="no-products">
          <h4>Unable to load products</h4>
          <p>{error}</p>

          <button
            type="button"
            className="btn product-add-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products">
          <h4>No products found</h4>
          <p>
            {products.length === 0
              ? "Products added by the store administrator will appear here."
              : "Try searching for another product."}
          </p>
        </div>
      ) : (
        <div className="row">
          {filteredProducts.map((product) => {
            const productCategory =
              typeof product.category === "string"
                ? product.category
                : product.category?.name || "";

            const productId = product._id || product.name;
            const stock = Number(product.stock ?? 0);
            const outOfStock = stock <= 0;

            return (
              <div
                className="col-md-6 col-lg-4 mb-4"
                key={productId}
              >
                <div className="product-page-card">
                  {/* PRODUCT IMAGE */}
                  <div className="product-page-image">
                    <img
                      src={
                        product.image ||
                        "https://placehold.co/500x400?text=Mini+Mart"
                      }
                      alt={product.name}
                    />

                    {/* WISHLIST */}
                    <span className={`stock-badge${outOfStock ? " out" : ""}`}>
                      {outOfStock ? "Out of stock" : `${stock} in stock`}
                    </span>

                    <button
                      type="button"
                      className={
                        isWishlisted(product)
                          ? "wishlist-heart active"
                          : "wishlist-heart"
                      }
                      onClick={() => toggleWishlist(product)}
                      title={
                        isWishlisted(product)
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      <FiHeart />
                    </button>
                  </div>

                  {/* PRODUCT INFORMATION */}
                  <div className="product-page-info">
                    <div className="product-category">
                      {productCategory}
                    </div>

                    <h5>{product.name}</h5>

                    <div className="product-rating">
                      {"★".repeat(
                        Math.max(
                          0,
                          Math.min(5, Number(product.rating) || 0)
                        )
                      )}

                      <span>
                        ({Number(product.rating) || 0}.0)
                      </span>
                    </div>

                    <p>{product.description}</p>

                    <div className="product-page-bottom">
                      <div>
                        <strong>₹{product.price}</strong>

                        <small>
                          / {product.unit || "unit"}
                        </small>
                      </div>

                      <div className="product-buttons">
                        <Link
                          to={`/product-details/${productId}`}
                          state={{ product }}
                          className="view-details-button"
                        >
                          View Details
                        </Link>

                        <button
                          type="button"
                          className="btn product-add-button"
                          onClick={() => handleAddToCart(product)}
                          disabled={outOfStock}
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : addedProduct === productId
                            ? "Added"
                            : "Add to Cart"}
                        </button>
                      </div>
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
</div>


);
}

export default Products;
