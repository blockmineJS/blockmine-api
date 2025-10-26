# BlockMine Bot API

> ⚠️ **АХТУНГ**: ДОКУМЕНТАЦИЯ СГЕНЕРИРОВАНА CLAUDE.

Высокоуровневый SDK для работы с BlockMine Bot WebSocket API.

## Установка

```bash
npm install blockmine-api
```

## Примеры

Смотрите папку `examples/` для полных примеров использования:

- **basic.js** - Базовое подключение и события
- **raw-messages.js** - Работа с сырыми сообщениями и JSON
- **chatbot.js** - Чат-бот с командами и автоответчиком

Запуск примеров:
```bash
npm run example:basic
npm run example:raw
npm run example:chatbot
```

## Быстрый старт

```javascript
const BlockMindBot = require('blockmine-api');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

async function main() {
    // Подключиться к боту
    await bot.connect();
    console.log('Подключено!');

    // Слушать сообщения в чате
    bot.onChatMessage((data) => {
        console.log(`[${data.type}] ${data.username}: ${data.message}`);
    });

    // Слушать сырые сообщения (весь JSON от Minecraft)
    bot.onRawMessage((data) => {
        console.log('Сырое сообщение:', data.raw_message);
        console.log('JSON:', data.json);
    });

    // Отправить сообщение
    await bot.sendMessage('Привет из API!');
}

main().catch(console.error);
```

## API Reference

### Конструктор

```javascript
const bot = new BlockMindBot(options)
```

**Параметры:**
- `options.url` (string) - URL сервера BlockMind (обязательно)
- `options.botId` (number) - ID бота (обязательно)
- `options.apiKey` (string) - API ключ (обязательно)

### Методы подключения

#### `connect()`

Подключиться к боту.

```javascript
await bot.connect();
```

**Возвращает:** Promise<void>

**События:**
- `connected` - Успешное подключение
- `error` - Ошибка подключения
- `disconnected` - Отключение

#### `disconnect()`

Отключиться от бота.

```javascript
bot.disconnect();
```

### Методы для работы с ботом

#### `getStatus()`

Получить текущий статус бота (онлайн/офлайн).

```javascript
const isOnline = await bot.getStatus();
console.log(isOnline ? 'Бот онлайн' : 'Бот офлайн');
```

**Возвращает:** Promise<boolean>

#### `sendMessage(message, chatType, recipient)`

Отправить сообщение в чат от имени бота.

```javascript
// Обычное сообщение в чат
await bot.sendMessage('Привет всем!');

// Сообщение в клан
await bot.sendMessage('Привет клан!', 'clan');

// Приватное сообщение
await bot.sendMessage('Привет!', 'private', 'Player123');

// Команда
await bot.sendMessage('/home', 'command');
```

**Параметры:**
- `message` (string) - Текст сообщения
- `chatType` (string) - Тип чата: 'chat', 'clan', 'private', 'command' (по умолчанию: 'chat')
- `recipient` (string) - Получатель (только для 'private')

**Возвращает:** Promise<object>

#### `callGraph(graphName, data)`

Вызвать граф и получить ответ от него.

```javascript
const result = await bot.callGraph('calculate', {
    operation: 'add',
    a: 10,
    b: 20
});
console.log('Результат:', result);
```

**Параметры:**
- `graphName` (string) - Название графа
- `data` (object) - Данные для графа (по умолчанию: {})

**Возвращает:** Promise<any> - Данные, которые граф отправил через ноду "Отправить ответ в WebSocket"

**Примечания:**
- Граф должен иметь триггер "Вызов из WebSocket API"
- В графе доступна нода "Отправить ответ в WebSocket" для отправки данных обратно
- Таймаут: 30 секунд

#### `triggerGraph(graphName, context)`

Запустить визуальный граф (без ожидания ответа).

```javascript
await bot.triggerGraph('welcome_player', {
    playerName: 'Steve'
});
```

**Параметры:**
- `graphName` (string) - Название графа
- `context` (object) - Контекст для графа (по умолчанию: {})

