/**
 * Базовый пример использования BlockMind Bot API
 */
const BlockMindBot = require('../src/index');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1, // Замените на ID вашего бота
    apiKey: 'bk_your_api_key_here' // Замените на ваш API ключ
});

async function main() {
    try {
        // Подключаемся к боту
        await bot.connect();
        console.log('✓ Подключено к боту');

        // Проверяем статус
        const isOnline = await bot.getStatus();
        console.log(`✓ Бот ${isOnline ? 'онлайн' : 'офлайн'}`);

        // Подписываемся на события
        bot.onChatMessage((data) => {
            console.log(`[ЧАТ] [${data.type}] ${data.username}: ${data.message}`);
        });

        bot.onPlayerJoin((username) => {
            console.log(`[+] ${username} зашёл на сервер`);
        });

        bot.onPlayerLeave((username) => {
            console.log(`[-] ${username} вышел с сервера`);
        });

        bot.onHealthUpdate((data) => {
            console.log(`❤️ Здоровье: ${data.health}, 🍖 Еда: ${data.food}`);
        });

        bot.onDeath(() => {
            console.log('💀 Бот умер!');
        });

        bot.onStatusChanged((isOnline) => {
            console.log(`Статус изменился: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        });

        console.log('\nБот запущен и слушает события...');
        console.log('Нажмите Ctrl+C для выхода\n');

    } catch (error) {
        console.error('Ошибка:', error.message);
        bot.disconnect();
        process.exit(1);
    }
}

// Обработка выхода
process.on('SIGINT', () => {
    console.log('\n\nОтключение...');
    bot.disconnect();
    process.exit(0);
});

main();
