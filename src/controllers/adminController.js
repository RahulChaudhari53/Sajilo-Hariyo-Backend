const Order = require("../models/Order");
const Product = require("../models/Products");

// Get Admin Dashboard Stats
exports.getAdminStats = async (req, res) => {
  try {
    // Total Sales (sum of all non-cancelled orders)
    const totalSalesResult = await Order.aggregate([
      {
        $match: { orderStatus: { $ne: "Cancelled" } },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);
    const totalSales = totalSalesResult[0]?.totalSales || 0;

    // Total Orders
    const totalOrders = await Order.countDocuments();

    // Pending Orders
    const pendingOrders = await Order.countDocuments({
      orderStatus: "Pending",
    });

    // Processing Orders
    const processingOrders = await Order.countDocuments({
      orderStatus: "Processing",
    });

    // Shipped Orders
    const shippedOrders = await Order.countDocuments({
      orderStatus: "Shipped",
    });

    // Delivered Orders
    const deliveredOrders = await Order.countDocuments({
      orderStatus: "Delivered",
    });

    // Low Stock Count (stock < 5)
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 5 } });

    res.status(200).json({
      status: "success",
      data: {
        totalSales,
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        lowStockCount,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

