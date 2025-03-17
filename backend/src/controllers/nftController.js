const NFT = require('../models/NFT');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { createNFTLimiter } = require('../middleware/rateLimiter');

// Создание нового NFT
const createNFT = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      category,
      attributes,
      price,
      metadata,
    } = req.body;

    const nft = new NFT({
      name,
      description,
      image,
      category,
      attributes,
      price,
      metadata,
      creator: req.user._id,
      owner: req.user._id,
      tokenId: `NFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    await nft.save();

    // Добавляем NFT в коллекцию пользователя
    await User.findByIdAndUpdate(req.user._id, {
      $push: { nftCollection: nft._id },
    });

    res.status(201).json({
      status: 'success',
      data: { nft },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Получение списка NFT с фильтрацией и пагинацией
const getNFTs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    const query = {};

    // Применяем фильтры
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Применяем сортировку
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Получаем NFT с пагинацией
    const nfts = await NFT.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'username')
      .populate('owner', 'username');

    // Получаем общее количество NFT
    const total = await NFT.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        nfts,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
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

// Получение детальной информации об NFT
const getNFTById = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id)
      .populate('creator', 'username')
      .populate('owner', 'username');

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Увеличиваем счетчик просмотров
    nft.views += 1;
    await nft.save();

    res.json({
      status: 'success',
      data: { nft },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Обновление информации об NFT
const updateNFT = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Проверяем права на обновление
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this NFT',
      });
    }

    // Обновляем только разрешенные поля
    const allowedUpdates = ['name', 'description', 'price', 'category'];
    allowedUpdates.forEach((update) => {
      if (req.body[update] !== undefined) {
        nft[update] = req.body[update];
      }
    });

    await nft.save();

    res.json({
      status: 'success',
      data: { nft },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Удаление NFT
const deleteNFT = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Проверяем права на удаление
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this NFT',
      });
    }

    // Удаляем NFT из коллекции пользователя
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { nftCollection: nft._id },
    });

    await nft.remove();

    res.json({
      status: 'success',
      message: 'NFT deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Добавление NFT в избранное
const addToFavorites = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Добавляем NFT в избранное пользователя
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: nft._id },
    });

    // Увеличиваем счетчик избранного
    nft.favorites += 1;
    await nft.save();

    res.json({
      status: 'success',
      message: 'NFT added to favorites',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Удаление NFT из избранного
const removeFromFavorites = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Удаляем NFT из избранного пользователя
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: nft._id },
    });

    // Уменьшаем счетчик избранного
    nft.favorites = Math.max(0, nft.favorites - 1);
    await nft.save();

    res.json({
      status: 'success',
      message: 'NFT removed from favorites',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  createNFT,
  getNFTs,
  getNFTById,
  updateNFT,
  deleteNFT,
  addToFavorites,
  removeFromFavorites,
}; 