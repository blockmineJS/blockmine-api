/**
 * Пример обработки офлайн бота
 */
const BlockMindBot = require('../src/index');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1, // Замените на ID вашего бота
    apiKey: 'bk_your_api_key_here' // Замените на ваш API ключ
});

async function main() {
    try {
        // Подключиться
        await bot.connect();
        console.log('✓ Подключено к боту');

        // Проверить статус
        const isOnline = await bot.getStatus();
        console.log(`✓ Статус бота: ${isOnline ? 'ОНЛАЙН' : 'ОФЛАЙН'}`);

        if (!isOnline) {
            console.log('⚠️ Бот офлайн. Некоторые действия будут недоступны.');
            console.log('Слушаем события, ждем когда бот включится...\n');
        }

        // Слушаем изменение статуса
        bot.onStatusChanged(async (online) => {
            console.log(`\n📊 Статус изменился: ${online ? 'ОНЛАЙН ✅' : 'ОФЛАЙН ❌'}`);

            if (online) {
                console.log('Бот теперь онлайн! Можно отправлять команды.');
                try {
                    await bot.sendMessage('Я снова в сети!');
                    console.log('✓ Сообщение отправлено');
                } catch (error) {
                    console.error('✗ Ошибка отправки сообщения:', error.message);
                }
            }
        });

        // Слушаем события чата
        bot.onChatMessage((data) => {
            console.log(`💬 [${data.type}] ${data.username}: ${data.message}`);
        });

        bot.onPlayerJoin(async (username) => {
            console.log(`[+] ${username} зашёл`);

            // Проверяем статус перед отправкой
            const online = await bot.getStatus();
            if (online) {
                try {
                    await bot.sendMessage(`Привет, ${username}!`);
                } catch (error) {
                    console.error('✗ Ошибка приветствия:', error.message);
                }
            }
        });

        bot.onPlayerLeave((username) => {
            console.log(`[-] ${username} вышел`);
        });

        // Только если бот онлайн - пробуем отправить сообщение
        if (isOnline) {
            try {
                await bot.sendMessage('Привет всем!');
                console.log('✓ Сообщение отправлено');
            } catch (error) {
                console.error('✗ Ошибка отправки сообщения:', error.message);
            }

            // Пробуем получить данные пользователя
            try {
                const user = await bot.getUser('Player123');
                console.log('✓ Группы пользователя:', user.groups);
            } catch (error) {
                console.error('✗ Ошибка получения пользователя:', error.message);
            }
        } else {
            console.log('⏸️ Пропускаем отправку команд (бот офлайн)');
        }

        console.log('\nБот запущен и слушает события...');
        console.log('Нажмите Ctrl+C для выхода\n');

    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
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
