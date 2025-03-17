const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { authLimiter } = require('../middleware/rateLimiter');

// Генерация JWT токена
const generateToken = (telegramId) => {
  return jwt.sign({ telegramId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

// Регистрация пользователя через Telegram
const register = async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body;

    // Проверяем, существует ли пользователь
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Создаем нового пользователя
      user = new User({
        telegramId,
        username,
        firstName,
        lastName,
      });

      // Генерируем реферальный код
      user.referralCode = user.generateReferralCode();

      await user.save();
    }

    // Генерируем токен
    const token = generateToken(user.telegramId);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          referralCode: user.referralCode,
        },
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Вход пользователя
const login = async (req, res) => {
  try {
    const { telegramId } = req.body;

    // Находим пользователя
    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Генерируем токен
    const token = generateToken(user.telegramId);

    // Обновляем время последней активности
    user.lastActive = new Date();
    await user.save();

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          referralCode: user.referralCode,
        },
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Выход пользователя
const logout = async (req, res) => {
  try {
    // В будущем здесь можно добавить логику инвалидации токена
    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Обновление токена
const refreshToken = async (req, res) => {
  try {
    const { telegramId } = req.user;

    // Генерируем новый токен
    const token = generateToken(telegramId);

    res.json({
      status: 'success',
      data: { token },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Проверка реферального кода
const checkReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.params;

    const referrer = await User.findOne({ referralCode });

    if (!referrer) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid referral code',
      });
    }

    res.json({
      status: 'success',
      data: {
        referrer: {
          id: referrer._id,
          username: referrer.username,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  checkReferralCode,
}; 