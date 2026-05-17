/**
 * Конфигурация подключения к PostgreSQL
 * Использует pg (node-postgres)
 */

const { Pool } = require('pg');

/**
 * Подключение к базе данных PostgreSQL
 */
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'tuning_user',
    password: process.env.POSTGRES_PASSWORD || 'tuning_password',
    database: process.env.POSTGRES_DB || 'tuning_manual',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * Тест подключения
 */
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log(`✅ PostgreSQL подключена: ${result.rows[0].now}`);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка подключения к PostgreSQL: ${error.message}`);
        return false;
    }
};

/**
 * Выполнение запроса
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error', { text, error });
        throw error;
    }
};

/**
 * Закрытие пула соединений
 */
const closePool = async () => {
    await pool.end();
    console.log('PostgreSQL connection pool closed');
};

module.exports = {
    pool,
    query,
    testConnection,
    closePool
};
