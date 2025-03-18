const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'purchase', 'sale', 'bid', 'deposit', 'withdrawal', 
      'refund', 'royalty', 'fee', 'reward', 'transfer'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['TON'],
    default: 'TON'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  nftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'canceled'],
    default: 'pending'
  },
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    confirmations: {
      type: Number,
      default: 0
    },
    fromAddress: String,
    toAddress: String,
    networkFee: Number
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String
  },
  balanceBefore: {
    type: Number
  },
  balanceAfter: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Метод для обновления статуса транзакции
transactionSchema.methods.updateStatus = function(status, transactionHash = null) {
  this.status = status;
  
  if (transactionHash) {
    if (!this.blockchain) this.blockchain = {};
    this.blockchain.transactionHash = transactionHash;
  }
  
  return this.save();
};

// Метод для обновления блокчейн-информации
transactionSchema.methods.updateBlockchainInfo = function(blockchainInfo) {
  if (!this.blockchain) this.blockchain = {};
  
  Object.assign(this.blockchain, blockchainInfo);
  
  if (blockchainInfo.confirmations && blockchainInfo.confirmations >= 3) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Статический метод для создания транзакции покупки NFT
transactionSchema.statics.createPurchase = async function(buyerId, sellerId, nftId, amount, description) {
  const transaction = new this({
    type: 'purchase',
    amount: amount,
    userId: buyerId,
    recipientId: sellerId,
    nftId: nftId,
    description: description
  });
  
  await transaction.save();
  
  // Создаем парную транзакцию продажи для продавца
  const saleTransaction = new this({
    type: 'sale',
    amount: amount,
    userId: sellerId,
    recipientId: buyerId,
    nftId: nftId,
    description: `Продажа NFT #${nftId}`
  });
  
  await saleTransaction.save();
  
  return transaction;
};

// Статический метод для создания транзакции ставки на аукционе
transactionSchema.statics.createBid = async function(bidderId, nftId, amount, description) {
  const transaction = new this({
    type: 'bid',
    amount: amount,
    userId: bidderId,
    nftId: nftId,
    description: description || `Ставка на аукционе NFT #${nftId}`
  });
  
  return transaction.save();
};

// Статический метод для создания транзакции для роялти
transactionSchema.statics.createRoyalty = async function(creatorId, amount, nftId, description) {
  const transaction = new this({
    type: 'royalty',
    amount: amount,
    userId: creatorId,
    nftId: nftId,
    description: description || `Роялти от продажи NFT #${nftId}`
  });
  
  return transaction.save();
};

// Пре-сохранение: обновляем updatedAt
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema); 