const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'bid', 'sale', 'purchase', 'auction_end', 'auction_start', 
      'price_change', 'new_follower', 'system', 'offer', 'referral',
      'royalty', 'transfer', 'withdrawal'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  nftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActionRequired: {
    type: Boolean,
    default: false
  },
  action: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Метод для пометки уведомления как прочитанное
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Статический метод для создания уведомления о новой ставке
notificationSchema.statics.createBidNotification = async function(userId, bidAmount, nftId, bidderName) {
  const notification = new this({
    userId: userId,
    type: 'bid',
    title: 'Новая ставка на ваш NFT',
    message: `${bidderName} сделал ставку ${bidAmount} TON на ваш NFT`,
    nftId: nftId,
    isActionRequired: false
  });
  
  return notification.save();
};

// Статический метод для создания уведомления о продаже NFT
notificationSchema.statics.createSaleNotification = async function(sellerId, buyerName, amount, nftId, transactionId) {
  const notification = new this({
    userId: sellerId,
    type: 'sale',
    title: 'Ваш NFT продан',
    message: `${buyerName} купил ваш NFT за ${amount} TON`,
    nftId: nftId,
    transactionId: transactionId,
    isActionRequired: false
  });
  
  return notification.save();
};

// Статический метод для создания уведомления о покупке NFT
notificationSchema.statics.createPurchaseNotification = async function(buyerId, sellerName, amount, nftId, transactionId) {
  const notification = new this({
    userId: buyerId,
    type: 'purchase',
    title: 'Вы купили NFT',
    message: `Вы успешно приобрели NFT у ${sellerName} за ${amount} TON`,
    nftId: nftId,
    transactionId: transactionId,
    isActionRequired: false
  });
  
  return notification.save();
};

// Статический метод для создания уведомления о начале аукциона
notificationSchema.statics.createAuctionStartNotification = async function(userId, nftName, nftId) {
  const notification = new this({
    userId: userId,
    type: 'auction_start',
    title: 'Аукцион начался',
    message: `Начался аукцион на NFT "${nftName}"`,
    nftId: nftId,
    isActionRequired: false
  });
  
  return notification.save();
};

// Статический метод для создания уведомления об окончании аукциона
notificationSchema.statics.createAuctionEndNotification = async function(userId, nftName, isWinner, finalPrice, nftId) {
  const title = isWinner ? 'Вы выиграли аукцион' : 'Аукцион завершен';
  const message = isWinner 
    ? `Поздравляем! Вы выиграли аукцион на NFT "${nftName}" за ${finalPrice} TON` 
    : `Аукцион на NFT "${nftName}" завершен. Финальная цена: ${finalPrice} TON`;
  
  const notification = new this({
    userId: userId,
    type: 'auction_end',
    title: title,
    message: message,
    nftId: nftId,
    isActionRequired: isWinner,
    action: isWinner ? 'pay' : null
  });
  
  return notification.save();
};

// Статический метод для создания системного уведомления
notificationSchema.statics.createSystemNotification = async function(userId, title, message, isActionRequired = false, action = null) {
  const notification = new this({
    userId: userId,
    type: 'system',
    title: title,
    message: message,
    isActionRequired: isActionRequired,
    action: action
  });
  
  return notification.save();
};

// Статический метод для создания уведомления о роялти
notificationSchema.statics.createRoyaltyNotification = async function(creatorId, amount, nftId, transactionId) {
  const notification = new this({
    userId: creatorId,
    type: 'royalty',
    title: 'Получены роялти',
    message: `Вы получили ${amount} TON в качестве роялти за продажу вашего NFT`,
    nftId: nftId,
    transactionId: transactionId,
    isActionRequired: false
  });
  
  return notification.save();
};

// Индексы для оптимизации запросов
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL индекс для автоматического удаления просроченных уведомлений

module.exports = mongoose.model('Notification', notificationSchema); 