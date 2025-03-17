const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'sale', 'auction_bid', 'auction_win', 'giveaway_win', 'transfer', 'deposit', 'withdrawal'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nft: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
    required: function() {
      return ['purchase', 'sale', 'auction_bid', 'auction_win', 'giveaway_win', 'transfer'].includes(this.type);
    },
  },
  amount: {
    value: Number,
    currency: {
      type: String,
      enum: ['TON', 'USDT', 'RUB'],
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  transactionHash: {
    type: String,
    sparse: true,
  },
  metadata: {
    from: String,
    to: String,
    auctionId: String,
    giveawayId: String,
    description: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

// Индексы для оптимизации запросов
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ nft: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ transactionHash: 1 });

// Middleware для установки completedAt
transactionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 