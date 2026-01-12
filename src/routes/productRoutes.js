const express = require("express");
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploads");

const router = express.Router();

// Configure the Multi-Field Upload
// 'image' max 1 file, 'arModel' max 1 file
const productUpload = upload.fields([
  { name: "image", maxCount: 1 }, // Cover Image
  { name: "gallery", maxCount: 5 }, // Up to 5 extra images
  { name: "arModel", maxCount: 1 },
]);

// Public Routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProduct);

// Admin Routes
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  productUpload,
  productController.createProduct
);

// Update Product (Admin)
router.patch(
  "/:id",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  productUpload, // Handles file uploads (image, gallery, arModel)
  productController.updateProduct
);

// Delete Product (Admin)
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  productController.deleteProduct
);

module.exports = router;
