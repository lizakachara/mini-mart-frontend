import React, { useEffect, useState } from "react";
import {
FaPlus,
FaSearch,
FaEdit,
FaTrash,
FaBox,
FaTimes,
FaSave,
} from "react-icons/fa";

import "../css/AdminProducts.css";

function AdminProducts() {
const API_URL = "http://localhost:5000/api/products";
const CATEGORIES_URL = "http://localhost:5000/api/categories";

// PRODUCTS
const [products, setProducts] = useState([]);
const [loadingProducts, setLoadingProducts] = useState(true);
const [savingProduct, setSavingProduct] = useState(false);

// DYNAMIC CATEGORIES
const [categoryOptions, setCategoryOptions] = useState([]);
const [loadingCategories, setLoadingCategories] = useState(true);

// SEARCH AND FILTER
const [search, setSearch] = useState("");
const [category, setCategory] = useState("All");

// MODAL
const [showModal, setShowModal] = useState(false);
const [editingProduct, setEditingProduct] = useState(null);

// FORM
const emptyForm = {
name: "",
price: "",
unit: "",
category: "",
stock: "",
rating: 5,
image: "",
description: "",
};

const [formData, setFormData] = useState({ ...emptyForm });

// GET ADMIN TOKEN
const getAdminToken = () => {
return localStorage.getItem("adminToken");
};

// FETCH PRODUCTS FROM MONGODB
const fetchProducts = async () => {
try {
setLoadingProducts(true);


  const response = await fetch(API_URL);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load products."
    );
  }

  const productData = Array.isArray(data)
    ? data
    : data.products || [];

  setProducts(productData);
} catch (error) {
  console.error("Fetch Products Error:", error);

  alert(
    "Could not load products. Please check whether your backend is running."
  );
} finally {
  setLoadingProducts(false);
}


};

// FETCH CATEGORIES FROM MONGODB
const fetchCategories = async () => {
try {
setLoadingCategories(true);


  const response = await fetch(CATEGORIES_URL);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load categories."
    );
  }

  const categoryData = Array.isArray(data)
    ? data
    : data.categories || [];

  const names = categoryData
    .filter(
      (item) =>
        typeof item === "string" ||
        item.isActive !== false
    )
    .map((item) =>
      typeof item === "string" ? item : item.name
    )
    .filter(Boolean);

  const uniqueNames = [...new Set(names)];

  setCategoryOptions(uniqueNames);

  // Choose an available category for a new product.
  setFormData((previous) => ({
    ...previous,
    category:
      previous.category &&
      uniqueNames.includes(previous.category)
        ? previous.category
        : uniqueNames[0] || "",
  }));
} catch (error) {
  console.error("Fetch Categories Error:", error);

  alert(
    "Could not load categories. Please check your backend."
  );
} finally {
  setLoadingCategories(false);
}


};

// LOAD PRODUCTS AND CATEGORIES WHEN PAGE OPENS
useEffect(() => {
fetchProducts();
fetchCategories();
}, []);

// SEARCH AND CATEGORY FILTER
const filteredProducts = products.filter((product) => {
const matchesSearch = (product.name || "")
.toLowerCase()
.includes(search.toLowerCase());


const productCategory =
  typeof product.category === "string"
    ? product.category
    : product.category?.name || "";

const matchesCategory =
  category === "All" || productCategory === category;

return matchesSearch && matchesCategory;
 

});

// OPEN ADD PRODUCT MODAL
const openAddModal = () => {
setEditingProduct(null);

 
setFormData({
  ...emptyForm,
  category: categoryOptions[0] || "",
});

setShowModal(true);
 

};

// OPEN EDIT PRODUCT MODAL
const openEditModal = (product) => {
setEditingProduct(product);

 
const productCategory =
  typeof product.category === "string"
    ? product.category
    : product.category?.name || "";

setFormData({
  name: product.name || "",
  price: product.price ?? "",
  unit: product.unit || "",
  category: productCategory,
  stock: product.stock ?? "",
  rating: product.rating ?? 5,
  image: product.image || "",
  description: product.description || "",
});

setShowModal(true);
 

};

// HANDLE FORM INPUT CHANGES
const handleChange = (e) => {
const { name, value } = e.target;

 
setFormData((previous) => ({
  ...previous,
  [name]: value,
}));
 

};

