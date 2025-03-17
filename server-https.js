const https = require('https');
const fs = require('fs');
const path = require('path');

// Порт для HTTPS-сервера (8443 рекомендуется для Telegram WebApps)
const PORT = process.env.PORT || 8443;

// Проверяем наличие SSL-сертификатов
const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'server.key');
const certPath = path.join(sslDir, 'server.cert');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('SSL-сертификаты не найдены. Пожалуйста, сгенерируйте их с помощью команды:');
    console.error('npm run generate-cert');
    process.exit(1);
}

// Опции для HTTPS-сервера
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

// MIME-типы для различных расширений файлов
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// Создаем HTTPS-сервер
const server = https.createServer(options, (req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    // Добавляем заголовки CORS для разрешения запросов от Telegram
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Обрабатываем OPTIONS запросы для CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Обрабатываем корневой URL
    let filePath = req.url === '/' ? './index.html' : '.' + req.url;
    
    // Получаем расширение файла
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Читаем файл
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Файл не найден
                fs.readFile('./404.html', (err, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Ошибка сервера
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Успешно
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Запускаем сервер на всех интерфейсах (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure server running at https://localhost:${PORT}/`);
    console.log(`Также доступен по IP-адресу: https://<ваш-IP-адрес>:${PORT}/`);
    console.log('ВАЖНО: Так как сертификат самоподписанный, браузер может показать предупреждение о безопасности.');
    console.log('Вы можете безопасно продолжить и принять сертификат для локальной разработки.');
    console.log('Press Ctrl+C to stop the server');
}); 