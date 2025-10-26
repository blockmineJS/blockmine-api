
const BlockMindBot = require('../src/index');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

async function main() {
    try {
        // Подключиться
        await bot.connect();
        console.log('✓ Подключено к боту\n');

        // Проверить статус
        const isOnline = await bot.getStatus();
        if (!isOnline) {
            console.log('⚠️ Бот офлайн. Включите бота для тестирования.');
            return;
        }

        console.log('Примеры вызова графов с получением ответа:\n');

        // Пример 1: Простой вызов
        console.log('1. Вызов графа "calculate"...');
        try {
            const result = await bot.callGraph('calculate', {
                operation: 'add',
                a: 10,
                b: 20
            });
            console.log('   Результат:', result);
        } catch (error) {
            console.error('   Ошибка:', error.message);
        }


    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        bot.disconnect();
        process.exit(0);
    }
}

main();