// ADD OR UPDATE PRODUCT IN MONGODB
const handleSaveProduct = async (e) => {
e.preventDefault();

 
if (
  !formData.name.trim() ||
  formData.price === "" ||
  !formData.unit.trim() ||
  !formData.category ||
  formData.stock === ""
) {
  alert("Please fill all required fields.");
  return;
}

const price = Number(formData.price);
const stock = Number(formData.stock);
const rating = Number(formData.rating);

if (
  !Number.isFinite(price) ||
  price < 0 ||
  !Number.isFinite(stock) ||
  stock < 0 ||
  !Number.isFinite(rating) ||
  rating < 0 ||
  rating > 5
) {
  alert(
    "Please enter valid price, stock and rating values."
  );
  return;
}

const token = getAdminToken();

if (!token) {
  alert(
    "Your admin session has expired. Please log in again."
  );
  return;
}

const productData = {
  name: formData.name.trim(),
  price,
  unit: formData.unit.trim(),
  category: formData.category,
  stock,
  rating,
  image: formData.image.trim(),
  description: formData.description.trim(),
};

try {
  setSavingProduct(true);

  const isEditing = Boolean(editingProduct);
  const productId =
    editingProduct?._id || editingProduct?.id;

  const response = await fetch(
    isEditing
      ? `${API_URL}/${productId}`
      : API_URL,
    {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to save product."
    );
  }

  await fetchProducts();

  setShowModal(false);
  setEditingProduct(null);
  setFormData({ ...emptyForm });

  alert(
    data.message ||
      (isEditing
        ? "Product updated successfully."
        : "Product added successfully.")
  );
} catch (error) {
  console.error("Save Product Error:", error);

  alert(
    error.message || "Could not save the product."
  );
} finally {
  setSavingProduct(false);
}
 

};

// DELETE PRODUCT FROM MONGODB
const deleteProduct = async (id) => {
const product = products.find(
(item) => (item._id || item.id) === id
);

 
if (!product) {
  alert("Product not found.");
  return;
}

const confirmDelete = window.confirm(
  `Are you sure you want to delete "${product.name}"?`
);

if (!confirmDelete) {
  return;
}

const token = getAdminToken();

if (!token) {
  alert(
    "Your admin session has expired. Please log in again."
  );
  return;
}

try {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete product."
    );
  }

  await fetchProducts();

  alert(
    data.message || "Product deleted successfully."
  );
} catch (error) {
  console.error("Delete Product Error:", error);

  alert(
    error.message || "Could not delete the product."
  );
}
 

};

// CLOSE MODAL
const closeModal = () => {
if (savingProduct) {
return;
}

 
setShowModal(false);
setEditingProduct(null);
setFormData({ ...emptyForm });
 

};

return ( <div className="admin-products-page">
{/* HEADER */} <section className="admin-products-header"> <div className="admin-products-container"> <div> <p className="admin-page-label">
Store Management </p>

 
        <h1>Manage Products</h1>

        <p className="admin-page-description">
          Add, edit and manage all products
          in your Mini Mart store.
        </p>
      </div>

      <button
        type="button"
        className="add-product-button"
        onClick={openAddModal}
      >
        <FaPlus />
        Add Product
      </button>
    </div>
  </section>

  {/* PRODUCTS CONTENT */}
  <section className="admin-products-content">
    <div className="admin-products-container">
      {/* SEARCH AND FILTER */}
      <div className="products-management-controls">
        <div className="admin-product-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-category-filter">
          {[
            "All",
            ...categoryOptions.filter(
              (item) => item !== "All"
            ),
          ].map((item) => (
            <button
              type="button"
              key={item}
              className={
                category === item
                  ? "admin-filter-button active"
                  : "admin-filter-button"
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* RESULT HEADER */}
      <div className="products-management-heading">
        <div>
          <h2>All Products</h2>

          <p>
            {filteredProducts.length} products found
          </p>
        </div>

        <div className="product-total-badge">
          <FaBox />
          {products.length} Total
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="admin-products-table-wrapper">
        <table className="admin-products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loadingProducts ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-admin-products"
                >
                  <FaBox />
                  <h3>Loading products...</h3>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-admin-products"
                >
                  <FaBox />
                  <h3>No products found</h3>

                  <p>
                    Try a different search or category,
                    or add a new product.
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const productCategory =
                  typeof product.category === "string"
                    ? product.category
                    : product.category?.name || "";

                return (
                  <tr key={product._id || product.id}>
                    {/* PRODUCT */}
                    <td>
                      <div className="admin-product-info">
                        <img
                          src={
                            product.image ||
                            "https://placehold.co/80x80?text=Product"
                          }
                          alt={product.name}
                        />

                        <div>
                          <strong>{product.name}</strong>

                          <span>
                            {product.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td>
                      <span className="admin-category-badge">
                        {productCategory}
                      </span>
                    </td>

                    {/* PRICE */}
                    <td>
                      <strong className="admin-product-price">
                        ₹{product.price}
                      </strong>
                    </td>

                    {/* UNIT */}
                    <td>{product.unit}</td>

                    {/* STOCK */}
                    <td>
                      <span
                        className={
                          product.stock <= 10
                            ? "stock-badge low"
                            : "stock-badge"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* RATING */}
                    <td>
                      <span className="admin-rating">
                        {"★".repeat(
                          Math.max(
                            0,
                            Math.min(
                              5,
                              Number(product.rating) || 0
                            )
                          )
                        )}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          className="edit-product-button"
                          onClick={() =>
                            openEditModal(product)
                          }
                          title="Edit Product"
                          aria-label={`Edit ${product.name}`}
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="delete-product-button"
                          onClick={() =>
                            deleteProduct(
                              product._id || product.id
                            )
                          }
                          title="Delete Product"
                          aria-label={`Delete ${product.name}`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  {/* ADD / EDIT MODAL */}
  {showModal && (
    <div className="admin-modal-overlay">
      <div className="admin-product-modal">
        {/* MODAL HEADER */}
        <div className="admin-modal-header">
          <div>
            <h2>
              {editingProduct
                ? "Edit Product"
                : "Add New Product"}
            </h2>

            <p>
              {editingProduct
                ? "Update product information"
                : "Add a new product to your store"}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={closeModal}
            disabled={savingProduct}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* FORM */}
        <form
          className="admin-product-form"
          onSubmit={handleSaveProduct}
        >
          {/* PRODUCT NAME */}
          <div className="form-group-admin">
            <label>Product Name *</label>

            <input
              type="text"
              name="name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* PRICE AND UNIT */}
          <div className="form-row-admin">
            <div className="form-group-admin">
              <label>Price *</label>

              <input
                type="number"
                name="price"
                placeholder="120"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-admin">
              <label>Unit *</label>

              <input
                type="text"
                name="unit"
                placeholder="1 kg"
                value={formData.unit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* CATEGORY AND STOCK */}
          <div className="form-row-admin">
            <div className="form-group-admin">
              <label>Category *</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={
                  loadingCategories ||
                  categoryOptions.length === 0
                }
              >
                {loadingCategories ? (
                  <option value="">
                    Loading categories...
                  </option>
                ) : categoryOptions.length === 0 ? (
                  <option value="">
                    Add a category first
                  </option>
                ) : (
                  [
                    ...new Set([
                      ...categoryOptions,
                      ...(formData.category &&
                      !categoryOptions.includes(
                        formData.category
                      )
                        ? [formData.category]
                        : []),
                    ]),
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group-admin">
              <label>Stock *</label>

              <input
                type="number"
                name="stock"
                placeholder="20"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* RATING */}
          <div className="form-group-admin">
            <label>Rating</label>

            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
            >
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
              <option value="0">No Rating</option>
            </select>
          </div>

          {/* IMAGE */}
          <div className="form-group-admin">
            <label>Product Image URL</label>

            <input
              type="url"
              name="image"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={handleChange}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="form-group-admin">
            <label>Description</label>

            <textarea
              name="description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* BUTTONS */}
          <div className="admin-form-buttons">
            <button
              type="button"
              className="cancel-product-button"
              onClick={closeModal}
              disabled={savingProduct}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-product-button"
              disabled={
                savingProduct ||
                loadingCategories ||
                categoryOptions.length === 0
              }
            >
              <FaSave />

              {savingProduct
                ? "Saving..."
                : editingProduct
                ? "Update Product"
                : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>


);
}

export default AdminProducts;
