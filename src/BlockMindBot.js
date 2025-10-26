const io = require('socket.io-client');
const { EventEmitter } = require('events');

/**
 * Высокоуровневый клиент для BlockMind Bot API
 */
class BlockMindBot extends EventEmitter {
    constructor(options) {
        super();

        if (!options.url) throw new Error('url is required');
        if (!options.botId) throw new Error('botId is required');
        if (!options.apiKey) throw new Error('apiKey is required');

        this.url = options.url;
        this.botId = options.botId;
        this.apiKey = options.apiKey;
        this.socket = null;
        this.isConnected = false;
        this.isOnline = false;
    }

    /**
     * Подключиться к боту
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(`${this.url}/bot-api`, {
                query: { botId: this.botId },
                auth: { token: this.apiKey }
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                this.emit('connected');
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                this.isConnected = false;
                this.emit('error', error);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.isOnline = false;
                this.emit('disconnected');
            });

            // Статус бота
            this.socket.on('bot:status', (data) => {
                this.isOnline = data.online;
                this.emit('statusChanged', data.online);
            });

            // События чата
            this.socket.on('chat:message', (data) => {
                this.emit('chatMessage', data);
            });

            // События игроков
            this.socket.on('player:join', (data) => {
                this.emit('playerJoin', data.username);
            });

            this.socket.on('player:leave', (data) => {
                this.emit('playerLeave', data.username);
            });

            // Здоровье
            this.socket.on('bot:health', (data) => {
                this.emit('healthUpdate', data);
            });

            // Смерть
            this.socket.on('bot:death', () => {
                this.emit('death');
            });

            // Сырые сообщения
            this.socket.on('chat:raw_message', (data) => {
                this.emit('rawMessage', data);
            });

            // Кастомные события от плагинов
            this.socket.on('plugin:custom_event', (data) => {
                this.emit('customEvent', data);
            });

            // Сообщения от бота через bot.sendMessage('websocket', ...)
            this.socket.on('bot:message', (data) => {
                this.emit('botMessage', data.message);
            });

            // Общие ошибки Socket.IO (не action ошибки)
            this.socket.on('error', (error) => {
                // Игнорируем ошибки действий, они обрабатываются в методах
                if (!error.action) {
                    console.error('[BlockMindBot] Socket.IO error:', error);
                }
            });
        });
    }

    /**
     * Отключиться от бота
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.isOnline = false;
        }
    }

    /**
     * Проверка что бот онлайн
     */
    async getStatus() {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));

            this.socket.emit('action:get_status');

            const timeout = setTimeout(() => {
                this.socket.off('action:result', onResult);
                reject(new Error('Timeout'));
            }, 5000);

            const onResult = (data) => {
                if (data.action === 'get_status') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    const isOnline = data.online === true;
                    this.isOnline = isOnline;
                    resolve(isOnline);
                }
            };

            this.socket.on('action:result', onResult);
        });
    }

    /**
     * Отправить сообщение в чат
     */
    async sendMessage(message, chatType = 'chat', recipient = null) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));

            const payload = { chatType, message };
            if (recipient) payload.recipient = recipient;

            this.socket.emit('action:send_message', payload);

            const timeout = setTimeout(() => {
                this.socket.off('action:result', onResult);
                this.socket.off('error', onError);
                reject(new Error('Timeout'));
            }, 5000);

            const onResult = (data) => {
                if (data.action === 'send_message') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    resolve(data);
                }
            };

            const onError = (error) => {
                if (error.action === 'send_message') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    reject(new Error(error.message));
                }
            };

            this.socket.on('action:result', onResult);
            this.socket.on('error', onError);
        });
    }

    /**
     * Вызвать граф и получить ответ
     * Граф получит событие websocket_call и сможет отправить данные обратно
     */
    async callGraph(graphName, data = {}) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));

            this.socket.emit('action:call_graph', { graphName, data });

            const timeout = setTimeout(() => {
                this.socket.off('action:result', onResult);
                this.socket.off('error', onError);
                reject(new Error('Timeout'));
            }, 30000);

            const onResult = (data) => {
                if (data.action === 'call_graph') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    resolve(data.response);
                }
            };

            const onError = (error) => {
                if (error.action === 'call_graph') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    reject(new Error(error.message));
                }
            };

            this.socket.on('action:result', onResult);
            this.socket.on('error', onError);
        });
    }

    /**
     * Запустить визуальный граф (без ожидания ответа)
     */
    async triggerGraph(graphName, context = {}) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));

            this.socket.emit('action:trigger_graph', { graphName, context });

            const timeout = setTimeout(() => {
                this.socket.off('action:result', onResult);
                this.socket.off('error', onError);
                reject(new Error('Timeout'));
            }, 5000);

            const onResult = (data) => {
                if (data.action === 'trigger_graph') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    resolve(data);
                }
            };

            const onError = (error) => {
                if (error.action === 'trigger_graph') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    reject(new Error(error.message));
                }
            };

            this.socket.on('action:result', onResult);
            this.socket.on('error', onError);
        });
    }

    /**
     * Выполнить команду бота от имени указанного пользователя
     */
    async executeCommand(username, command, args = {}) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));
            if (!username) return reject(new Error('Username is required to execute a command.'));

            this.socket.emit('action:execute_command', { username, command, args });

            const timeout = setTimeout(() => {
                this.socket.off('command:result', onResult);
                this.socket.off('command:error', onError);
                reject(new Error('Timeout'));
            }, 10000);

            const onResult = (data) => {
                clearTimeout(timeout);
                this.socket.off('command:result', onResult);
                this.socket.off('command:error', onError);
                resolve(data.result);
            };

            const onError = (data) => {
                clearTimeout(timeout);
                this.socket.off('command:result', onResult);
                this.socket.off('command:error', onError);
                reject(new Error(data.error));
            };

            this.socket.on('command:result', onResult);
            this.socket.on('command:error', onError);
        });
    }

    /**
     * Получить данные пользователя
     */
    async getUser(username) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));

            this.socket.emit('action:get_user', { username });

            const timeout = setTimeout(() => {
                this.socket.off('action:result', onResult);
                this.socket.off('error', onError);
                reject(new Error('Timeout'));
            }, 5000);

            const onResult = (data) => {
                if (data.action === 'get_user') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    resolve(data.user);
                }
            };

            const onError = (error) => {
                if (error.action === 'get_user') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    reject(new Error(error.message));
                }
            };

            this.socket.on('action:result', onResult);
            this.socket.on('error', onError);
        });
    }

    /**
     * Добавить пользователя в группу
     */
    async addUserToGroup(username, groupName) {
        return this._updateUser(username, 'addGroup', groupName);
    }

    /**
     * Удалить пользователя из группы
     */
    async removeUserFromGroup(username, groupName) {
        return this._updateUser(username, 'removeGroup', groupName);
    }

    /**
     * Установить/снять blacklist
     */
    async setUserBlacklist(username, value) {
        return this._updateUser(username, 'setBlacklist', value);
    }

    /**
     * Внутренний метод для обновления пользователя
     */
    async _updateUser(username, operation, value) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Not connected'));

            this.socket.emit('action:update_user', { username, operation, value });

            const timeout = setTimeout(() => {
                this.socket.off('action:result', onResult);
                this.socket.off('error', onError);
                reject(new Error('Timeout'));
            }, 5000);

            const onResult = (data) => {
                if (data.action === 'update_user') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    resolve(data);
                }
            };

            const onError = (error) => {
                if (error.action === 'update_user') {
                    clearTimeout(timeout);
                    this.socket.off('action:result', onResult);
                    this.socket.off('error', onError);
                    reject(new Error(error.message));
                }
            };

            this.socket.on('action:result', onResult);
            this.socket.on('error', onError);
        });
    }

    // Удобные методы для подписки на события

    /**
     * Подписаться на сообщения в чате
     * @param {Function} callback - Функция обработчик (data) => void
     * data: { type, username, message, raw_message }
     */
    onChatMessage(callback) {
        this.on('chatMessage', callback);
    }

    onPlayerJoin(callback) {
        this.on('playerJoin', callback);
    }

    onPlayerLeave(callback) {
        this.on('playerLeave', callback);
    }

    onStatusChanged(callback) {
        this.on('statusChanged', callback);
    }

    onHealthUpdate(callback) {
        this.on('healthUpdate', callback);
    }

    onDeath(callback) {
        this.on('death', callback);
    }

    onRawMessage(callback) {
        this.on('rawMessage', callback);
    }

    onCustomEvent(callback) {
        this.on('customEvent', callback);
    }

    /**
     * Подписаться на сообщения от бота (через sendMessage 'websocket')
     * @param {Function} callback - Функция обработчик (message) => void
     */
    onBotMessage(callback) {
        this.on('botMessage', callback);
    }
}

module.exports = BlockMindBot;
