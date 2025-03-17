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

// Функция для показа уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Функция для показа подтверждения
function showConfirmation(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <div class="modal-buttons">
                <button class="modal-btn cancel">Отмена</button>
                <button class="modal-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.confirm').addEventListener('click', () => {
        modal.remove();
        onConfirm && onConfirm();
    });
    
    modal.querySelector('.cancel').addEventListener('click', () => {
        modal.remove();
        onCancel && onCancel();
    });
}

// Функция для показа формы ввода
function showInputForm(title, message, onSubmit, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <input type="text" class="modal-input" placeholder="Введите значение">
            <div class="modal-buttons">
                <button class="modal-btn cancel">Отмена</button>
                <button class="modal-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.confirm').addEventListener('click', () => {
        const value = modal.querySelector('.modal-input').value;
        modal.remove();
        onSubmit && onSubmit(value);
    });
    
    modal.querySelector('.cancel').addEventListener('click', () => {
        modal.remove();
        onCancel && onCancel();
    });
}

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
    showConfirmation(`Вы уверены, что хотите купить "${name}" за ${price}?`, () => {
        // Здесь будет логика покупки
        showNotification(`Поздравляем! Вы приобрели "${name}" за ${price}`, 'success');
    });
}

// Функция для ставки на аукционе
function placeBid(button) {
    const item = button.closest('.auction-item');
    if (!item) return;
    
    const name = item.querySelector('.auction-name').textContent;
    const currentBid = item.querySelector('.bid-amount').textContent;
    
    // Показываем форму для ввода ставки
    showInputForm('Сделать ставку', `Текущая ставка: ${currentBid}`, (value) => {
        // Здесь будет логика размещения ставки
        showNotification(`Ваша ставка на "${name}" принята!`, 'success');
    });
}

// Функция для создания NFT
function createNFT() {
    const name = document.getElementById('nft-name').value;
    const description = document.getElementById('nft-description').value;
    const price = document.getElementById('nft-price').value;
    
    if (!name || !description || !price || !fileInput.files[0]) {
        showNotification('Пожалуйста, заполните все поля и загрузите изображение', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loading);
    
    // Имитируем процесс создания NFT
    setTimeout(() => {
        // Скрываем индикатор загрузки
        loading.remove();
        
        // Показываем успешное сообщение
        showNotification('NFT успешно создан!', 'success');
        
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

// Функция для показа криптовалютных активов
function showCryptoAssets() {
    showNotification('Функция показа криптовалютных активов в разработке', 'info');
}

// Функция для показа коллекции NFT
function showNFTCollection() {
    showNotification('Функция показа коллекции NFT в разработке', 'info');
}

// Функция для показа маркета
function showMarket() {
    switchSection('market-section');
}

// Функция для показа аукционов
function showAuctions() {
    switchSection('auction-section');
}

// Функция для показа создания NFT
function showCreateNFT() {
    switchSection('add-nft-section');
}

// Функция для показа истории транзакций
function showTransactionHistory() {
    showNotification('Функция показа истории транзакций в разработке', 'info');
}

// Функция для показа партнерской программы
function showReferralProgram() {
    showNotification('Функция показа партнерской программы в разработке', 'info');
}

// Функция для показа автоматизации
function showAutomation() {
    showNotification('Функция показа автоматизации в разработке', 'info');
}

// Функция для показа настроек
function showSettings() {
    switchSection('settings-section');
}

// Функция для показа опций пополнения
function showDepositOptions() {
    showNotification('Функция пополнения в разработке', 'info');
}

// Функция для показа опций вывода
function showWithdrawOptions() {
    showNotification('Функция вывода в разработке', 'info');
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
        btn.addEventListener('click', () => {
            toggleFavorite(btn);
        });
    });
    
    // Обработчики для переключателей типа продажи
    saleTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleSaleType);
    });
    
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
    
    // Обработчики для кнопки загрузки файла
    uploadBtn.addEventListener('click', handleFileUpload);
    
    // Обработчик для выбора файла
    fileInput.addEventListener('change', displaySelectedFile);
    
    // Обработчик для кнопки создания NFT
    document.querySelector('.create-nft-btn').addEventListener('click', createNFT);
    
    // Обработчики для меню активов
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action) {
                switch(action) {
                    case 'crypto':
                        showCryptoAssets();
                        break;
                    case 'nft':
                        showNFTCollection();
                        break;
                    case 'market':
                        showMarket();
                        break;
                    case 'auction':
                        showAuctions();
                        break;
                    case 'create':
                        showCreateNFT();
                        break;
                    case 'history':
                        showTransactionHistory();
                        break;
                    case 'referral':
                        showReferralProgram();
                        break;
                    case 'automation':
                        showAutomation();
                        break;
                    case 'settings':
                        showSettings();
                        break;
                    case 'deposit':
                        showDepositOptions();
                        break;
                    case 'withdraw':
                        showWithdrawOptions();
                        break;
                }
            }
        });
    });
}); 