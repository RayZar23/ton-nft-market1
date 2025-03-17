require('dotenv').config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ton-nft-market',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // TON Configuration
  TON_NETWORK: process.env.TON_NETWORK || 'mainnet',
  TON_ENDPOINT: process.env.TON_ENDPOINT || 'https://ton-center.com/api/v2/jsonRPC',

  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // File Upload Configuration
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB

  // Telegram Configuration
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,

  // API Rate Limiting
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,

  // Auction Configuration
  AUCTION_MIN_DURATION: process.env.AUCTION_MIN_DURATION || 24 * 60 * 60 * 1000, // 24 hours
  AUCTION_MAX_DURATION: process.env.AUCTION_MAX_DURATION || 7 * 24 * 60 * 60 * 1000, // 7 days
  AUCTION_MIN_BID_INCREASE: process.env.AUCTION_MIN_BID_INCREASE || 0.05, // 5%

  // Notification Configuration
  NOTIFICATION_QUEUE_NAME: process.env.NOTIFICATION_QUEUE_NAME || 'notifications',
  NOTIFICATION_BATCH_SIZE: process.env.NOTIFICATION_BATCH_SIZE || 100,
}; 