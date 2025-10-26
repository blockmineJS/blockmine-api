/**
 * Пример чат-бота с автоответчиком на команды
 */
const BlockMindBot = require('../src/index');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

// Статистика
const stats = {
    messagesReceived: 0,
    commandsProcessed: 0,
    playersJoined: 0,
};

async function main() {
    try {
        await bot.connect();
        console.log('✓ Чат-бот подключен и готов к работе!\n');

        // Обработка команд в чате
        bot.onChatMessage(async (data) => {
            stats.messagesReceived++;
            const message = data.message;
            const username = data.username;

            console.log(`[ЧАТ] ${username}: ${message}`);

            // Команды
            if (message.startsWith('!')) {
                stats.commandsProcessed++;
                await handleCommand(message, username);
            }
        });

        // Приветствие новых игроков
        bot.onPlayerJoin(async (username) => {
            stats.playersJoined++;
            console.log(`[+] ${username} зашёл на сервер`);

            await bot.sendMessage(
                `Привет, ${username}! 👋 Добро пожаловать на сервер!`
            );

            // Подсказка про команды
            setTimeout(async () => {
                await bot.sendMessage(
                    `${username}, используй !help для списка команд`,
                    'private',
                    username
                );
            }, 2000);
        });

        bot.onPlayerLeave((username) => {
            console.log(`[-] ${username} покинул сервер`);
        });

        // Мониторинг здоровья
        bot.onHealthUpdate((data) => {
            if (data.health < 5) {
                console.log('⚠️ Критическое здоровье!');
            }
        });

        bot.onDeath(async () => {
            await bot.sendMessage('Упс... Я умер 💀');
        });

        console.log('Доступные команды для игроков:');
        console.log('  !help - Помощь');
        console.log('  !status - Статус бота');
        console.log('  !rules - Правила сервера');
        console.log('  !time - Текущее время');
        console.log('  !stats - Статистика бота');
        console.log('  !ping - Понг!\n');

    } catch (error) {
        console.error('Ошибка:', error.message);
        bot.disconnect();
        process.exit(1);
    }
}

async function handleCommand(message, username) {
    const command = message.toLowerCase().split(' ')[0];

    try {
        switch (command) {
            case '!help':
                await bot.sendMessage(
                    'Доступные команды: !help, !status, !rules, !time, !stats, !ping'
                );
                break;

            case '!status':
                const isOnline = await bot.getStatus();
                await bot.sendMessage(
                    `Бот ${isOnline ? 'онлайн ✅' : 'офлайн ❌'}`
                );
                break;

            case '!rules':
                await bot.sendMessage('Правила сервера:');
                await bot.sendMessage('1. Не гриферить');
                await bot.sendMessage('2. Уважать других игроков');
                await bot.sendMessage('3. Не использовать читы');
                break;

            case '!time':
                const now = new Date();
                await bot.sendMessage(
                    `Текущее время: ${now.toLocaleTimeString('ru-RU')}`
                );
                break;

            case '!stats':
                await bot.sendMessage(
                    `📊 Статистика: Сообщений: ${stats.messagesReceived}, ` +
                    `Команд: ${stats.commandsProcessed}, ` +
                    `Игроков зашло: ${stats.playersJoined}`
                );
                break;

            case '!ping':
                await bot.sendMessage(`Понг! 🏓`);
                break;

            case '!user':
                // Пример работы с API пользователей
                try {
                    const user = await bot.getUser(username);
                    await bot.sendMessage(
                        `${username}: Группы: [${user.groups.join(', ') || 'нет'}], ` +
                        `Права: ${user.permissions.length}`,
                        'private',
                        username
                    );
                } catch (error) {
                    await bot.sendMessage(
                        'Не удалось получить данные пользователя',
                        'private',
                        username
                    );
                }
                break;

            default:
                await bot.sendMessage(
                    `Неизвестная команда. Используй !help для списка команд`,
                    'private',
                    username
                );
        }

        console.log(`  → Обработана команда ${command} от ${username}`);

    } catch (error) {
        console.error(`Ошибка обработки команды ${command}:`, error.message);
        await bot.sendMessage(
            `Ошибка выполнения команды: ${error.message}`,
            'private',
            username
        );
    }
}

process.on('SIGINT', () => {
    console.log('\n\n📊 Финальная статистика:');
    console.log(`  Сообщений обработано: ${stats.messagesReceived}`);
    console.log(`  Команд выполнено: ${stats.commandsProcessed}`);
    console.log(`  Игроков зашло: ${stats.playersJoined}`);
    console.log('\nОтключение...');
    bot.disconnect();
    process.exit(0);
});

main();
