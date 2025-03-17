const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Ошибки валидации Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(error => error.message),
    });
  }

  // Ошибки дублирования ключей
  if (err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate key error',
      field: Object.keys(err.keyPattern)[0],
    });
  }

  // Ошибки JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  // Ошибки TON
  if (err.name === 'TONError') {
    return res.status(400).json({
      status: 'error',
      message: 'TON blockchain error',
      details: err.message,
    });
  }

  // Ошибки Redis
  if (err.name === 'RedisError') {
    return res.status(503).json({
      status: 'error',
      message: 'Cache service unavailable',
    });
  }

  // Ошибки Socket.IO
  if (err.name === 'SocketError') {
    return res.status(500).json({
      status: 'error',
      message: 'WebSocket error',
    });
  }

  // Ошибки файловой системы
  if (err.name === 'MulterError') {
    return res.status(400).json({
      status: 'error',
      message: 'File upload error',
      details: err.message,
    });
  }

  // Ошибки по умолчанию
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler; 