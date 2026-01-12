const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

// Customer Routes
router.post("/new", orderController.newOrder);
router.get("/myorders", orderController.myOrders);
router.get("/:id/qr", orderController.getDeliveryQR);
router.get("/:id", orderController.getSingleOrder);
router.put("/:id/cancel", orderController.cancelOrder);

// Admin Routes
router.get(
  "/admin/all",
  authMiddleware.restrictTo("admin"),
  orderController.getAllOrders
);

router.put(
  "/admin/:id",
  authMiddleware.restrictTo("admin"),
  orderController.updateOrder
);

router.post(
  "/admin/verify-delivery",
  authMiddleware.restrictTo("admin"),
  orderController.verifyDelivery
);

module.exports = router;
