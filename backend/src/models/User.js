const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  balance: {
    ton: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 },
    rub: { type: Number, default: 0 },
  },
  nftCollection: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
  }],
  settings: {
    notifications: {
      all: { type: Boolean, default: true },
      important: { type: Boolean, default: true },
      priceOffers: { type: Boolean, default: true },
      favorites: { type: Boolean, default: true },
      giveaways: { type: Boolean, default: true },
      auctions: { type: Boolean, default: true },
      purchases: { type: Boolean, default: true },
    },
    security: {
      pinCode: String,
      twoFactorEnabled: { type: Boolean, default: false },
    },
    autoBuy: {
      enabled: { type: Boolean, default: false },
      criteria: {
        maxPrice: Number,
        categories: [String],
        autoParticipateGiveaways: { type: Boolean, default: false },
        autoWithdraw: { type: Boolean, default: false },
      },
    },
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  referralRewards: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

// Методы для работы с паролем (если потребуется)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Метод для генерации реферального кода
userSchema.methods.generateReferralCode = function() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Индексы для оптимизации запросов
userSchema.index({ telegramId: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ referralCode: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 