const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Создаем директорию для сертификатов, если она не существует
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

// Генерируем самоподписанный сертификат
const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'RU' },
    { name: 'organizationName', value: 'TON NFT Market' },
    { name: 'organizationalUnitName', value: 'Development' }
];

const options = {
    days: 365, // срок действия сертификата
    keySize: 2048, // размер ключа
    algorithm: 'sha256' // алгоритм подписи
};

console.log('Генерация SSL-сертификата...');
const pems = selfsigned.generate(attrs, options);

// Сохраняем сертификат и ключ в файлы
fs.writeFileSync(path.join(sslDir, 'server.key'), pems.private);
fs.writeFileSync(path.join(sslDir, 'server.cert'), pems.cert);

console.log('SSL-сертификат успешно создан в директории ssl/');
console.log('- server.key: приватный ключ');
console.log('- server.cert: сертификат'); 