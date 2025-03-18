const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Redis = require('redis');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Импорт конфигурации
const config = require('./config/config');

// Импорт middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Импорт маршрутов
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const nftRoutes = require('./routes/nftRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Инициализация Express
const app = express();
const server = http.createServer(app);

// Инициализация Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.app.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// Инициализация Redis
const redisClient = Redis.createClient({
  url: config.redis.url
});

// Подключение к Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
})();

// Обработка ошибок Redis
redisClient.on('error', (err) => console.error('Redis error', err));

// Установка соединения с MongoDB
mongoose.connect(config.db.uri, config.db.options)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Создание директории для загрузок, если она не существует
const uploadDir = path.join(__dirname, '../..', config.storage.local.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.app.env === 'development' ? 'dev' : 'combined'));

// Статические файлы
app.use('/uploads', express.static(uploadDir));

// Rate Limiting
app.use(rateLimiter.baseLimiter);

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);

// Обработчик 404
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Обработчик ошибок
app.use(errorHandler);

// Socket.IO соединения
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Аутентификация сокета
  socket.on('authenticate', async (token) => {
    try {
      // Здесь будет логика верификации токена и получения пользователя
      // const user = await verifyToken(token);
      socket.join(`user:${user._id}`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  });
  
  // Подписка на обновления NFT
  socket.on('subscribe:nft', (nftId) => {
    socket.join(`nft:${nftId}`);
  });
  
  // Отписка от обновлений NFT
  socket.on('unsubscribe:nft', (nftId) => {
    socket.leave(`nft:${nftId}`);
  });
  
  // Подписка на обновления аукциона
  socket.on('subscribe:auction', (auctionId) => {
    socket.join(`auction:${auctionId}`);
  });
  
  // Отписка от обновлений аукциона
  socket.on('unsubscribe:auction', (auctionId) => {
    socket.leave(`auction:${auctionId}`);
  });
  
  // Отключение
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Запуск сервера
const PORT = config.app.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.app.env} mode`);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Не закрываем сервер сразу, даем время для обработки текущих запросов
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Необходимо перезапустить процесс, так как состояние приложения непредсказуемо
  process.exit(1);
}); 