**Возвращает:** Promise<object>

#### `executeCommand(username, command, args)`

Выполнить команду бота от имени пользователя. Команда будет выполнена с полной проверкой прав, кулдаунов и черного списка для указанного пользователя.

```javascript
// Выполнить команду 'ping' от имени пользователя 'Steve'
const result = await bot.executeCommand('Steve', 'ping');
console.log('Результат:', result); // "Понг, Steve!"

// Выполнить команду с аргументами
const result2 = await bot.executeCommand('Steve', 'ping', { target: 'Alex' });
console.log('Результат:', result2); // "Понг, Steve! Пингую игрока Alex."

// Выполнить команду 'dev'
const info = await bot.executeCommand('Steve', 'dev');
console.log('Информация:', info); // "Бот создан с помощью - BlockMine. Версия: v1.21.0..."
```

**Параметры:**
- `username` (string) - Имя пользователя, от имени которого выполняется команда (обязательно)
- `command` (string) - Название команды
- `args` (object) - Объект с аргументами команды (по умолчанию: {})

**Возвращает:** Promise<any> - Результат выполнения команды

**Примечания:**
- Команда выполняется с проверкой всех прав пользователя (permissions, cooldowns, blacklist)
- Если у пользователя нет прав, будет выброшена ошибка
- Команды выполняются через универсальную систему валидации, такую же как для игровых команд
- Это позволяет использовать одну и ту же логику для Minecraft, WebSocket, Telegram и других источников

**Обработка ошибок:**
```javascript
try {
    const result = await bot.executeCommand('Player123', 'admin_command');
    console.log('Успех:', result);
} catch (error) {
    if (error.message.includes('insufficient permissions')) {
        console.error('У пользователя нет прав');
    } else if (error.message.includes('cooldown')) {
        console.error('Команда на кулдауне');
    } else if (error.message.includes('blacklisted')) {
        console.error('Пользователь в черном списке');
    } else if (error.message.includes('not found')) {
        console.error('Команда не найдена или отключена');
    } else {
        console.error('Ошибка:', error.message);
    }
}
```

### Методы для работы с пользователями

#### `getUser(username)`

Получить данные о пользователе.

```javascript
const user = await bot.getUser('Player123');
console.log(user);
// {
//   username: 'Player123',
//   isBlacklisted: false,
//   groups: ['vip', 'moderator'],
//   permissions: ['ban', 'kick']
// }
```

**Параметры:**
- `username` (string) - Имя пользователя

**Возвращает:** Promise<object>

#### `addUserToGroup(username, groupName)`

Добавить пользователя в группу.

```javascript
await bot.addUserToGroup('Player123', 'vip');
```

**Параметры:**
- `username` (string) - Имя пользователя
- `groupName` (string) - Название группы

**Возвращает:** Promise<object>

#### `removeUserFromGroup(username, groupName)`

Удалить пользователя из группы.

```javascript
await bot.removeUserFromGroup('Player123', 'vip');
```

**Параметры:**
- `username` (string) - Имя пользователя
- `groupName` (string) - Название группы

**Возвращает:** Promise<object>

#### `setUserBlacklist(username, value)`

Установить/снять blacklist для пользователя.

```javascript
// Добавить в blacklist
await bot.setUserBlacklist('Griefer123', true);

// Убрать из blacklist
await bot.setUserBlacklist('Griefer123', false);
```

**Параметры:**
- `username` (string) - Имя пользователя
- `value` (boolean) - true для добавления в blacklist, false для удаления

**Возвращает:** Promise<object>

### События

#### `onChatMessage(callback)`

Слушать сообщения в чате.

```javascript
bot.onChatMessage((data) => {
    console.log(`[${data.type}] ${data.username}: ${data.message}`);
});
```

**Callback параметры:**
- `data.type` (string) - Тип чата
- `data.username` (string) - Имя отправителя
- `data.message` (string) - Текст сообщения (обработанный)
- `data.raw_message` (string) - Сырое сообщение без обработки

#### `onPlayerJoin(callback)`

