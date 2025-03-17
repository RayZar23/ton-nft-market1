const fs = require('fs');
const path = require('path');

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

exports.handler = async function(event, context) {
  // Получаем путь к файлу из URL
  let filePath = event.path;
  
  // Удаляем префикс /.netlify/functions/api
  filePath = filePath.replace('/.netlify/functions/api', '');
  
  // Если путь пустой или корневой, используем index.html
  if (filePath === '' || filePath === '/') {
    filePath = '/index.html';
  }
  
  // Полный путь к файлу относительно корня проекта
  const fullPath = path.join(__dirname, '../..', filePath);
  
  try {
    // Получаем расширение файла
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Читаем файл
    const fileContent = fs.readFileSync(fullPath);
    
    // Возвращаем содержимое файла
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: fileContent.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.log('Error:', error);
    
    // Если файл не найден, пытаемся вернуть 404.html
    if (error.code === 'ENOENT') {
      try {
        const notFoundPath = path.join(__dirname, '../..', '/404.html');
        const notFoundContent = fs.readFileSync(notFoundPath);
        
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
          },
          body: notFoundContent.toString('base64'),
          isBase64Encoded: true
        };
      } catch (notFoundError) {
        // Если 404.html не найден, возвращаем простой текст
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          },
          body: '404 Not Found'
        };
      }
    }
    
    // Другие ошибки
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: `Server Error: ${error.code}`
    };
  }
}; 