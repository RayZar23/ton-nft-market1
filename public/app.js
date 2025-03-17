// Инициализация Telegram WebApp
const tgApp = window.Telegram.WebApp;

// Расширяем приложение на весь экран
tgApp.expand();

// Устанавливаем тему в зависимости от темы Telegram
document.body.classList.toggle('dark-theme', tgApp.colorScheme === 'dark');

// Получаем элементы DOM
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('.nav-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const assetLists = document.querySelectorAll('.assets-list');
const categoryButtons = document.querySelectorAll('.category-btn');
const favoriteButtons = document.querySelectorAll('.favorite-btn');
const saleTypeRadios = document.querySelectorAll('input[name="sale-type"]');
const auctionSettings = document.querySelector('.auction-settings');
const uploadBtn = document.querySelector('.upload-btn');
const fileInput = document.querySelector('#nft-upload');
const periodButtons = document.querySelectorAll('.period-btn');

// Функция для переключения секций
function switchSection(sectionId) {
    // Скрываем все секции
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Показываем выбранную секцию
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Обновляем активную кнопку навигации
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    // Прокручиваем страницу вверх
    window.scrollTo(0, 0);
}

// Функция для переключения вкладок активов
function switchAssetTab(tabId) {
    // Обновляем активную кнопку вкладки
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Показываем соответствующий список активов
    assetLists.forEach(list => {
        list.classList.toggle('active', list.classList.contains(`${tabId}-list`));
    });
}

// Функция для переключения категорий
function switchCategory(button) {
    // Находим родительский контейнер
    const container = button.closest('.auction-categories, .market-categories');
    if (!container) return;
    
    // Обновляем активную кнопку категории
    const categoryBtns = container.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Здесь можно добавить логику фильтрации элементов по категории
}

// Функция для переключения периода графика
function switchChartPeriod(button) {
    // Обновляем активную кнопку периода
    periodButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // В будущем здесь будет логика обновления данных графика
    console.log(`Выбран период: ${button.textContent.trim()}`);
}

// Функция для переключения избранного
function toggleFavorite(button) {
    button.classList.toggle('active');
    
    // Изменяем иконку
    const icon = button.querySelector('i');
    if (icon) {
        icon.classList.toggle('far');
        icon.classList.toggle('fas');
    }
    
    // Здесь можно добавить логику сохранения избранного
}

// Функция для переключения типа продажи
function toggleSaleType() {
    const isAuction = document.querySelector('input[name="sale-type"][value="auction"]').checked;
    
    if (isAuction) {
        auctionSettings.style.display = 'block';
    } else {
        auctionSettings.style.display = 'none';
    }
}

// Функция для обработки загрузки файла
function handleFileUpload() {
    fileInput.click();
}

// Функция для отображения выбранного файла
function displaySelectedFile() {
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const uploadArea = document.querySelector('.upload-area');
        
        // Создаем превью изображения
        const reader = new FileReader();
        reader.onload = function(e) {
            // Обновляем содержимое области загрузки
            uploadArea.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                <span style="margin-top: 10px;">${file.name}</span>
                <button class="upload-btn" style="margin-top: 10px;">Изменить</button>
            `;
            
            // Добавляем обработчик для кнопки изменения
            uploadArea.querySelector('.upload-btn').addEventListener('click', handleFileUpload);
        };
        reader.readAsDataURL(file);
    }
}

// Функция для покупки NFT
function buyNFT(button) {
    const item = button.closest('.market-item');
    if (!item) return;
    
    const name = item.querySelector('.market-name').textContent;
    const price = item.querySelector('.market-price').textContent;
    
    // Показываем подтверждение
    tgApp.showConfirm(`Вы уверены, что хотите купить "${name}" за ${price}?`, (confirmed) => {
        if (confirmed) {
            // Здесь будет логика покупки
            tgApp.showAlert(`Поздравляем! Вы приобрели "${name}" за ${price}`);
        }
    });
}

// Функция для ставки на аукционе
function placeBid(button) {
    const item = button.closest('.auction-item');
    if (!item) return;
    
    const name = item.querySelector('.auction-name').textContent;
    const currentBid = item.querySelector('.bid-amount').textContent;
    
    // Показываем попап для ввода ставки
    tgApp.showPopup({
        title: 'Сделать ставку',
        message: `Текущая ставка: ${currentBid}`,
        buttons: [
            {id: 'cancel', type: 'cancel', text: 'Отмена'},
            {id: 'bid', type: 'default', text: 'Сделать ставку'}
        ]
    }, (buttonId) => {
        if (buttonId === 'bid') {
            // Здесь будет логика размещения ставки
            tgApp.showAlert(`Ваша ставка на "${name}" принята!`);
        }
    });
}

// Функция для создания NFT
function createNFT() {
    const name = document.getElementById('nft-name').value;
    const description = document.getElementById('nft-description').value;
    const price = document.getElementById('nft-price').value;
    
    if (!name || !description || !price || !fileInput.files[0]) {
        tgApp.showAlert('Пожалуйста, заполните все поля и загрузите изображение');
        return;
    }
    
    // Показываем индикатор загрузки
    tgApp.showProgress();
    
    // Имитируем процесс создания NFT
    setTimeout(() => {
        // Скрываем индикатор загрузки
        tgApp.hideProgress();
        
        // Показываем успешное сообщение
        tgApp.showAlert('NFT успешно создан!');
        
        // Очищаем форму
        document.getElementById('nft-name').value = '';
        document.getElementById('nft-description').value = '';
        document.getElementById('nft-price').value = '';
        document.getElementById('nft-royalty').value = '';
        
        // Сбрасываем область загрузки
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Загрузите изображение</span>
            <span class="upload-hint">PNG, JPG, GIF (макс. 10MB)</span>
            <button class="upload-btn">Выбрать файл</button>
        `;
        uploadArea.querySelector('.upload-btn').addEventListener('click', handleFileUpload);
        
        // Переключаемся на вкладку кошелька
        switchSection('wallet-section');
    }, 2000);
}

