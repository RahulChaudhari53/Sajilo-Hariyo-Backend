const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/email");

// create a jwt token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// send response with token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  user.password = undefined;
  user.otp = undefined;

  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// =====================================
//          SIGNUP CONTROLLER
// =====================================
exports.signup = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please fill all required fields.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          status: "fail",
          message: "An account with this email already exists.",
        });
      }
      if (existingUser.phone === phone) {
        return res.status(409).json({
          status: "fail",
          message: "An account with this phone number already exists.",
        });
      }
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      isGuest: false,
    });

    // Auto-login (send JWT token)
    createSendToken(newUser, 201, res);

    sendEmail({
      email: newUser.email,
      subject: "Welcome to Sajilo Hariyo!",
      message: `Hello ${newUser.name},\n\nYour account has been successfully created.\nWelcome to Sajilo Hariyo! 🌱\n\nRegards,\nSajilo Hariyo Team`,
    }).catch((err) => {
      console.error("Signup success email failed:", err.message);
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ============================
// LOGIN
// ============================
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Please provide phone and password" });
    }

    const user = await User.findOne({ phone }).select("+password");

    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({ message: "Incorrect phone or password" });
    }

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ============================
// FORGOT PASSWORD (Request OTP)
// ============================
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "There is no user with that email address." });
    }

    const otp = await user.generateOTP();
    await user.save({ validateBeforeSave: false });

    const message = `Your password reset code is: ${otp}\nValid for 5 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Code (Sajilo Hariyo)",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "OTP sent to email!",
      });
    } catch (err) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: "There was an error sending the email. Try again later.",
      });
    }
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ============================
// FORGOT PASSWORD (VERIFY OTP)
// ============================
exports.verifyPassOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Please provide email and OTP" });
    }

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCorrect = await user.correctOTP(otp);
    if (!isCorrect) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully. Please enter your new password.",
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ============================
// FORGOT PASSWORD (RESET PASSWORD)
// ============================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email, OTP, and new password" });
    }

    const user = await User.findOne({ email }).select("+otp +otpExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // done to prevent bypassing OTP verification step
    const isCorrect = await user.correctOTP(otp);
    if (!isCorrect) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = password;
    user.otp = undefined; // to clear the otp field once used
    user.otpExpires = undefined;

    await user.save();

    createSendToken(user, 200, res); // logs the user automatically after password reset
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
