const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

// Admin Stats
router.get("/stats", adminController.getAdminStats);

module.exports = router;

