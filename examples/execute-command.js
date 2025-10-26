/**
 * Пример выполнения команд от имени пользователя через WebSocket API.
 */
const BlockMindBot = require('../src/index');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1, // Замените на ID вашего бота
    apiKey: 'bk_your_api_key_here' // Замените на ваш API ключ
});

async function main() {
    try {
        await bot.connect();
        console.log('✓ Подключено к боту');

        const isOnline = await bot.getStatus();
        if (!isOnline) {
            console.log('⚠️ Бот офлайн. Запустите его для выполнения команд.');
            return;
        }
        console.log('✓ Бот онлайн');

        // --- Пример 1: Выполнение команды от имени игрока 'Steve' ---
        const targetUser = 'Steve';
        console.log(`\n1. Выполняем команду "ping" от имени пользователя "${targetUser}"...`);
        try {
            // Первым параметром теперь ОБЯЗАТЕЛЬНО передается имя пользователя.
            // Все проверки прав и кулдаунов будут применяться к этому пользователю.
            const result1 = await bot.executeCommand(targetUser, 'ping');
            console.log('✓ Команда выполнена!');
            console.log(`   Результат: "${result1}"`); // Должно быть "Понг, Steve!"
        } catch (error) {
            console.error(`   ❌ Ошибка: ${error.message}`);
        }

        // --- Пример 2: Выполнение команды с аргументами от имени другого игрока ---
        const anotherUser = 'Alex';
        console.log(`\n2. Выполняем команду "ping" с аргументом от имени "${anotherUser}"...`);
        try {
            const result2 = await bot.executeCommand(anotherUser, 'ping', { target: 'Herobrine' });
            console.log('✓ Команда выполнена!');
            console.log(`   Результат: "${result2}"`); // Должно быть "Понг, Alex! Пингую игрока Herobrine."
        } catch (error) {
            console.error(`   ❌ Ошибка: ${error.message}`);
        }

        // --- Пример 3: Выполнение команды без прав ---
        const noPermsUser = 'Notch';
        console.log(`\n3. Попытка выполнить команду от имени "${noPermsUser}" (предполагается, что у него нет прав)`);
        try {
            await bot.executeCommand(noPermsUser, 'ping');
        } catch (error) {
            // Ожидаем ошибку прав
            console.log(`   ✓ Получена ожидаемая ошибка: "${error.message}"`);
        }


    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        console.log('\nОтключение...');
        bot.disconnect();
        process.exit(0);
    }
}

main();