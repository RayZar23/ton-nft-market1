const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['gift', 'art', 'collectible', 'game', 'other'],
  },
  attributes: [{
    trait_type: String,
    value: String,
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  price: {
    amount: Number,
    currency: {
      type: String,
      enum: ['TON', 'USDT', 'RUB'],
    },
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'sold', 'auction', 'giveaway'],
    default: 'draft',
  },
  auction: {
    startPrice: Number,
    currentPrice: Number,
    startTime: Date,
    endTime: Date,
    bids: [{
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      amount: Number,
      timestamp: Date,
    }],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  giveaway: {
    startTime: Date,
    endTime: Date,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  priceHistory: [{
    price: Number,
    currency: String,
    timestamp: Date,
  }],
  views: {
    type: Number,
    default: 0,
  },
  favorites: {
    type: Number,
    default: 0,
  },
  metadata: {
    model: String,
    pattern: String,
    background: String,
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Индексы для оптимизации запросов
nftSchema.index({ tokenId: 1 });
nftSchema.index({ category: 1 });
nftSchema.index({ status: 1 });
nftSchema.index({ 'auction.endTime': 1 });
nftSchema.index({ 'giveaway.endTime': 1 });
nftSchema.index({ creator: 1 });
nftSchema.index({ owner: 1 });

// Middleware для обновления updatedAt
nftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const NFT = mongoose.model('NFT', nftSchema);

module.exports = NFT; 