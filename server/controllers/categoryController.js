const Category = require("../models/Category");
const Product = require("../models/Product");

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Get Categories Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch categories.",
    });
  }
};

// GET SINGLE CATEGORY
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error("Get Category Error:", error.message);

    res.status(500).json({
      message: "Failed to fetch category.",
    });
  }
};

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "This category already exists.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      image: image || "",
    });

    res.status(201).json({
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error.message);

    res.status(500).json({
      message: "Failed to create category.",
    });
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const existingCategory = await Category.findOne({
      _id: { $ne: req.params.id },
      name: {
        $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Another category already uses this name.",
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description || "",
        image: image || "",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    res.status(200).json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update Category Error:", error.message);

    res.status(500).json({
      message: "Failed to update category.",
    });
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const productCount = await Product.countDocuments({
      category: category.name,
    });

    if (productCount > 0) {
      return res.status(400).json({
        message: `This category has ${productCount} product(s). Move or remove those products before deleting it.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Category Error:", error.message);

    res.status(500).json({
      message: "Failed to delete category.",
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};