/**
 * Пример работы с сырыми сообщениями от Minecraft
 * Показывает как получить доступ к полному JSON объекту сообщений
 */
const BlockMindBot = require('../src/index');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

async function main() {
    try {
        await bot.connect();
        console.log('✓ Подключено к боту\n');

        // Обработка сырых сообщений с полным JSON
        bot.onRawMessage((data) => {
            console.log('─'.repeat(60));
            console.log('📨 Новое сырое сообщение:');
            console.log('Текст:', data.raw_message);
            console.log('\nJSON объект:');
            console.log(JSON.stringify(data.json, null, 2));

            // Доступ к дополнительным данным
            if (data.json.extra) {
                console.log('\n🎨 Форматированные части:');
                data.json.extra.forEach((part, index) => {
                    console.log(`  ${index + 1}. "${part.text}"`);
                    if (part.color) console.log(`     Цвет: ${part.color}`);
                    if (part.bold) console.log(`     Жирный: да`);
                    if (part.italic) console.log(`     Курсив: да`);
                    if (part.clickEvent) {
                        console.log(`     Клик: ${part.clickEvent.action} -> ${part.clickEvent.value}`);
                    }
                    if (part.hoverEvent) {
                        console.log(`     Hover: ${part.hoverEvent.action}`);
                    }
                });
            }

            // Проверка на специальные типы сообщений
            if (data.json.translate) {
                console.log(`\n🌐 Тип перевода: ${data.json.translate}`);
                if (data.json.with) {
                    console.log(`📝 Параметры:`, data.json.with);
                }
            }

            console.log('─'.repeat(60) + '\n');
        });

        // Фильтрация сообщений по типу
        bot.onRawMessage((data) => {
            const json = data.json;

            // Сообщения о смерти
            if (json.translate && json.translate.startsWith('death.')) {
                console.log('💀 [СМЕРТЬ]', data.raw_message);
            }

            // Сообщения о достижениях
            if (json.translate && json.translate.includes('advancement')) {
                console.log('🏆 [ДОСТИЖЕНИЕ]', data.raw_message);
            }

            // Системные сообщения
            if (json.translate && json.translate.startsWith('chat.type.')) {
                console.log('📢 [СИСТЕМА]', data.raw_message);
            }
        });

        // Обычные сообщения чата (обработанные)
        bot.onChatMessage((data) => {
            console.log(`💬 [${data.type}] ${data.username}: ${data.message}`);
        });

        console.log('Слушаем сырые сообщения...');
        console.log('Нажмите Ctrl+C для выхода\n');

    } catch (error) {
        console.error('Ошибка:', error.message);
        bot.disconnect();
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n\nОтключение...');
    bot.disconnect();
    process.exit(0);
});

main();
