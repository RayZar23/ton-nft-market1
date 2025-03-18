const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  imageHash: {
    type: String
  },
  thumbnailImage: {
    type: String
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousOwners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['created', 'on_sale', 'auction', 'sold', 'transferring', 'burned'],
    default: 'created'
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    enum: ['TON'],
    default: 'TON'
  },
  auction: {
    startPrice: Number,
    currentPrice: Number,
    minBidIncrement: Number,
    startTime: Date,
    endTime: Date,
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bids: [{
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  category: {
    type: String,
    enum: ['art', 'collectibles', 'game', 'photography', 'memes', 'music', 'utility', 'other'],
    default: 'other',
    index: true
  },
  attributes: [{
    trait_type: String,
    value: mongoose.Schema.Types.Mixed
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  royalties: {
    percent: {
      type: Number,
      default: 0, // Процент роялти (от 0 до 1)
      min: 0,
      max: 0.15 // Максимум 15%
    },
    address: {
      type: String
    }
  },
  ipfsHash: {
    type: String
  },
  blockchain: {
    contractAddress: String,
    transactionHash: String,
    blockNumber: Number,
    confirmations: {
      type: Number,
      default: 0
    }
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoritesCount: {
    type: Number,
    default: 0
  },
  saleHistory: [{
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: Number,
    date: {
      type: Date,
      default: Date.now
    },
    transactionHash: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Увеличить счетчик просмотров
nftSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Увеличить счетчик избранного
nftSchema.methods.incrementFavoritesCount = function() {
  this.favoritesCount += 1;
  return this.save();
};

// Уменьшить счетчик избранного
nftSchema.methods.decrementFavoritesCount = function() {
  if (this.favoritesCount > 0) {
    this.favoritesCount -= 1;
  }
  return this.save();
};

// Добавить ставку на аукционе
nftSchema.methods.addBid = function(userId, amount) {
  if (!this.auction) {
    this.auction = {
      bids: []
    };
  }
  
  this.auction.bids.push({
    bidder: userId,
    amount: amount,
    timestamp: new Date()
  });
  
  this.auction.currentPrice = amount;
  this.auction.highestBidder = userId;
  
  return this.save();
};

// Добавить запись в историю продаж
nftSchema.methods.addSaleRecord = function(sellerId, buyerId, price, transactionHash) {
  this.saleHistory.push({
    seller: sellerId,
    buyer: buyerId,
    price: price,
    date: new Date(),
    transactionHash: transactionHash
  });
  
  // Обновляем предыдущих владельцев
  this.previousOwners.push({
    user: sellerId,
    price: price,
    date: new Date()
  });
  
  return this.save();
};

// Установить NFT на продажу
nftSchema.methods.putOnSale = function(price) {
  this.status = 'on_sale';
  this.price = price;
  return this.save();
};

// Создать аукцион для NFT
nftSchema.methods.createAuction = function(startPrice, minBidIncrement, endTime) {
  this.status = 'auction';
  this.auction = {
    startPrice: startPrice,
    currentPrice: startPrice,
    minBidIncrement: minBidIncrement || 0.05, // 5% по умолчанию
    startTime: new Date(),
    endTime: endTime,
    bids: []
  };
  return this.save();
};

// Отменить продажу NFT
nftSchema.methods.cancelSale = function() {
  this.status = 'created';
  this.price = 0;
  return this.save();
};

// Отменить аукцион NFT
nftSchema.methods.cancelAuction = function() {
  this.status = 'created';
  this.auction = undefined;
  return this.save();
};

// Завершить продажу NFT
nftSchema.methods.completeSale = function(buyerId, transactionHash) {
  const previousOwner = this.owner;
  
  this.status = 'sold';
  this.previousOwners.push({
    user: previousOwner,
    price: this.price,
    date: new Date()
  });
  
  this.saleHistory.push({
    seller: previousOwner,
    buyer: buyerId,
    price: this.price,
    date: new Date(),
    transactionHash: transactionHash
  });
  
  this.owner = buyerId;
  
  return this.save();
};

// Пре-сохранение: обновляем updatedAt
nftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Пре-удаление: очищаем связи
nftSchema.pre('remove', async function(next) {
  try {
    // Можно добавить логику удаления из избранного пользователей
    next();
  } catch (error) {
    next(error);
  }
});

// Индексы для оптимизации запросов
nftSchema.index({ creator: 1 });
nftSchema.index({ owner: 1 });
nftSchema.index({ price: 1 });
nftSchema.index({ status: 1 });
nftSchema.index({ 'auction.endTime': 1 });
nftSchema.index({ createdAt: -1 });
nftSchema.index({ viewCount: -1 });
nftSchema.index({ favoritesCount: -1 });

module.exports = mongoose.model('NFT', nftSchema); 