Слушать события входа игроков.

```javascript
bot.onPlayerJoin((username) => {
    console.log(`${username} зашёл на сервер`);
});
```

**Callback параметры:**
- `username` (string) - Имя игрока

#### `onPlayerLeave(callback)`

Слушать события выхода игроков.

```javascript
bot.onPlayerLeave((username) => {
    console.log(`${username} вышел с сервера`);
});
```

**Callback параметры:**
- `username` (string) - Имя игрока

#### `onStatusChanged(callback)`

Слушать изменения статуса бота (онлайн/офлайн).

```javascript
bot.onStatusChanged((isOnline) => {
    console.log(isOnline ? 'Бот онлайн' : 'Бот офлайн');
});
```

**Callback параметры:**
- `isOnline` (boolean) - Статус бота

#### `onHealthUpdate(callback)`

Слушать обновления здоровья бота.

```javascript
bot.onHealthUpdate((data) => {
    console.log(`Здоровье: ${data.health}, Еда: ${data.food}`);
});
```

**Callback параметры:**
- `data.health` (number) - Здоровье
- `data.food` (number) - Сытость

#### `onDeath(callback)`

Слушать событие смерти бота.

```javascript
bot.onDeath(() => {
    console.log('Бот умер!');
});
```

#### `onRawMessage(callback)`

Слушать сырые сообщения чата (все сообщения без фильтрации).

```javascript
bot.onRawMessage((data) => {
    console.log('Сырое сообщение:', data.raw_message);
    console.log('JSON объект:', data.json);
});
```

**Callback параметры:**
- `data.raw_message` (string) - Сырое сообщение из чата (текст)
- `data.json` (object) - Полный JSON объект сообщения от Minecraft

#### `onCustomEvent(callback)`

Слушать кастомные события от плагинов.

```javascript
bot.onCustomEvent((data) => {
    console.log('Кастомное событие:', data);
});
```

**Callback параметры:**
- `data` (object) - Данные события

#### `onBotMessage(callback)`

Слушать сообщения от бота, отправленные через `bot.sendMessage('websocket', ...)`.

```javascript
bot.onBotMessage((message) => {
    console.log('Сообщение от бота:', message);
});
```

**Callback параметры:**
- `message` (string) - Текст сообщения

## Полный пример

```javascript
const BlockMindBot = require('blockmine-api');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

async function main() {
    try {
        // Подключаемся
        await bot.connect();
        console.log('✓ Подключено к боту');

        // Проверяем статус
        const isOnline = await bot.getStatus();
        console.log(`✓ Бот ${isOnline ? 'онлайн' : 'офлайн'}`);

        // Подписываемся на события
        bot.onChatMessage((data) => {
            console.log(`[ЧАТ] ${data.username}: ${data.message}`);

            // Автоответчик
            if (data.message.includes('!помощь')) {
                bot.sendMessage('Доступные команды: !помощь, !статус');
            }
        });

        bot.onPlayerJoin(async (username) => {
            console.log(`[+] ${username} зашёл`);

            // Приветствуем нового игрока
            await bot.sendMessage(`Привет, ${username}!`);

            // Запускаем граф приветствия
            await bot.triggerGraph('welcome_player', { username });
        });

        bot.onPlayerLeave((username) => {
            console.log(`[-] ${username} вышел`);
        });

        bot.onHealthUpdate((data) => {
            if (data.health < 5) {
                console.log('⚠️ Критически низкое здоровье!');
            }
        });

        bot.onDeath(async () => {
            console.log('💀 Бот умер!');
            await bot.sendMessage('Упс...');
        });

        // Управление пользователями
        const user = await bot.getUser('Steve');
        console.log('Данные пользователя:', user);

        if (!user.groups.includes('member')) {
            await bot.addUserToGroup('Steve', 'member');
            console.log('✓ Добавлен в группу member');
        }

        console.log('Бот запущен и слушает события...');
    } catch (error) {
        console.error('Ошибка:', error.message);
        bot.disconnect();
    }
}

// Обработка выхода
process.on('SIGINT', () => {
    console.log('\nОтключение...');
    bot.disconnect();
    process.exit(0);
});

main();
```

