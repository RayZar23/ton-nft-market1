const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    // Проверяем токен
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Находим пользователя
    const user = await User.findOne({ telegramId: decoded.telegramId });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Добавляем пользователя в объект запроса
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Please authenticate',
    });
  }
};

// Middleware для проверки роли пользователя
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }
    next();
  };
};

// Middleware для проверки владения NFT
const checkNFTOwnership = async (req, res, next) => {
  try {
    const nftId = req.params.nftId || req.body.nftId;
    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not own this NFT',
      });
    }

    req.nft = nft;
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Middleware для проверки PIN-кода
const checkPinCode = async (req, res, next) => {
  try {
    const { pinCode } = req.body;

    if (!pinCode) {
      return res.status(400).json({
        status: 'error',
        message: 'PIN code is required',
      });
    }

    if (pinCode !== req.user.settings.security.pinCode) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid PIN code',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

module.exports = {
  auth,
  checkRole,
  checkNFTOwnership,
  checkPinCode,
}; 