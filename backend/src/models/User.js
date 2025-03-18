const mongoose = require('mongoose');
const crypto = require('crypto-js');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    sparse: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  photoUrl: {
    type: String
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  balance: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pinCode: {
    type: String,
    select: false
  },
  pinLocked: {
    type: Boolean,
    default: false
  },
  pinFailAttempts: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'ru'
    },
    notifications: {
      sales: {
        type: Boolean,
        default: true
      },
      auctions: {
        type: Boolean,
        default: true
      },
      bids: {
        type: Boolean,
        default: true
      },
      priceChanges: {
        type: Boolean,
        default: true
      },
      newItems: {
        type: Boolean,
        default: true
      }
    }
  },
  stats: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    salesCount: {
      type: Number,
      default: 0
    },
    purchasesCount: {
      type: Number,
      default: 0
    },
    referralsCount: {
      type: Number,
      default: 0
    }
  },
  nfts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT'
  }],
  favoriteNfts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT'
  }],
  lastActive: {
    type: Date,
    default: Date.now
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

// Генерация уникального реферального кода
userSchema.methods.generateReferralCode = function() {
  const randomBytes = crypto.lib.WordArray.random(4);
  this.referralCode = crypto.enc.Hex.stringify(randomBytes);
  return this.referralCode;
};

// Установка PIN-кода с хешированием
userSchema.methods.setPin = function(pinCode) {
  if (!pinCode || pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
    throw new Error('PIN код должен состоять из 4 цифр');
  }
  
  this.pinCode = crypto.SHA256(pinCode).toString();
  this.pinFailAttempts = 0;
  this.pinLocked = false;
  return this.pinCode;
};

// Проверка PIN-кода
userSchema.methods.verifyPin = function(pinCode) {
  if (this.pinLocked) {
    throw new Error('Аккаунт заблокирован из-за превышения лимита попыток');
  }
  
  const hash = crypto.SHA256(pinCode).toString();
  const isValid = this.pinCode === hash;
  
  if (!isValid) {
    this.pinFailAttempts += 1;
    
    if (this.pinFailAttempts >= 5) {
      this.pinLocked = true;
    }
    
    this.save();
  } else {
    // Сбросить счетчик неудачных попыток при успешной проверке
    this.pinFailAttempts = 0;
    this.save();
  }
  
  return isValid;
};

// Инкрементировать счетчик рефералов
userSchema.methods.incrementReferralsCount = function() {
  this.stats.referralsCount += 1;
  return this.save();
};

// Обновить время последней активности
userSchema.methods.updateLastActive = function() {
  this.lastActive = Date.now();
  return this.save();
};

// Обновить статистику после продажи NFT
userSchema.methods.recordSale = function(amount) {
  this.stats.totalSales += amount;
  this.stats.totalEarnings += amount;
  this.stats.salesCount += 1;
  this.balance += amount;
  return this.save();
};

// Обновить статистику после покупки NFT
userSchema.methods.recordPurchase = function(amount) {
  this.stats.totalPurchases += amount;
  this.stats.totalSpent += amount;
  this.stats.purchasesCount += 1;
  this.balance -= amount;
  return this.save();
};

// Пре-сохранение: обновляем updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema); 