## Обработка ошибок

Все методы возвращают Promise, поэтому используйте try/catch:

```javascript
try {
    await bot.sendMessage('Тест');
} catch (error) {
    if (error.message === 'Bot is offline') {
        console.log('Бот офлайн, ожидаем...');
    } else if (error.message === 'Insufficient permissions: Read-only key') {
        console.log('Недостаточно прав');
    } else {
        console.error('Ошибка:', error.message);
    }
}
```

## Права доступа

API ключи могут иметь разные уровни доступа:

- **Read** - Только чтение событий
- **Write** - Только отправка команд
- **ReadWrite** - Полный доступ

При использовании Read-only ключа методы `sendMessage`, `triggerGraph`, `addUserToGroup`, `removeUserFromGroup` и `setUserBlacklist` вернут ошибку.

## Практические примеры

### Работа с графами через WebSocket API

Вы можете вызывать визуальные графы из внешних приложений и получать от них ответы. Это позволяет создавать мощные интеграции между вашим ботом и другими системами.

#### Шаг 1: Создание графа в интерфейсе

1. Откройте раздел "Графы событий" в интерфейсе BlockMind
2. Создайте новый граф
3. В качестве триггера выберите **"📡 Вызов из WebSocket API"**
4. Постройте логику графа
5. В конце добавьте ноду **"📤 Отправить ответ в WebSocket"** для отправки данных обратно

#### Шаг 2: Использование в коде

```javascript
const BlockMindBot = require('blockmine-api');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

async function main() {
    await bot.connect();

    // Вызов графа с данными
    try {
        const result = await bot.callGraph('calculate', {
            operation: 'add',
            a: 10,
            b: 20
        });

        console.log('Результат:', result); // { result: 30 }
    } catch (error) {
        console.error('Ошибка вызова графа:', error.message);
    }
}

main();
```

#### Пример графа: Калькулятор

**Триггер:** 📡 Вызов из WebSocket API

**Логика графа:**
1. Получить данные из триггера (data.operation, data.a, data.b)
2. Выполнить операцию через ноду "🔢 Математика"
3. Отправить результат через "📤 Отправить ответ в WebSocket"

**Пример использования:**
```javascript
// Сложение
const sum = await bot.callGraph('calculate', {
    operation: 'add',
    a: 5,
    b: 3
});
console.log(sum); // { result: 8 }

// Умножение
const product = await bot.callGraph('calculate', {
    operation: 'multiply',
    a: 5,
    b: 3
});
console.log(product); // { result: 15 }
```

#### Пример графа: Получение информации о сервере

**Триггер:** 📡 Вызов из WebSocket API

**Логика графа:**
1. Получить список игроков (нода "👥 Список игроков")
2. Получить позицию бота (нода "🤖 Позиция бота")
3. Собрать объект с данными (нода "🏗️ Собрать объект")
4. Отправить ответ

**Пример использования:**
```javascript
const serverInfo = await bot.callGraph('server_info', {});
console.log(serverInfo);
// {
//   players: ['Player1', 'Player2', 'Player3'],
//   botPosition: { x: 100, y: 64, z: 200 },
//   timestamp: '2024-01-15T10:30:00Z'
// }
```

#### Пример графа: Проверка прав пользователя

**Триггер:** 📡 Вызов из WebSocket API

**Логика:**
1. Получить username из data
2. Получить данные пользователя через БД
3. Проверить группы и права
4. Отправить результат

**Пример использования:**
```javascript
const hasAccess = await bot.callGraph('check_permission', {
    username: 'Player123',
    permission: 'build'
});

console.log(hasAccess);
// {
//   allowed: true,
//   groups: ['vip', 'builder'],
//   reason: 'User has builder group'
// }
```

#### Обработка ошибок

