/**
 * Главный файл сервера Express
 * TuningManual3000 - Интерактивный конструктор тюнинга автомобилей
 *
 * Поддерживает два режима БД:
 *   DB_TYPE=postgres  — PostgreSQL (production)
 *   DB_TYPE=file      — JSON-файлы (fallback / dev без БД)
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app    = express();
const DB_TYPE = process.env.DB_TYPE || 'file';
const isPostgres = DB_TYPE === 'postgres';

// ============================================================
// Middleware
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']
        : true,
    credentials: true,
}));

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`📥 ${req.method} ${req.url}`);
        next();
    });
}

// ============================================================
// Статические файлы
// ============================================================
if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const distPath   = path.join(__dirname, '../dist');
    const clientPath = path.join(__dirname, '../client');
    const staticPath = fs.existsSync(distPath) ? distPath : clientPath;

    app.use(express.static(staticPath));
    app.use('/css', express.static(path.join(clientPath, 'css')));
    app.use('/js',  express.static(path.join(clientPath, 'js')));
}

app.use('/assets', express.static(path.join(__dirname, '../client/assets')));

// ============================================================
// Выбор контроллеров в зависимости от DB_TYPE
// ============================================================
let carsController, partsController, categoriesController, calculationsController;

if (isPostgres) {
    console.log('🐘 Режим БД: PostgreSQL');
    carsController          = require('./controllers/pgCarController');
    partsController         = require('./controllers/pgPartsController');
    categoriesController    = require('./controllers/pgCategoriesController');
    calculationsController  = require('./controllers/pgCalculationsController');
} else {
    console.log('📁 Режим БД: FileDB (JSON)');
    carsController          = require('./controllers/fileDBController');
    partsController         = require('./controllers/fileDBPartsController');
    categoriesController    = require('./controllers/fileDBCategoriesController');
    calculationsController  = require('./controllers/fileDBCalculationsController');
}

// ============================================================
// API маршруты
// ============================================================
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'TuningManual3000 API',
        version: '1.0.0',
        dbType: DB_TYPE,
        endpoints: {
            cars:       '/api/cars',
            parts:      '/api/parts',
            categories: '/api/categories',
            calculate:  '/api/calculate',
        },
    });
});

// Автомобили
app.get('/api/cars',       carsController.getAllCars);
app.get('/api/cars/:slug', carsController.getCarBySlug);

// Детали
app.get('/api/parts', partsController.getParts);

// Категории
app.get('/api/categories', categoriesController.getAllCategories);

// Расчёты
app.post('/api/calculate', calculationsController.calculateBuild);

// ============================================================
// SPA fallback (production)
// ============================================================
if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const distPath   = path.join(__dirname, '../dist');
    const clientPath = path.join(__dirname, '../client');
    const staticPath = fs.existsSync(distPath) ? distPath : clientPath;

    app.get('/car.html',   (req, res) => res.sendFile(path.join(staticPath, 'car.html')));
    app.get('/admin.html', (req, res) => res.sendFile(path.join(staticPath, 'admin.html')));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}

// ============================================================
// Обработка ошибок
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// Запуск
// ============================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║   🚗 TuningManual3000 — Сервер запущен!               ║');
    console.log('║                                                        ║');
    console.log(`║   🌐 API:    http://localhost:${PORT}/api                 ║`);
    console.log(`║   📊 Режим:  ${(process.env.NODE_ENV || 'development').padEnd(42)}║`);
    console.log(`║   🗄️  БД:    ${DB_TYPE.padEnd(43)}║`);
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    // Инициализация FileDB (только в file-режиме)
    if (!isPostgres) {
        const FileDB = require('./config/fileDB');
        const fileDB = new FileDB();
        console.log('🔄 Инициализация файловой базы данных...');
        await fileDB.initializeData();
    } else {
        // Проверяем подключение к PostgreSQL
        const { testConnection } = require('./config/postgres');
        const ok = await testConnection();
        if (!ok) {
            console.error('❌ PostgreSQL недоступна! Проверьте переменные окружения.');
        }
    }

    console.log('✅ Сервер готов к работе!');
});

process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
});
