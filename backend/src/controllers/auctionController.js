const NFT = require('../models/NFT');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { auctionBidLimiter } = require('../middleware/rateLimiter');
const config = require('../config/config');

// Создание нового аукциона
const createAuction = async (req, res) => {
  try {
    const { nftId, startPrice, duration } = req.body;

    // Проверяем длительность аукциона
    if (duration < config.AUCTION_MIN_DURATION || duration > config.AUCTION_MAX_DURATION) {
      return res.status(400).json({
        status: 'error',
        message: `Auction duration must be between ${config.AUCTION_MIN_DURATION / (1000 * 60 * 60)} and ${config.AUCTION_MAX_DURATION / (1000 * 60 * 60)} hours`,
      });
    }

    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Проверяем права на создание аукциона
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not own this NFT',
      });
    }

    // Проверяем, не участвует ли NFT уже в аукционе
    if (nft.status === 'auction') {
      return res.status(400).json({
        status: 'error',
        message: 'This NFT is already in an auction',
      });
    }

    // Обновляем статус NFT и добавляем информацию об аукционе
    nft.status = 'auction';
    nft.auction = {
      startPrice,
      currentPrice: startPrice,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration),
    };

    await nft.save();

    // Создаем уведомление
    await Notification.create({
      user: nft.owner,
      type: 'auction_start',
      title: 'Auction Started',
      message: `Your NFT "${nft.name}" has been listed for auction`,
      data: { nft: nft._id },
      priority: 'medium',
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

// Размещение ставки
const placeBid = async (req, res) => {
  try {
    const { nftId, amount } = req.body;

    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Проверяем, активен ли аукцион
    if (nft.status !== 'auction') {
      return res.status(400).json({
        status: 'error',
        message: 'This NFT is not in an active auction',
      });
    }

    // Проверяем, не закончился ли аукцион
    if (nft.auction.endTime < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Auction has ended',
      });
    }

    // Проверяем, не является ли пользователь владельцем
    if (nft.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot bid on your own NFT',
      });
    }

    // Проверяем минимальное увеличение ставки
    const minBidIncrease = nft.auction.currentPrice * config.AUCTION_MIN_BID_INCREASE;
    if (amount < nft.auction.currentPrice + minBidIncrease) {
      return res.status(400).json({
        status: 'error',
        message: `Bid must be at least ${minBidIncrease} higher than current price`,
      });
    }

    // Обновляем текущую цену и добавляем ставку
    nft.auction.currentPrice = amount;
    nft.auction.bids.push({
      bidder: req.user._id,
      amount,
      timestamp: new Date(),
    });

    await nft.save();

    // Создаем транзакцию
    await Transaction.create({
      type: 'auction_bid',
      user: req.user._id,
      nft: nft._id,
      amount: {
        value: amount,
        currency: 'TON',
      },
      status: 'completed',
    });

    // Создаем уведомления
    await Notification.create([
      {
        user: nft.owner,
        type: 'auction_bid',
        title: 'New Bid',
        message: `New bid of ${amount} TON placed on your NFT "${nft.name}"`,
        data: { nft: nft._id, price: amount },
        priority: 'high',
      },
      {
        user: req.user._id,
        type: 'auction_bid',
        title: 'Bid Placed',
        message: `Your bid of ${amount} TON has been placed on "${nft.name}"`,
        data: { nft: nft._id, price: amount },
        priority: 'medium',
      },
    ]);

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

// Получение списка активных аукционов
const getActiveAuctions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      sortBy = 'auction.endTime',
      sortOrder = 'asc',
    } = req.query;

    const query = {
      status: 'auction',
      'auction.endTime': { $gt: new Date() },
    };

    // Применяем фильтры
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query['auction.currentPrice'] = {};
      if (minPrice) query['auction.currentPrice'].$gte = Number(minPrice);
      if (maxPrice) query['auction.currentPrice'].$lte = Number(maxPrice);
    }

    // Применяем сортировку
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Получаем аукционы с пагинацией
    const auctions = await NFT.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'username')
      .populate('owner', 'username');

    // Получаем общее количество аукционов
    const total = await NFT.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        auctions,
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

// Получение детальной информации об аукционе
const getAuctionById = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id)
      .populate('creator', 'username')
      .populate('owner', 'username')
      .populate('auction.bids.bidder', 'username');

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found',
      });
    }

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

// Отмена аукциона
const cancelAuction = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found',
      });
    }

    // Проверяем права на отмену
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to cancel this auction',
      });
    }

    // Проверяем, есть ли уже ставки
    if (nft.auction.bids.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel auction with existing bids',
      });
    }

    // Возвращаем статус NFT
    nft.status = 'active';
    nft.auction = undefined;

    await nft.save();

    // Создаем уведомление
    await Notification.create({
      user: nft.owner,
      type: 'auction_cancelled',
      title: 'Auction Cancelled',
      message: `Auction for NFT "${nft.name}" has been cancelled`,
      data: { nft: nft._id },
      priority: 'medium',
    });

    res.json({
      status: 'success',
      message: 'Auction cancelled successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  createAuction,
  placeBid,
  getActiveAuctions,
  getAuctionById,
  cancelAuction,
}; 