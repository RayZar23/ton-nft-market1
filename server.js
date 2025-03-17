const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Порт для HTTP-сервера
const PORT = process.env.PORT || 8080;

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

// Функция для обработки запросов
const handleRequest = (req, res) => {
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
                    if (err) {
                        // Если 404.html не найден, отправляем простой текст
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
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
};

// Проверяем, запущен ли код на Vercel
if (process.env.VERCEL) {
    // Экспортируем функцию для Vercel
    module.exports = (req, res) => {
        handleRequest(req, res);
    };
} else {
    // Создаем HTTP-сервер для локальной разработки
    const server = http.createServer(handleRequest);

    // Запускаем сервер на всех интерфейсах (0.0.0.0)
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`HTTP server running at http://localhost:${PORT}/`);
        console.log(`Также доступен по IP-адресу: http://<ваш-IP-адрес>:${PORT}/`);
        console.log('Press Ctrl+C to stop the server');
    });
} 