const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');
const config = require('../config/config');

// Создаем клиент Redis
const redisClient = Redis.createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Базовый лимитер для всех запросов
const baseLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:base:',
  }),
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
});

// Лимитер для аутентификации
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.',
  },
});

// Лимитер для создания NFT
const createNFTLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:create-nft:',
  }),
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // 10 NFT в час
  message: {
    status: 'error',
    message: 'Too many NFT creation attempts, please try again later.',
  },
});

// Лимитер для ставок на аукционе
const auctionBidLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:auction-bid:',
  }),
  windowMs: 60 * 1000, // 1 минута
  max: 30, // 30 ставок в минуту
  message: {
    status: 'error',
    message: 'Too many bid attempts, please try again later.',
  },
});

// Лимитер для API запросов
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:api:',
  }),
  windowMs: 60 * 1000, // 1 минута
  max: 100, // 100 запросов в минуту
  message: {
    status: 'error',
    message: 'Too many API requests, please try again later.',
  },
});

module.exports = {
  baseLimiter,
  authLimiter,
  createNFTLimiter,
  auctionBidLimiter,
  apiLimiter,
}; 