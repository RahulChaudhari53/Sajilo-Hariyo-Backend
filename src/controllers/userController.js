const User = require("../models/User");
const bcrypt = require("bcrypt");

// 0. Get Current Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 1. Update Profile (Name, Phone, Email, Image)
exports.updateProfile = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.email) updateData.email = req.body.email;

    // Handle Image Upload
    if (req.file) {
      updateData.profileImage = req.file.path
        .replace(/\\/g, "/")
        .replace("public/", "");
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 2. Change Password (Logged In)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.correctPassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is wrong" });
    }

    user.password = newPassword;
    await user.save(); 

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 3. Add Address
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Enforce limit
    if (user.addresses.length >= 5) {
      return res.status(400).json({
        status: "fail",
        message:
          "You can only add up to 5 addresses. Please update or delete an existing address.",
      });
    }

    const newAddress = {
      ...req.body,
      username: user.name,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(200).json({
      status: "success",
      data: { addresses: user.addresses },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 4. Update Address
exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Address not found",
      });
    }

    // Update address fields
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      ...req.body,
      _id: user.addresses[addressIndex]._id, // Preserve ID
    };

    await user.save();

    res.status(200).json({
      status: "success",
      data: { addresses: user.addresses },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 5. Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );

    await user.save();

    res.status(200).json({
      status: "success",
      data: { addresses: user.addresses },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
