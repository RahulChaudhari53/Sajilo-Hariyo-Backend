const jwt = require("jsonwebtoken");
const User = require("../models/user");
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
const signup = async (req, res, next) => {
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
// 2. LOGIN
// ============================
const login = async (req, res, next) => {
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

module.exports = {
  signup,
  login,
};