// Добавляем обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Обработчики для кнопок навигации
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchSection(btn.dataset.section);
        });
    });
    
    // Обработчики для вкладок активов
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchAssetTab(btn.dataset.tab);
        });
    });
    
    // Обработчики для кнопок категорий
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchCategory(btn);
        });
    });
    
    // Обработчики для кнопок периода графика
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchChartPeriod(btn);
        });
    });
    
    // Обработчики для кнопок избранного
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFavorite(btn);
        });
    });
    
    // Обработчики для радио-кнопок типа продажи
    saleTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleSaleType);
    });
    
    // Обработчик для кнопки загрузки файла
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleFileUpload);
    }
    
    // Обработчик для изменения выбранного файла
    if (fileInput) {
        fileInput.addEventListener('change', displaySelectedFile);
    }
    
    // Обработчики для кнопок покупки
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            buyNFT(btn);
        });
    });
    
    // Обработчики для кнопок ставок
    document.querySelectorAll('.bid-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            placeBid(btn);
        });
    });
    
    // Обработчик для кнопки создания NFT
    const createNftBtn = document.querySelector('.create-nft-btn');
    if (createNftBtn) {
        createNftBtn.addEventListener('click', createNFT);
    }
    
    // Обработчики для кнопок пополнения и вывода
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.textContent.trim().includes('Пополнить') ? 'deposit' : 'withdraw';
            
            if (action === 'deposit') {
                tgApp.showPopup({
                    title: 'Пополнение кошелька',
                    message: 'Выберите способ пополнения:',
                    buttons: [
                        {id: 'ton', type: 'default', text: 'TON'},
                        {id: 'usdt', type: 'default', text: 'USDT'},
                        {id: 'rub', type: 'default', text: 'RUB'},
                        {id: 'cancel', type: 'cancel', text: 'Отмена'}
                    ]
                });
            } else {
                tgApp.showPopup({
                    title: 'Вывод средств',
                    message: 'Выберите валюту для вывода:',
                    buttons: [
                        {id: 'ton', type: 'default', text: 'TON'},
                        {id: 'usdt', type: 'default', text: 'USDT'},
                        {id: 'cancel', type: 'cancel', text: 'Отмена'}
                    ]
                });
            }
        });
    });
    
    // Настраиваем главную кнопку Telegram
    tgApp.MainButton.setParams({
        text: 'ОТКРЫТЬ КОШЕЛЁК',
        color: '#0088cc'
    });
    
    // Показываем главную кнопку при необходимости
    // tgApp.MainButton.show();
    
    // Обработчик для главной кнопки
    tgApp.MainButton.onClick(() => {
        switchSection('wallet-section');
    });
    
    // Инициализируем первую секцию
    switchSection('wallet-section');
    
    console.log('Telegram Mini App для криптовалютного и NFT-рынка инициализирован!');
});

// Обработчик для меню
document.addEventListener('DOMContentLoaded', () => {
    // Обработчики для пунктов меню
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const menuLabel = item.querySelector('.menu-label').textContent.trim();
            
            // Обрабатываем клик на пункт меню в зависимости от его названия
            switch (menuLabel) {
                case 'Криптовалюты':
                    showCryptoAssets();
                    break;
                case 'NFT-коллекция':
                    showNFTCollection();
                    break;
                case 'Маркет':
                    showMarket();
                    break;
                case 'Аукционы':
                    showAuctions();
                    break;
                case 'Создать NFT':
                    showCreateNFT();
                    break;
                case 'История транзакций':
                    showTransactionHistory();
                    break;
                case 'Партнёрская программа':
                    showReferralProgram();
                    break;
                case 'Автоматизация':
                    showAutomation();
                    break;
                case 'Настройки':
                    showSettings();
                    break;
                default:
                    // Для неизвестных пунктов меню показываем уведомление
                    tgApp.showAlert(`Функция "${menuLabel}" в разработке`);
            }
        });
    });
    
    // Обработчики для кнопок пополнения и вывода
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.textContent.trim().includes('Пополнить') ? 'deposit' : 'withdraw';
            
            if (action === 'deposit') {
                showDepositOptions();
            } else {
                showWithdrawOptions();
            }
        });
    });
    
    // Обработчики для социальных ссылок
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const platform = link.querySelector('i').className;
            
            if (platform.includes('telegram')) {
                tgApp.openTelegramLink('https://t.me/ton_nft_market');
            } else if (platform.includes('twitter')) {
                tgApp.openLink('https://twitter.com/ton_nft_market');
            } else if (platform.includes('discord')) {
                tgApp.openLink('https://discord.gg/ton_nft_market');
            }
        });
    });
    
    // Настраиваем главную кнопку Telegram
    tgApp.MainButton.setParams({
        text: 'ОТКРЫТЬ КОШЕЛЁК',
        color: '#0088cc'
    });
    
    // Обработчик для главной кнопки
    tgApp.MainButton.onClick(() => {
        tgApp.showAlert('Кошелёк уже открыт');
    });
    
    console.log('Telegram Mini App для криптовалютного и NFT-рынка инициализирован!');
});