```javascript
try {
    const result = await bot.callGraph('my_graph', { data: 'test' });
    console.log('Успех:', result);
} catch (error) {
    if (error.message === 'Timeout') {
        console.error('Граф не ответил в течение 30 секунд');
    } else if (error.message.includes('Graph not found')) {
        console.error('Граф не найден или не имеет триггер "Вызов из WebSocket API"');
    } else if (error.message === 'Bot is offline') {
        console.error('Бот офлайн');
    } else {
        console.error('Ошибка:', error.message);
    }
}
```

#### Доступные данные в графе

Когда граф запускается через `callGraph()`, в контексте графа доступны следующие переменные:

- **graphName** (String) - Имя графа, который был вызван
- **data** (Object) - Данные, переданные при вызове
- **socketId** (String) - ID WebSocket соединения
- **keyPrefix** (String) - Префикс API ключа (первые символы)

Эти данные можно получить из выходов триггера "📡 Вызов из WebSocket API".

#### Отличие от triggerGraph()

- **callGraph()** - Ждёт ответа от графа (до 30 секунд), возвращает данные
- **triggerGraph()** - Просто запускает граф и сразу возвращается, не ждёт результата

Используйте `callGraph()` когда нужен результат работы графа, и `triggerGraph()` для простого запуска действий.

### Работа с сырыми сообщениями

Сырые сообщения содержат полный JSON от Minecraft сервера, включая цвета, форматирование и дополнительные данные.

```javascript
const BlockMindBot = require('blockmine-api');

const bot = new BlockMindBot({
    url: 'http://localhost:3001',
    botId: 1,
    apiKey: 'bk_your_api_key_here'
});

async function main() {
    await bot.connect();

    // Обработка сырых сообщений
    bot.onRawMessage((data) => {
        // Текстовая версия
        console.log('Текст:', data.raw_message);

        // Полный JSON объект
        const json = data.json;

        // Доступ к дополнительным данным
        if (json.extra) {
            // Обработка форматированного текста
            json.extra.forEach(part => {
                console.log('Часть сообщения:', part.text);
                if (part.color) console.log('Цвет:', part.color);
                if (part.clickEvent) console.log('Клик событие:', part.clickEvent);
            });
        }

        // Проверка на специальные сообщения
        if (json.translate) {
            console.log('Тип перевода:', json.translate);
            console.log('Параметры:', json.with);
        }
    });

    // Обработанные сообщения чата (проще в использовании)
    bot.onChatMessage((data) => {
        console.log(`[${data.type}] ${data.username}: ${data.message}`);

        // Также содержит raw_message для доступа к исходному тексту
        console.log('Исходное сообщение:', data.raw_message);
    });
}

main().catch(console.error);
```

### Фильтрация сообщений по типу

```javascript
bot.onRawMessage((data) => {
    const json = data.json;

    // Сообщения о смерти
    if (json.translate && json.translate.startsWith('death.')) {
        console.log('💀 Событие смерти:', data.raw_message);
    }

    // Системные сообщения
    if (json.translate && json.translate.startsWith('chat.type.')) {
        console.log('📢 Системное сообщение:', data.raw_message);
    }

    // Сообщения с упоминанием бота
    if (data.raw_message.includes('BotName')) {
        console.log('📬 Упоминание бота:', data.raw_message);
    }
});
```

### Автоматический ответ на команды

```javascript
async function main() {
    await bot.connect();

    bot.onChatMessage(async (data) => {
        // Проверяем команды
        if (data.message.startsWith('!help')) {
            await bot.sendMessage(`Привет, ${data.username}! Доступные команды: !help, !status, !rules`);
        }

        if (data.message.startsWith('!status')) {
            const isOnline = await bot.getStatus();
            await bot.sendMessage(`Бот ${isOnline ? 'онлайн ✅' : 'офлайн ❌'}`);
        }

        if (data.message.startsWith('!rules')) {
            await bot.sendMessage('1. Не гриферить 2. Уважать игроков 3. Не использовать читы');
        }
    });

    // Автоматическое приветствие новых игроков
    bot.onPlayerJoin(async (username) => {
        await bot.sendMessage(`Добро пожаловать на сервер, ${username}! 👋`);

        // Запускаем граф приветствия
        try {
            await bot.triggerGraph('welcome_player', { username });
        } catch (error) {
            console.error('Ошибка запуска графа:', error.message);
        }
    });

    // Прощание с игроками
    bot.onPlayerLeave((username) => {
        console.log(`${username} покинул сервер`);
    });
}
```

