const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('redis');

// Импорт роутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const nftRoutes = require('./routes/nft');
const auctionRoutes = require('./routes/auction');
const giveawayRoutes = require('./routes/giveaway');
const transactionRoutes = require('./routes/transaction');
const notificationRoutes = require('./routes/notification');

// Импорт middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');

// Инициализация приложения
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Подключение к Redis
const redisClient = Redis.createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/giveaways', giveawayRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Обработка ошибок
app.use(errorHandler);

// Подключение к MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// WebSocket обработчики
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Запуск сервера
const PORT = config.PORT;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
}); 