// Функции для обработки пунктов меню

// Показать криптовалютные активы
function showCryptoAssets() {
    tgApp.showPopup({
        title: 'Криптовалютные активы',
        message: 'Ваши криптовалютные активы:\n\n• TON: 125.45 ($249.64)\n• USDT: 50.00 ($50.00)',
        buttons: [
            {id: 'deposit', type: 'default', text: 'Пополнить'},
            {id: 'withdraw', type: 'default', text: 'Вывести'},
            {id: 'close', type: 'cancel', text: 'Закрыть'}
        ]
    }, (buttonId) => {
        if (buttonId === 'deposit') {
            showDepositOptions();
        } else if (buttonId === 'withdraw') {
            showWithdrawOptions();
        }
    });
}

// Показать NFT-коллекцию
function showNFTCollection() {
    tgApp.showPopup({
        title: 'NFT-коллекция',
        message: 'У вас 12 NFT в коллекции',
        buttons: [
            {id: 'view', type: 'default', text: 'Просмотреть'},
            {id: 'close', type: 'cancel', text: 'Закрыть'}
        ]
    }, (buttonId) => {
        if (buttonId === 'view') {
            tgApp.showAlert('Функция просмотра NFT в разработке');
        }
    });
}

// Показать маркет
function showMarket() {
    switchSection('market-section');
}

// Показать аукционы
function showAuctions() {
    switchSection('auction-section');
}

// Показать создание NFT
function showCreateNFT() {
    switchSection('add-nft-section');
}

// Показать историю транзакций
function showTransactionHistory() {
    tgApp.showPopup({
        title: 'История транзакций',
        message: 'Последние транзакции:\n\n• Получено: +10.5 TON (15.03.2023)\n• Отправлено: -5.0 TON (12.03.2023)\n• Покупка NFT: -12.3 TON (10.03.2023)',
        buttons: [{type: 'close', text: 'Закрыть'}]
    });
}

// Показать партнёрскую программу
function showReferralProgram() {
    tgApp.showPopup({
        title: 'Партнёрская программа',
        message: 'Приглашайте друзей и получайте 10% от их комиссий!\n\nВаша реферальная ссылка:\nhttps://t.me/ton_nft_market_bot?start=ref123456',
        buttons: [
            {id: 'copy', type: 'default', text: 'Скопировать ссылку'},
            {id: 'share', type: 'default', text: 'Поделиться'},
            {id: 'close', type: 'cancel', text: 'Закрыть'}
        ]
    }, (buttonId) => {
        if (buttonId === 'copy') {
            tgApp.showAlert('Ссылка скопирована в буфер обмена');
        } else if (buttonId === 'share') {
            tgApp.showAlert('Функция "Поделиться" в разработке');
        }
    });
}

// Показать автоматизацию
function showAutomation() {
    tgApp.showAlert('Функции автоматизации в разработке');
}

// Показать настройки
function showSettings() {
    switchSection('settings-section');
}

// Показать опции пополнения
function showDepositOptions() {
    tgApp.showPopup({
        title: 'Пополнение кошелька',
        message: 'Выберите способ пополнения:',
        buttons: [
            {id: 'ton', type: 'default', text: 'TON'},
            {id: 'usdt', type: 'default', text: 'USDT'},
            {id: 'rub', type: 'default', text: 'RUB'},
            {id: 'cancel', type: 'cancel', text: 'Отмена'}
        ]
    }, (buttonId) => {
        if (buttonId !== 'cancel') {
            tgApp.showAlert(`Пополнение ${buttonId.toUpperCase()} в разработке`);
        }
    });
}

// Показать опции вывода
function showWithdrawOptions() {
    tgApp.showPopup({
        title: 'Вывод средств',
        message: 'Выберите валюту для вывода:',
        buttons: [
            {id: 'ton', type: 'default', text: 'TON'},
            {id: 'usdt', type: 'default', text: 'USDT'},
            {id: 'cancel', type: 'cancel', text: 'Отмена'}
        ]
    }, (buttonId) => {
        if (buttonId !== 'cancel') {
            tgApp.showAlert(`Вывод ${buttonId.toUpperCase()} в разработке`);
        }
    });
} 