### Модерация с использованием API

```javascript
async function main() {
    await bot.connect();

    // Список запрещенных слов
    const bannedWords = ['spam', 'grief', 'hack'];

    bot.onChatMessage(async (data) => {
        const message = data.message.toLowerCase();
        const username = data.username;

        // Проверка на запрещенные слова
        const hasBannedWord = bannedWords.some(word => message.includes(word));

        if (hasBannedWord) {
            console.log(`⚠️ ${username} использовал запрещенное слово`);

            // Получаем данные пользователя
            const user = await bot.getUser(username);

            // Если уже в blacklist, ничего не делаем
            if (user.isBlacklisted) {
                return;
            }

            // Проверяем количество нарушений (нужно вести свой счетчик)
            // Для примера сразу добавляем предупреждение
            if (!user.groups.includes('warned')) {
                await bot.addUserToGroup(username, 'warned');
                await bot.sendMessage(`${username}, предупреждение за нарушение правил!`, 'chat');
            } else {
                // Второе нарушение - в blacklist
                await bot.setUserBlacklist(username, true);
                await bot.sendMessage(`${username} был заблокирован за повторное нарушение`, 'chat');
            }
        }
    });

    // Команда для админов - снять блокировку
    bot.onChatMessage(async (data) => {
        if (!data.message.startsWith('!unban ')) return;

        // Проверяем права отправителя
        const sender = await bot.getUser(data.username);
        if (!sender.groups.includes('admin')) {
            await bot.sendMessage('У вас нет прав для этой команды', 'private', data.username);
            return;
        }

        const targetUsername = data.message.split(' ')[1];
        if (!targetUsername) {
            await bot.sendMessage('Использование: !unban <username>', 'private', data.username);
            return;
        }

        try {
            await bot.setUserBlacklist(targetUsername, false);
            await bot.sendMessage(`${targetUsername} был разблокирован`, 'chat');
        } catch (error) {
            await bot.sendMessage(`Ошибка: ${error.message}`, 'private', data.username);
        }
    });
}
```

### Мониторинг здоровья бота

```javascript
async function main() {
    await bot.connect();

    let lastHealth = 20;

    bot.onHealthUpdate((data) => {
        console.log(`❤️ Здоровье: ${data.health}/20, 🍖 Еда: ${data.food}/20`);

        // Критическое здоровье
        if (data.health < 5 && lastHealth >= 5) {
            console.log('⚠️ КРИТИЧЕСКОЕ ЗДОРОВЬЕ!');
            // Можно отправить уведомление админам
        }

        // Низкая сытость
        if (data.food < 5) {
            console.log('🍖 Низкая сытость!');
        }

        lastHealth = data.health;
    });

    bot.onDeath(async () => {
        console.log('💀 Бот умер!');
        await bot.sendMessage('Упс, я умер...');
    });

    // Отслеживание статуса
    bot.onStatusChanged((isOnline) => {
        console.log(`Статус бота изменился: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        if (!isOnline) {
            console.log('⚠️ Бот офлайн! Переподключение...');
        }
    });
}
```

### Обработка кастомных событий от плагинов

```javascript
async function main() {
    await bot.connect();

    bot.onCustomEvent((data) => {
        console.log('🔔 Кастомное событие:', data);

        // Обработка специфичных событий плагинов
        if (data.type === 'economy:transaction') {
            console.log(`💰 Транзакция: ${data.from} -> ${data.to}: $${data.amount}`);
        }

        if (data.type === 'clan:war_started') {
            console.log(`⚔️ Война кланов: ${data.clan1} vs ${data.clan2}`);
        }
    });
}
```

## Лицензия

MIT
