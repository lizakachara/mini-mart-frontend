import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "../css/ProductDetails.css";

const API_URL = "https://mini-mart-cdkr.onrender.com/api/products";

function ProductDetails() {
const { addToCart } = useContext(CartContext);
const { id } = useParams();

const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [quantity, setQuantity] = useState(1);
const [added, setAdded] = useState(false);

// Fetch product from MongoDB
useEffect(() => {
let cancelled = false;

 
const fetchProduct = async () => {
  try {
    setLoading(true);
    setError("");

    if (!id) {
      throw new Error("Product ID is missing.");
    }

    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Product could not be found."
      );
    }

    if (!cancelled) {
      setProduct(data.product || data);
    }
  } catch (err) {
    console.error("Fetch Product Error:", err);

    if (!cancelled) {
      setError(err.message || "Unable to load product.");
    }
  } finally {
    if (!cancelled) {
      setLoading(false);
    }
  }
};

fetchProduct();

return () => {
  cancelled = true;
};
 

}, [id]);

const increaseQuantity = () => {
if (
product &&
quantity < Number(product.stock ?? Infinity)
) {
setQuantity((previous) => previous + 1);
}
};

const decreaseQuantity = () => {
setQuantity((previous) =>
previous > 1 ? previous - 1 : 1
);
};

const handleAddToCart = () => {
if (!product) return;

 
if (
  product.stock !== undefined &&
  quantity > Number(product.stock)
) {
  alert("Not enough stock available.");
  return;
}

// Pass the selected quantity to the cart.
addToCart({
  ...product,
  quantity,
});

setAdded(true);
setTimeout(() => setAdded(false), 1000);
 

};

if (loading) {
return ( <div className="product-details-page"> <div className="container py-5"> <Link to="/products" className="back-products">
Back to Products </Link> <h3 className="mt-4">Loading product details...</h3> </div> </div>
);
}

if (error || !product) {
return ( <div className="product-details-page"> <div className="container py-5"> <Link to="/products" className="back-products">
Back to Products </Link>

 
      <h3 className="mt-4">Product Not Found</h3>
      <p>{error || "This product could not be found."}</p>

      <Link to="/products" className="back-products">
        Browse All Products
      </Link>
    </div>
  </div>
);
 

}

const productCategory =
typeof product.category === "string"
? product.category
: product.category?.name || "General";

const rating = Math.max(
0,
Math.min(5, Number(product.rating) || 0)
);

const price = Number(product.price) || 0;
const stock = Number(product.stock ?? Infinity);
const outOfStock = stock <= 0;

return ( <div className="product-details-page"> <div className="container py-5"> <Link to="/products" className="back-products">
Back to Products </Link>

 
    <div className="row product-details-card">
      {/* Product Image */}
      <div className="col-md-6">
        <div className="details-image-box">
          <img
            src={
              product.image ||
              "https://placehold.co/700x500?text=Mini+Mart"
            }
            alt={product.name}
          />
        </div>
      </div>

      {/* Product Information */}
      <div className="col-md-6">
        <div className="details-info">
          <span className="details-category">
            {productCategory}
          </span>

          <h1>{product.name}</h1>

          <div className="details-rating">
            {"★".repeat(rating)}
            {"☆".repeat(5 - rating)}
            <span>({rating}.0)</span>
          </div>

          <p className="details-description">
            {product.description ||
              "A quality product for your everyday needs."}
          </p>

          <div className="details-price">
            ₹{price.toLocaleString("en-IN")}
            <span> / {product.unit || "unit"}</span>
          </div>

          <hr />

          <p>
            Availability:{" "}
            <strong className={outOfStock ? "availability-out" : "availability-ok"}>
              {outOfStock
                ? "Out of Stock"
                : Number.isFinite(stock)
                ? `${stock} available`
                : "In Stock"}
            </strong>
          </p>

          {/* Quantity */}
          <div className="quantity-section">
            <h6>Quantity</h6>

            <div className="quantity-control">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                -
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={quantity >= stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="details-total">
            <span>Total</span>
            <strong>
              ₹{(price * quantity).toLocaleString("en-IN")}
            </strong>
          </div>

          {/* Add to Cart */}
          <button
            type="button"
            className="btn details-cart-button"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            {outOfStock
              ? "Out of Stock"
              : added
              ? "Added to Cart"
              : "Add to Cart"}
          </button>

          {/* Product Information */}
          <div className="product-information">
            <h5>Product Information</h5>
            <p>Category: {productCategory}</p>
            <p>Unit: {product.unit || "Not specified"}</p>
            <p>
              {product.description ||
                "Fresh and quality product"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


);
}

export default ProductDetails;
