const express = require("express");
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware"); 
const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

// Admin only route to manually send
router.post(
  "/send",
  authMiddleware.restrictTo("admin"),
  notificationController.sendNotification
);

module.exports = router;
