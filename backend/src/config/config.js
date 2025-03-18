require('dotenv').config();

module.exports = {
  // Общие настройки приложения
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  
  // Настройки MongoDB
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ton-nft-market',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // Настройки Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Настройки Telegram Bot API
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    apiId: process.env.TELEGRAM_API_ID,
    apiHash: process.env.TELEGRAM_API_HASH,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  },
  
  // Настройки TON
  ton: {
    apiKey: process.env.TON_API_KEY,
    testnet: process.env.TON_TESTNET === 'true',
    endpoints: {
      mainnet: 'https://toncenter.com/api/v2/jsonRPC',
      testnet: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    },
    // Адрес смарт-контракта маркетплейса
    contractAddress: process.env.TON_CONTRACT_ADDRESS,
  },
  
  // Настройки хранилища файлов
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // local, s3, ipfs
    local: {
      uploadDir: process.env.UPLOAD_DIR || 'uploads',
    },
    ipfs: {
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
      pinataApiKey: process.env.PINATA_API_KEY,
      pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
    },
  },
  
  // Ограничения для NFT и аукционов
  nft: {
    maxFileSize: 20 * 1024 * 1024, // 20 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'],
    auction: {
      minDuration: 1 * 60 * 60, // 1 час в секундах
      maxDuration: 7 * 24 * 60 * 60, // 7 дней в секундах
      minBidIncrease: 0.05, // 5% минимальное увеличение ставки
    },
    royalties: {
      max: 0.15, // Максимальный процент роялти (15%)
    },
  },
  
  // Комиссии площадки
  fees: {
    sale: 0.025, // 2.5% комиссия с продажи
    auction: 0.025, // 2.5% комиссия с аукциона
    mintingFee: 0.1, // 0.1 TON за создание NFT
  },
}; 