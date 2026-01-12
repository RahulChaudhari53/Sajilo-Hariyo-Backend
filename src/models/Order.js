const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],

  shippingInfo: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    name: { type: String, required: true },
  },

  paymentInfo: {
    id: { type: String }, 
    status: { type: String, required: true },
    method: { type: String, required: true }, 
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0.0,
  },

  orderStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },

  deliveryCode: {
    type: String,
    select: false,
  },

  orderHistory: [
    {
      status: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
