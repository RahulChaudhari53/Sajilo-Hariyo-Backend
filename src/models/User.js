const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" }, // e.g., Home, Work
  street: { type: String, required: true },
  city: { type: String, required: true },
  detail: { type: String }, // For "Near Radisson Hotel"
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  username: { type: String }, // Store user name for admin context
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name."],
      trim: true,
      minlength: 2,
      max_length: 50,
    },
    email: {
      type: String,
      required: [true, "Please provide your email."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please provide your phone number."],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters long"],
      match: [
        /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
        "Password must contain at least one number and one special character",
      ],
      select: false,
    },
    profileImage: {
      type: String,
      default: "default.png", // public/uploads/profiles
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.ObjectId, ref: "Product" }],

    // otp fields
    otp: { type: String, select: false },
    otpExpires: { type: Date },

    active: { type: Boolean, default: true, select: false },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = async function () {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = await bcrypt.hash(otpCode, 12);
  this.otpExpires = Date.now() + 5 * 60 * 1000;
  return otpCode;
};

userSchema.methods.correctOTP = async function (candidateOTP) {
  if (!this.otp || !this.otpExpires) return false;
  if (this.otpExpires < Date.now()) return false;
  return await bcrypt.compare(candidateOTP, this.otp);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
