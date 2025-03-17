const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'price_offer',
      'favorite_update',
      'giveaway_new',
      'giveaway_win',
      'giveaway_end',
      'auction_bid',
      'auction_win',
      'auction_end',
      'purchase_complete',
      'sale_complete',
      'transfer_complete',
      'security_alert',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    nft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFT',
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFT',
    },
    giveaway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFT',
    },
    price: Number,
    currency: String,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  read: {
    type: Boolean,
    default: false,
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readAt: Date,
});

// Индексы для оптимизации запросов
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Middleware для установки readAt
notificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 