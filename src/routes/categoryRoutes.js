const express = require("express");
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware")

const router = express.Router();

// Public Route
router.get("/", categoryController.getAllCategories);

// Admin Routes (Protected)
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  categoryController.createCategory
);

router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  categoryController.deleteCategory
);

module.exports = router;
