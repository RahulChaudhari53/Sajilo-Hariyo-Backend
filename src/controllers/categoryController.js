const Category = require("../models/Category");

// 1. Create Category (Text Only)
exports.createCategory = async (req, res) => {
  try {
    const newCategory = await Category.create({
      name: req.body.name,
      description: req.body.description,
    });

    res.status(201).json({
      status: "success",
      data: {
        category: newCategory,
      },
    });
  } catch (err) {
    // Handle duplicates (E11000)
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ status: "fail", message: "Category already exists" });
    }
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 2. Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 3. Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }

    res.status(204).send(); // cleaner for 204
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
