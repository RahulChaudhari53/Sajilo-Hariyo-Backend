const User = require("../models/User");

// 1. Get My Wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      select: "name price image stock",
    });

    res.status(200).json({
      status: "success",
      results: user.wishlist.length,
      data: {
        wishlist: user.wishlist,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// 2. Toggle Wishlist
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);

    const isAdded = user.wishlist.includes(productId);

    if (isAdded) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { wishlist: productId },
      });
      res.status(200).json({
        status: "success",
        message: "Removed from wishlist",
        isAdded: false,
      });
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { wishlist: productId },
      });
      res.status(200).json({
        status: "success",
        message: "Added to wishlist",
        isAdded: true,
      });
    }
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
