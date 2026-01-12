const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['order', 'promo', 'system', 'info'],
    default: 'info'
  },
  target: {
    type: String,
    enum: ['all', 'customer', 'admin', 'specific'],
    required: true
  },
  // Only used if target == 'specific'
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;