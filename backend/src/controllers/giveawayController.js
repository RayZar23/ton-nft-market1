const NFT = require('../models/NFT');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// Создание нового розыгрыша
const createGiveaway = async (req, res) => {
  try {
    const { nftId, duration } = req.body;

    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Проверяем права на создание розыгрыша
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not own this NFT',
      });
    }

    // Проверяем, не участвует ли NFT уже в розыгрыше
    if (nft.status === 'giveaway') {
      return res.status(400).json({
        status: 'error',
        message: 'This NFT is already in a giveaway',
      });
    }

    // Обновляем статус NFT и добавляем информацию о розыгрыше
    nft.status = 'giveaway';
    nft.giveaway = {
      startTime: new Date(),
      endTime: new Date(Date.now() + duration),
      participants: [],
    };

    await nft.save();

    // Создаем уведомление
    await Notification.create({
      user: nft.owner,
      type: 'giveaway_start',
      title: 'Giveaway Started',
      message: `Your NFT "${nft.name}" has been listed for giveaway`,
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

// Участие в розыгрыше
const participateInGiveaway = async (req, res) => {
  try {
    const { nftId } = req.body;

    const nft = await NFT.findById(nftId);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'NFT not found',
      });
    }

    // Проверяем, активен ли розыгрыш
    if (nft.status !== 'giveaway') {
      return res.status(400).json({
        status: 'error',
        message: 'This NFT is not in an active giveaway',
      });
    }

    // Проверяем, не закончился ли розыгрыш
    if (nft.giveaway.endTime < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Giveaway has ended',
      });
    }

    // Проверяем, не является ли пользователь владельцем
    if (nft.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot participate in your own giveaway',
      });
    }

    // Проверяем, не участвует ли пользователь уже
    if (nft.giveaway.participants.includes(req.user._id)) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already participating in this giveaway',
      });
    }

    // Добавляем пользователя в участники
    nft.giveaway.participants.push(req.user._id);
    await nft.save();

    // Создаем уведомление
    await Notification.create([
      {
        user: nft.owner,
        type: 'giveaway_participant',
        title: 'New Participant',
        message: `New participant joined your giveaway for "${nft.name}"`,
        data: { nft: nft._id },
        priority: 'medium',
      },
      {
        user: req.user._id,
        type: 'giveaway_participant',
        title: 'Participation Confirmed',
        message: `You have successfully joined the giveaway for "${nft.name}"`,
        data: { nft: nft._id },
        priority: 'medium',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Successfully joined the giveaway',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Получение списка активных розыгрышей
const getActiveGiveaways = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sortBy = 'giveaway.endTime',
      sortOrder = 'asc',
    } = req.query;

    const query = {
      status: 'giveaway',
      'giveaway.endTime': { $gt: new Date() },
    };

    // Применяем фильтры
    if (category) query.category = category;

    // Применяем сортировку
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Получаем розыгрыши с пагинацией
    const giveaways = await NFT.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'username')
      .populate('owner', 'username');

    // Получаем общее количество розыгрышей
    const total = await NFT.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        giveaways,
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

// Получение детальной информации о розыгрыше
const getGiveawayById = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id)
      .populate('creator', 'username')
      .populate('owner', 'username')
      .populate('giveaway.participants', 'username');

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'Giveaway not found',
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

// Завершение розыгрыша и выбор победителя
const endGiveaway = async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({
        status: 'error',
        message: 'Giveaway not found',
      });
    }

    // Проверяем права на завершение
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to end this giveaway',
      });
    }

    // Проверяем, есть ли участники
    if (nft.giveaway.participants.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot end giveaway with no participants',
      });
    }

    // Выбираем случайного победителя
    const winnerIndex = Math.floor(Math.random() * nft.giveaway.participants.length);
    const winner = nft.giveaway.participants[winnerIndex];

    // Обновляем владельца NFT
    nft.owner = winner;
    nft.status = 'active';
    nft.giveaway.winner = winner;
    nft.giveaway.endTime = new Date();

    await nft.save();

    // Создаем транзакцию
    await Transaction.create({
      type: 'giveaway_win',
      user: winner,
      nft: nft._id,
      amount: {
        value: 0,
        currency: 'TON',
      },
      status: 'completed',
    });

    // Создаем уведомления
    await Notification.create([
      {
        user: winner,
        type: 'giveaway_win',
        title: 'Giveaway Winner',
        message: `Congratulations! You have won the NFT "${nft.name}" in the giveaway`,
        data: { nft: nft._id },
        priority: 'high',
      },
      {
        user: nft.owner,
        type: 'giveaway_end',
        title: 'Giveaway Ended',
        message: `Your giveaway for NFT "${nft.name}" has ended`,
        data: { nft: nft._id, winner },
        priority: 'medium',
      },
    ]);

    res.json({
      status: 'success',
      data: {
        nft,
        winner,
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
  createGiveaway,
  participateInGiveaway,
  getActiveGiveaways,
  getGiveawayById,
  endGiveaway,
}; 