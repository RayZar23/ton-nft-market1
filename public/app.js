// Инициализация Telegram WebApp
let tgApp = null;
try {
    if (window.Telegram && window.Telegram.WebApp) {
        tgApp = window.Telegram.WebApp;
        // Расширяем приложение на весь экран
        tgApp.expand();
        // Устанавливаем тему в зависимости от темы Telegram
        document.body.classList.toggle('dark-theme', tgApp.colorScheme === 'dark');
    }
} catch (error) {
    console.log('Telegram Web App недоступен:', error);
}

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
    if (tgApp && tgApp.showAlert) {
        tgApp.showAlert(message);
    } else {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Функция для показа подтверждения
function showConfirmation(message, onConfirm, onCancel) {
    if (tgApp && tgApp.showConfirm) {
        tgApp.showConfirm(message, (confirmed) => {
            if (confirmed) {
                onConfirm && onConfirm();
            } else {
                onCancel && onCancel();
            }
        });
    } else {
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
}

// Функция для показа формы ввода
function showInputForm(title, message, onSubmit, onCancel) {
    if (tgApp && tgApp.showPopup) {
        tgApp.showPopup({
            title: title,
            message: message,
            buttons: [
                {id: 'cancel', type: 'cancel'},
                {id: 'confirm', type: 'default'}
            ]
        }, (buttonId) => {
            if (buttonId === 'confirm') {
                onSubmit && onSubmit();
            } else {
                onCancel && onCancel();
            }
        });
    } else {
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
    
    // Инициализация графика при переходе в кошелек
    if (sectionId === 'wallet-section') {
        initChart();
    }
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
    
    // Фильтрация элементов
    if (container.classList.contains('auction-categories')) {
        filterAuctions(button.textContent.trim());
    } else {
        filterMarket(button.textContent.trim());
    }
}

// Функция для переключения периода графика
function switchChartPeriod(button) {
    // Обновляем активную кнопку периода
    periodButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Обновляем данные графика в зависимости от выбранного периода
    const period = button.textContent.trim();
    updateChartData(period);
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
    
    // Добавляем/удаляем элемент из избранного
    const itemId = button.dataset.id;
    if (button.classList.contains('active')) {
        addToFavorites(itemId);
    } else {
        removeFromFavorites(itemId);
    }
}

// Функция для добавления в избранное
function addToFavorites(itemId) {
    // В реальном приложении здесь был бы запрос к API
    console.log(`Добавлено в избранное: ${itemId}`);
    showNotification('Добавлено в избранное!', 'success');
}

// Функция для удаления из избранного
function removeFromFavorites(itemId) {
    // В реальном приложении здесь был бы запрос к API
    console.log(`Удалено из избранного: ${itemId}`);
    showNotification('Удалено из избранного', 'info');
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
    
    showConfirmation(`Вы уверены, что хотите купить "${name}" за ${price}?`, () => {
        showNotification(`Поздравляем! Вы приобрели "${name}" за ${price}`, 'success');
    });
}

// Функция для ставки на аукционе
function placeBid(button) {
    const item = button.closest('.auction-item');
    if (!item) return;
    
    const name = item.querySelector('.auction-name').textContent;
    const currentBid = item.querySelector('.bid-amount').textContent;
    
    showInputForm('Сделать ставку', `Текущая ставка: ${currentBid}`, (value) => {
        showNotification(`Ваша ставка на "${name}" принята!`, 'success');
    });
}

// Данные для графика
let chartInstance = null;
let cryptoData = {
    '24h': {
        labels: generateTimeLabels(24, 'hour'),
        datasets: [{
            label: 'TON',
            data: generateRandomData(24, 2.5, 0.2),
            borderColor: '#0088CC',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            backgroundColor: 'rgba(0, 136, 204, 0.1)'
        }]
    },
    '7d': {
        labels: generateTimeLabels(7, 'day'),
        datasets: [{
            label: 'TON',
            data: generateRandomData(7, 2.5, 0.4),
            borderColor: '#0088CC',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            backgroundColor: 'rgba(0, 136, 204, 0.1)'
        }]
    },
    '1m': {
        labels: generateTimeLabels(30, 'day'),
        datasets: [{
            label: 'TON',
            data: generateRandomData(30, 2.5, 0.7),
            borderColor: '#0088CC',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            backgroundColor: 'rgba(0, 136, 204, 0.1)'
        }]
    },
    '3m': {
        labels: generateTimeLabels(12, 'week'),
        datasets: [{
            label: 'TON',
            data: generateRandomData(12, 2.5, 1),
            borderColor: '#0088CC',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            backgroundColor: 'rgba(0, 136, 204, 0.1)'
        }]
    },
    '1y': {
        labels: generateTimeLabels(12, 'month'),
        datasets: [{
            label: 'TON',
            data: generateRandomData(12, 2.5, 1.5),
            borderColor: '#0088CC',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            backgroundColor: 'rgba(0, 136, 204, 0.1)'
        }]
    }
};

// Функция для генерации временных меток
function generateTimeLabels(count, unit) {
    const labels = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
        let date = new Date(now);
        
        if (unit === 'hour') {
            date.setHours(now.getHours() - i);
            labels.push(date.getHours() + ':00');
        } else if (unit === 'day') {
            date.setDate(now.getDate() - i);
            labels.push(date.getDate() + '/' + (date.getMonth() + 1));
        } else if (unit === 'week') {
            date.setDate(now.getDate() - i * 7);
            labels.push(date.getDate() + '/' + (date.getMonth() + 1));
        } else if (unit === 'month') {
            date.setMonth(now.getMonth() - i);
            const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            labels.push(monthNames[date.getMonth()]);
        }
    }
    
    return labels;
}

// Функция для генерации случайных данных с трендом
function generateRandomData(count, baseValue, volatility) {
    let data = [];
    let value = baseValue;
    
    // Добавляем небольшой положительный тренд
    const trend = 0.02;
    
    for (let i = 0; i < count; i++) {
        // Случайное изменение с учетом волатильности
        const change = (Math.random() - 0.4) * volatility;
        
        // Применяем изменение и тренд
        value = Math.max(0.1, value + change + trend);
        data.push(value.toFixed(2));
    }
    
    return data;
}

// Функция для инициализации графика
function initChart() {
    const chartElement = document.getElementById('crypto-chart');
    if (!chartElement) return;
    
    // Если график уже инициализирован, уничтожаем его
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Создаем новый график с данными за 24 часа по умолчанию
    const ctx = chartElement.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: cryptoData['24h'],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--tg-theme-hint-color')
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--tg-theme-hint-color'),
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.body).getPropertyValue('--tg-theme-secondary-bg-color'),
                    titleColor: getComputedStyle(document.body).getPropertyValue('--tg-theme-text-color'),
                    bodyColor: getComputedStyle(document.body).getPropertyValue('--tg-theme-text-color'),
                    borderWidth: 1,
                    borderColor: 'rgba(200, 200, 200, 0.25)',
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'TON: $' + context.parsed.y;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// Функция для обновления данных графика
function updateChartData(period) {
    if (!chartInstance) return;
    
    // Обновляем данные и перерисовываем график
    chartInstance.data = cryptoData[period] || cryptoData['24h'];
    chartInstance.update();
    
    // Обновляем процентное изменение
    updatePriceChange(period);
}

// Функция для обновления процентного изменения цены
function updatePriceChange(period) {
    const priceChangeElement = document.querySelector('.price-change');
    if (!priceChangeElement) return;
    
    const data = cryptoData[period]?.datasets[0].data;
    if (!data || data.length < 2) return;
    
    const startPrice = parseFloat(data[0]);
    const endPrice = parseFloat(data[data.length - 1]);
    const change = ((endPrice - startPrice) / startPrice) * 100;
    
    priceChangeElement.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
    priceChangeElement.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative');
}

// Функция для фильтрации аукционов
function filterAuctions(category) {
    const items = document.querySelectorAll('.auction-item');
    
    items.forEach(item => {
        if (category === 'Все' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Функция для фильтрации маркета
function filterMarket(category) {
    const items = document.querySelectorAll('.market-item');
    
    items.forEach(item => {
        if (category === 'Все' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Добавляем обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация обработчиков для кнопок навигации
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;
            switchSection(sectionId);
        });
    });
    
    // Инициализация обработчиков для кнопок вкладок
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchAssetTab(tabId);
        });
    });
    
    // Инициализация обработчиков для кнопок категорий
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchCategory(button);
        });
    });
    
    // Инициализация обработчиков для кнопок избранного
    favoriteButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleFavorite(button);
        });
    });
    
    // Инициализация обработчиков для радио-кнопок типа продажи
    saleTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleSaleType);
    });
    
    // Инициализация обработчика для кнопки загрузки
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleFileUpload);
    }
    
    // Инициализация обработчика для поля загрузки файла
    if (fileInput) {
        fileInput.addEventListener('change', displaySelectedFile);
    }
    
    // Инициализация обработчика для кнопок периода
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchChartPeriod(button);
        });
    });
    
    // Инициализация графика при загрузке страницы, если активна секция кошелька
    if (document.getElementById('wallet-section').classList.contains('active')) {
        // Загружаем скрипт Chart.js динамически
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function() {
            initChart();
        };
        document.head.appendChild(script);
    }
});

