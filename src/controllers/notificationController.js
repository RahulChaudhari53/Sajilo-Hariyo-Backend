const Notification = require("../models/Notification");

// 1. Get My Notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const user = req.user;
    
    // Define Query Criteria
    // A user should see:
    // 1. Notifications targeting 'all'
    // 2. Notifications targeting their role ('customer' or 'admin')
    // 3. Notifications targeting them specifically (userId)
    
    const filter = {
      $or: [
        { target: "all" },
        { target: user.role }, // 'admin' or 'customer'
        { userId: user._id }
      ]
    };

    const notifications = await Notification.find(filter)
      .sort("-createdAt") // Newest first
      .populate("userId", "name email");

    // Add a virtual field 'isRead' for the response
    // We check if the current user's ID is in the 'readBy' array
    const data = notifications.map(notif => {
      const isRead = notif.readBy.includes(user._id);
      return {
        ...notif.toObject(),
        isRead: isRead
      };
    });

    res.status(200).json({
      status: "success",
      results: data.length,
      data: { notifications: data },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 2. Mark Notification as Read
exports.markAsRead = async (req, res) => {
  try {
    const notifId = req.params.id;
    const userId = req.user._id;

    // Add user to readBy array if not already present
    const notification = await Notification.findByIdAndUpdate(
      notifId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ status: "fail", message: "Notification not found" });
    }

    res.status(200).json({
      status: "success",
      data: { notification },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 3. Mark All as Read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find all notifications relevant to this user
    // And add their ID to readBy array
    await Notification.updateMany(
      {
        $or: [
          { target: "all" },
          { target: userRole },
          { userId: userId }
        ]
      },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read"
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 4. Send Notification (Internal/Admin usage)
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, target, userId } = req.body;

    const newNotification = await Notification.create({
      title,
      message,
      type: type || 'info', // order, promo, system, info
      target: target || 'all',
      userId: userId || undefined
    });

    res.status(201).json({
      status: "success",
      data: { notification: newNotification }
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};