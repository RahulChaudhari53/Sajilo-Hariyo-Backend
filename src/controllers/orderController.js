const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Products");
const Notification = require("../models/Notification");

const generateDeliveryCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

// Helper: Update Stock Function
async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  if (!product) return;

  product.stock = product.stock - quantity;
  await product.save({ validateBeforeSave: false });

  // Low Stock Warning
  if (product.stock < 5) {
     await Notification.create({
      title: "Low Stock Alert",
      message: `Product ${product.name} is low on stock (${product.stock} left).`,
      type: "info",
      target: "admin",
    });
  }
}

// Helper: Restore Stock (If Cancelled)
async function restoreStock(id, quantity) {
  const product = await Product.findById(id);
  if (!product) return;

  product.stock = product.stock + quantity;
  await product.save({ validateBeforeSave: false });
}

// 1. Create New Order (User)
exports.newOrder = async (req, res) => {
  try {
    const { orderItems, shippingInfo, paymentInfo, totalAmount } = req.body;

    shippingInfo.name = req.user.name;

    const secretCode = generateDeliveryCode();

    const order = await Order.create({
      orderItems,
      shippingInfo,
      paymentInfo,
      totalAmount,
      user: req.user._id,
      deliveryCode: secretCode,
      orderHistory: [{ status: "Pending", date: Date.now() }],
    });

    // Deduct Stock Immediately (The Reservation)
    // We loop through every item bought and reduce inventory
    for (const item of orderItems) {
      await updateStock(item.product, item.qty);
    }

    // Notify Admins about new order
    await Notification.create({
      title: "New Order Received",
      message: `Order #${order._id.toString().slice(-6)} placed by user ${req.user.name || 'Customer'}`,
      type: "order",
      target: "admin",
    });

    // Notify Customer about order placement
    await Notification.create({
      title: "Order Placed",
      message: `Your order #${order._id.toString().slice(-6)} has been placed successfully.`,
      type: "order",
      target: "specific",
      userId: req.user._id,
    });

    res.status(201).json({
      status: "success",
      order,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 2. Get Single Order
exports.getSingleOrder = async (req, res) => {
  try {
    // If the order status is 'Shipped', we allow the user to see the deliveryCode
    // so they can show the QR to the driver.

    let query = Order.findById(req.params.id).populate("user", "name email");

    // Execute query first to check status
    const tempOrder = await Order.findById(req.params.id);

    if (tempOrder && tempOrder.orderStatus === "Shipped") {
      // Only include deliveryCode if order is Shipped
      query = query.select("+deliveryCode");
    }

    const order = await query;

    if (!order) {
      return res
        .status(404)
        .json({ status: "fail", message: "Order not found" });
    }

    res.status(200).json({ status: "success", order });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 3. Get My Orders (Logged in User)
exports.myOrders = async (req, res) => {
  try {
    const { filter } = req.query; // 'active' or 'history'

    let query = { user: req.user._id };

    // Apply status filter
    if (filter === "active") {
      // Active: Pending, Processing, Shipped
      query.orderStatus = { $in: ["Pending", "Processing", "Shipped"] };
    } else if (filter === "history") {
      // History: Delivered, Cancelled
      query.orderStatus = { $in: ["Delivered", "Cancelled"] };
    }
    // If no filter, return all orders

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: orders.length,
      orders,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 4. Get All Orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query; // 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'

    let query = {};

    // Apply status filter if provided
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    // Calculate Total Revenue (only from non-cancelled orders)
    let totalAmount = 0;
    orders.forEach((order) => {
      if (order.orderStatus !== "Cancelled") {
        totalAmount += order.totalAmount;
      }
    });

    res.status(200).json({
      status: "success",
      totalAmount,
      results: orders.length,
      orders,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 5. Update Order Status (Admin)
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ status: "fail", message: "Order not found" });
    }

    if (order.orderStatus === "Delivered") {
      return res
        .status(400)
        .json({ message: "You have already delivered this order" });
    }

    // A. Update Status
    order.orderStatus = req.body.status;

    // B. Add to History Timeline
    order.orderHistory.push({
      status: req.body.status,
      date: Date.now(),
    });

    // C. Logic: If Cancelled, Restore Stock
    if (req.body.status === "Cancelled") {
      for (const item of order.orderItems) {
        await restoreStock(item.product, item.qty);
      }
    }

    await order.save();

    // D. Auto-Notification Logic
    // We send a specific notification to the user
    const message = `Your order #${order._id.toString().slice(-6)} is now ${req.body.status}`;

    await Notification.create({
      title: "Order Update",
      message: message,
      type: "order",
      target: "specific",
      userId: order.user,
    });

    res.status(200).json({
      status: "success",
      message: "Status updated and Notification sent",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// NEW: 6. Customer Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ status: "fail", message: "Order not found" });
    }

    // Security: Only the order owner can cancel
    if (order.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ status: "fail", message: "Not authorized" });
    }

    // Logic: Block cancellation if already shipped
    if (order.orderStatus === "Shipped" || order.orderStatus === "Delivered") {
      return res.status(400).json({
        status: "fail",
        message: "Order cannot be cancelled after it has been shipped.",
      });
    }

    // Update Status
    order.orderStatus = "Cancelled";
    order.orderHistory.push({ status: "Cancelled", date: Date.now() });

    // Restore Stock
    for (const item of order.orderItems) {
      await restoreStock(item.product, item.qty);
    }

    await order.save();

    // Notify User about cancellation
    await Notification.create({
      title: "Order Cancelled",
      message: `Your order #${order._id.toString().slice(-6)} has been cancelled successfully.`,
      type: "order", 
      target: "specific",
      userId: req.user._id,
    });

    // Notify Admin about cancellation
    await Notification.create({
      title: "Order Cancelled",
      message: `Order #${order._id.toString().slice(-6)} was cancelled by ${req.user.name || 'Customer'}.`,
      type: "order",
      target: "admin",
    });

    res
      .status(200)
      .json({ status: "success", message: "Order cancelled successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// NEW: 7. Verify Delivery (QR Scan)
// This is called by Admin/Delivery Agent App
exports.verifyDelivery = async (req, res) => {
  try {
    const { orderId, qrCode } = req.body;

    // We must explicitly select '+deliveryCode' because it's hidden by default
    const order = await Order.findById(orderId).select("+deliveryCode");

    if (!order) {
      return res
        .status(404)
        .json({ status: "fail", message: "Order not found" });
    }

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({ message: "Order is already delivered" });
    }

    // STRICT CHECK: Only allow scanning if the order is currently "Shipped"
    if (order.orderStatus !== "Shipped") {
      return res.status(400).json({
        status: "fail",
        message: "Order must be in 'Shipped' state to verify delivery.",
      });
    }

    // THE CHECK: Does the scanned code match the database code?
    if (order.deliveryCode !== qrCode) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid QR Code. Verification Failed.",
      });
    }

    // Success! Update status
    order.orderStatus = "Delivered";
    order.orderHistory.push({ status: "Delivered", date: Date.now() });

    // Clear the code so it can't be reused/leaked
    order.deliveryCode = undefined;

    await order.save();

    // Notify User
    await Notification.create({
      title: "Order Delivered",
      message: `Order #${order._id} has been delivered successfully.`,
      type: "order",
      target: "specific",
      userId: order.user,
    });

    res.status(200).json({ status: "success", message: "Delivery Verified!" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 8. Get Delivery QR Code (Customer)
exports.getDeliveryQR = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select("+deliveryCode");

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    // Security: Only order owner can view QR
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: "Not authorized",
      });
    }

    // Only allow if order is Shipped
    if (order.orderStatus !== "Shipped") {
      return res.status(400).json({
        status: "fail",
        message: "QR code is only available for shipped orders",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        orderId: order._id,
        deliveryCode: order.deliveryCode,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