// Функция для показа крипто-активов
function showCryptoAssets() {
    showNotification('Функция просмотра крипто-активов находится в разработке', 'info');
}

// Функция для пополнения кошелька
function depositFunds() {
    showInputForm('Пополнить кошелек', 'Введите сумму в TON:', (value) => {
        if (!value || isNaN(value) || parseFloat(value) <= 0) {
            showNotification('Пожалуйста, введите корректную сумму', 'error');
            return;
        }
        
        showNotification(`Запрос на пополнение на ${value} TON отправлен`, 'success');
    });
}

// Функция для вывода средств
function withdrawFunds() {
    showInputForm('Вывести средства', 'Введите сумму в TON:', (value) => {
        if (!value || isNaN(value) || parseFloat(value) <= 0) {
            showNotification('Пожалуйста, введите корректную сумму', 'error');
            return;
        }
        
        showNotification(`Запрос на вывод ${value} TON отправлен`, 'success');
    });
}

// Функция для создания NFT
function createNFT(form) {
    if (!form) return;
    
    const formData = new FormData(form);
    const name = formData.get('name');
    const description = formData.get('description');
    const price = formData.get('price');
    const saleType = formData.get('sale-type');
    
    if (!name || !price || price <= 0) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return false;
    }
    
    if (saleType === 'auction') {
        const startPrice = formData.get('start-price');
        const duration = formData.get('auction-duration');
        
        if (!startPrice || startPrice <= 0 || !duration) {
            showNotification('Пожалуйста, заполните все поля для аукциона', 'error');
            return false;
        }
    }
    
    showNotification(`NFT "${name}" успешно создан!`, 'success');
    
    // Возвращаемся на страницу кошелька
    setTimeout(() => {
        switchSection('wallet-section');
    }, 1000);
    
    return false;
} 