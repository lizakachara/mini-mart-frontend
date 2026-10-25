const Product = require("../models/Product");

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error("Get Products Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch products.",
    });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Get Product Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch product.",
    });
  }
};

// ADD PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      unit,
      category,
      categoryId,
      stock,
      rating,
      image,
      isActive,
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        message: "Product name, price and category are required.",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      unit,
      category,
      categoryId: categoryId || null,
      stock,
      rating,
      image,
      isActive,
    });

    res.status(201).json({
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error.message);

    res.status(500).json({
      message: "Failed to add product.",
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error.message);

    res.status(500).json({
      message: "Failed to update product.",
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Product Error:", error.message);

    res.status(500).json({
      message: "Failed to delete product.",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};