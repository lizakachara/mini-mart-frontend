import React, { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTags,
  FaTimes,
  FaSave,
  FaBox,
} from "react-icons/fa";

import "../css/AdminCategories.css";

function AdminCategories() {
  const API_URL = "https://mini-mart-cdkr.onrender.com/api/categories";
  const PRODUCTS_API_URL = "https://mini-mart-cdkr.onrender.com/api/products";

  // CATEGORIES
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SEARCH
  const [search, setSearch] = useState("");

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // FORM
  const emptyForm = {
    name: "",
    description: "",
    image: "",
  };

  const [formData, setFormData] = useState({ ...emptyForm });

  // FETCH CATEGORIES AND PRODUCTS
  const fetchData = async () => {
    try {
      setLoading(true);

      const [categoryResponse, productResponse] =
        await Promise.all([
          fetch(API_URL),
          fetch(PRODUCTS_API_URL),
        ]);

      if (!categoryResponse.ok || !productResponse.ok) {
        throw new Error("Failed to load categories or products.");
      }

      const categoryData = await categoryResponse.json();
      const productData = await productResponse.json();

      setCategories(
        Array.isArray(categoryData) ? categoryData : []
      );

      setProducts(
        Array.isArray(productData) ? productData : []
      );
    } catch (error) {
      console.error("Fetch Categories Error:", error);

      alert(
        "Could not load categories. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // GET PRODUCT COUNT
  const getProductCount = (categoryName) => {
    return products.filter(
      (product) => product.category === categoryName
    ).length;
  };

  // FILTER CATEGORIES
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // OPEN ADD MODAL
  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
    });

    setShowModal(true);
  };

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // SAVE CATEGORY
  const handleSaveCategory = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter category name.");
      return;
    }

    const token = localStorage.getItem("adminToken");

    if (!token) {
      alert("Your admin session has expired. Please log in again.");
      return;
    }

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      image: formData.image.trim(),
    };

    try {
      setSaving(true);

      const isEditing = Boolean(editingCategory);

      const response = await fetch(
        isEditing
          ? `${API_URL}/${editingCategory._id}`
          : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(categoryData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save category."
        );
      }

      await fetchData();

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ ...emptyForm });

      alert(
        data.message ||
          (isEditing
            ? "Category updated successfully."
            : "Category added successfully.")
      );
    } catch (error) {
      console.error("Save Category Error:", error);

      alert(error.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE CATEGORY
  const deleteCategory = async (category) => {
    const productCount = getProductCount(category.name);

    let message = `Are you sure you want to delete "${category.name}"?`;

    if (productCount > 0) {
      message =
        `"${category.name}" has ${productCount} product(s). ` +
        "The backend will prevent deletion while products use this category. Continue?";
    }

    if (!window.confirm(message)) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    if (!token) {
      alert("Your admin session has expired. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${category._id}`,
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
          data.message || "Failed to delete category."
        );
      }

      await fetchData();

      alert(data.message || "Category deleted successfully.");
    } catch (error) {
      console.error("Delete Category Error:", error);

      alert(error.message || "Could not delete category.");
    }
  };

  // CLOSE MODAL
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setFormData({ ...emptyForm });
  };

  return (
    <div className="admin-categories-page">

      {/* HEADER */}

      <section className="admin-categories-header">
        <div className="admin-categories-container">

          <div>
            <p className="admin-category-label">
              Store Management
            </p>

            <h1>Manage Categories</h1>

            <p className="admin-category-description">
              Organize and manage your Mini Mart
              product categories.
            </p>
          </div>

          <button
            className="add-category-button"
            onClick={openAddModal}
          >
            <FaPlus />
            Add Category
          </button>

        </div>
      </section>

      {/* CONTENT */}

      <section className="admin-categories-content">
        <div className="admin-categories-container">

          {/* SEARCH */}

          <div className="category-search-box">
            <FaSearch />

            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* HEADING */}

          <div className="categories-management-heading">
            <div>
              <h2>All Categories</h2>

              <p>
                {filteredCategories.length} categories found
              </p>
            </div>

            <div className="category-total-badge">
              <FaTags />
              {categories.length} Total
            </div>
          </div>

          {/* CATEGORY GRID */}

          {loading ? (
            <div className="no-categories">
              <FaTags />
              <h3>Loading categories...</h3>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="no-categories">
              <FaTags />

              <h3>No categories found</h3>

              <p>
                Try a different search or add a category.
              </p>
            </div>
          ) : (
            <div className="admin-category-grid">
              {filteredCategories.map((category) => {
                const productCount = getProductCount(
                  category.name
                );

                return (
                  <div
                    className="admin-category-card"
                    key={category._id}
                  >

                    {/* IMAGE */}

                    <div className="admin-category-image-wrapper">
                      <img
                        src={
                          category.image ||
                          "https://placehold.co/500x300?text=Category"
                        }
                        alt={category.name}
                      />

                      <div className="category-product-count">
                        <FaBox />
                        {productCount}
                      </div>
                    </div>

                    {/* INFO */}

                    <div className="admin-category-info">
                      <h3>{category.name}</h3>

                      <p>{category.description}</p>

                      <div className="admin-category-footer">
                        <span>
                          {productCount}{" "}
                          {productCount === 1
                            ? "Product"
                            : "Products"}
                        </span>

                        <div className="category-actions">
                          <button
                            className="edit-category-button"
                            onClick={() =>
                              openEditModal(category)
                            }
                            title="Edit Category"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="delete-category-button"
                            onClick={() =>
                              deleteCategory(category)
                            }
                            title="Delete Category"
                          >
                            <FaTrash />
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

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="admin-category-modal-overlay">
          <div className="admin-category-modal">

            {/* MODAL HEADER */}

            <div className="admin-category-modal-header">
              <div>
                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add New Category"}
                </h2>

                <p>
                  {editingCategory
                    ? "Update category information"
                    : "Create a new product category"}
                </p>
              </div>

              <button
                type="button"
                className="category-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <FaTimes />
              </button>
            </div>

            {/* FORM */}

            <form
              className="admin-category-form"
              onSubmit={handleSaveCategory}
            >

              <div className="category-form-group">
                <label>Category Name *</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Example: Bakery"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="category-form-group">
                <label>Category Image URL</label>

                <input
                  type="url"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={handleChange}
                />
              </div>

              <div className="category-form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  placeholder="Enter category description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* BUTTONS */}

              <div className="category-form-buttons">
                <button
                  type="button"
                  className="cancel-category-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-category-button"
                  disabled={saving}
                >
                  <FaSave />

                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Save Category"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminCategories;