const express = require("express");
const authController = require("../controllers/authController");
const bookmarkController = require("../controllers/bookmarkController");
const userController = require("../controllers/userController");
const upload = require("../middlewares/uploads");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// --- Auth Routes (Public) ---
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/verifyOtp", authController.verifyPassOTP);
router.post("/resetPassword", authController.resetPassword);

// --- Protected Routes (Login Required) ---
router.use(authMiddleware.protect);

// 1. Profile Management
router.get("/profile", userController.getProfile);
router.patch(
  "/updateProfile",
  upload.single("profileImage"), 
  userController.updateProfile
);
router.patch("/updatePassword", userController.updatePassword);

// 2. Address Management
router.post("/address", userController.addAddress);
router.patch("/address/:addressId", userController.updateAddress);
router.delete("/address/:addressId", userController.deleteAddress);

// 3. Wishlist Management
router.get("/wishlist", bookmarkController.getWishlist);
router.post("/wishlist/:productId", bookmarkController.toggleWishlist);

module.exports = router;
