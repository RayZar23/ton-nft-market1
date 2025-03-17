const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Получаем локальный IP-адрес
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Пропускаем внутренние и не IPv4 адреса
            if (iface.internal || iface.family !== 'IPv4') {
                continue;
            }
            return iface.address;
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();
console.log(`Обнаружен локальный IP-адрес: ${localIP}`);

// Создаем директорию для сертификатов, если она не существует
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

// Генерируем самоподписанный сертификат с альтернативными именами
const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'RU' },
    { name: 'organizationName', value: 'TON NFT Market' },
    { name: 'organizationalUnitName', value: 'Development' }
];

const options = {
    days: 365, // срок действия сертификата
    keySize: 2048, // размер ключа
    algorithm: 'sha256', // алгоритм подписи
    extensions: [
        {
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' }, // DNS name
                { type: 2, value: '*.localhost' }, // Wildcard
                { type: 7, ip: '127.0.0.1' }, // IP address
                { type: 7, ip: localIP } // Local network IP
            ]
        }
    ]
};

console.log('Генерация расширенного SSL-сертификата...');
const pems = selfsigned.generate(attrs, options);

// Сохраняем сертификат и ключ в файлы
fs.writeFileSync(path.join(sslDir, 'server.key'), pems.private);
fs.writeFileSync(path.join(sslDir, 'server.cert'), pems.cert);

console.log('Расширенный SSL-сертификат успешно создан в директории ssl/');
console.log('- server.key: приватный ключ');
console.log('- server.cert: сертификат');
console.log('\nСертификат содержит следующие альтернативные имена:');
console.log('- localhost');
console.log('- *.localhost');
console.log('- 127.0.0.1');
console.log(`- ${localIP}`);
console.log('\nДля тестирования в Telegram используйте URL:');
console.log(`https://${localIP}:8443/`); 