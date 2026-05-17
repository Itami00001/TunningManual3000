/**
 * Конфигурация подключения к MongoDB
 * Использует Mongoose ODM
 */

const mongoose = require('mongoose');

/**
 * Подключение к базе данных MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        // Получаем URI из переменных окружения
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tuning_manual';

        // Настройки подключения Mongoose
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        // Подключаемся к MongoDB
        const conn = await mongoose.connect(mongoURI, options);

        console.log(`✅ MongoDB подключена: ${conn.connection.host}`);

        // Обработка событий подключения
        mongoose.connection.on('error', (err) => {
            console.error(`❌ Ошибка MongoDB: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB отключена');
        });

    } catch (error) {
        console.error(`❌ Ошибка подключения к MongoDB: ${error.message}`);
        
        // Устанавливаем флаг для использования моков
        process.env.MONGODB_UNAVAILABLE = 'true';
        console.log('⚠️ Переключение на режим работы без MongoDB (демо-режим)');
        
        // Не завершаем процесс, продолжаем работу в демо-режиме
        // process.exit(1);
    }
};

module.exports = connectDB;
