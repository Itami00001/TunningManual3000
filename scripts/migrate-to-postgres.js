/**
 * Скрипт миграции данных из JSON файлов в PostgreSQL
 * Запуск: npm run migrate
 *
 * Источники данных:
 *   - DataBases/data/cars.json      — автомобили (с slug, fullName, imageUrl)
 *   - DataBases/parts/jdm.json      — JDM детали
 *   - DataBases/parts/europe.json   — европейские детали
 *   - DataBases/parts/global.json   — универсальные детали
 *   - DataBases/kits.json           — комплекты
 *   - DataBases/formulas.json       — формулы расчётов
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { query, testConnection, closePool } = require('../server/config/postgres');

// ============================================================
// Маппинг категорий из формата "engine.turbo" → slug "turbo"
// ============================================================
const CATEGORY_MAP = {
    'engine':               'engine',
    'engine.turbo':         'turbo',
    'engine.turbo_kit':     'turbo',
    'engine.intercooler':   'intake',
    'engine.intake':        'intake',
    'engine.air_filter':    'intake',
    'engine.oil_filter':    'engine',
    'engine.management':    'engine_management',
    'exhaust':              'exhaust',
    'exhaust.system':       'exhaust',
    'exhaust.downpipe':     'exhaust',
    'suspension':           'suspension',
    'suspension.coilover':  'suspension',
    'brakes':               'brakes',
    'brakes.pads.front':    'brakes',
    'brakes.pads.rear':     'brakes',
    'brakes.disc':          'brakes',
    'fuel':                 'fuel',
    'fuel.pump':            'fuel',
    'fuel.injector':        'fuel',
    'fuel.system':          'fuel',
    'ecu':                  'ecu',
    'ecu.tune':             'ecu',
    'camshaft':             'camshaft',
    'ignition':             'ignition',
    'cooling':              'cooling',
    'transmission':         'engine',
    'transmission.swap':    'engine',
    'other':                'other',
};

function resolveCategorySlug(rawCategory) {
    if (!rawCategory) return 'other';
    const lower = rawCategory.toLowerCase();
    if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
    // Попробуем по первой части "engine.xxx" → "engine"
    const prefix = lower.split('.')[0];
    return CATEGORY_MAP[prefix] || 'other';
}

// ============================================================
// Маппинг ID деталей → ID автомобилей
// Ключи — префиксы ID деталей, значения — массивы car_id
// ============================================================
function buildCarCompatibilityMap(carsData) {
    // Строим маппинг: slug автомобиля → id
    const slugToId = {};
    for (const car of carsData) {
        slugToId[car.slug] = car.id;
        // Также по id из DataBases/cars.json (underscore формат)
        const underscoreId = car.id.replace(/-/g, '_');
        slugToId[underscoreId] = car.id;
    }
    return slugToId;
}

/**
 * Определяет совместимые автомобили по ID детали
 * Логика: ID детали начинается с идентификатора автомобиля
 */
function getCompatibleCars(partId, slugToId) {
    const compatible = new Set();
    const lowerPartId = partId.toLowerCase();

    for (const [key, carId] of Object.entries(slugToId)) {
        const lowerKey = key.toLowerCase().replace(/-/g, '_');
        if (lowerPartId.startsWith(lowerKey + '_') || lowerPartId.startsWith(lowerKey + '-')) {
            compatible.add(carId);
        }
    }

    // Специальные случаи для универсальных деталей
    if (lowerPartId.startsWith('air_filter') ||
        lowerPartId.startsWith('oil_filter') ||
        lowerPartId.startsWith('brake_pad') ||
        lowerPartId.startsWith('spark_plug') ||
        lowerPartId.startsWith('coolant')) {
        // Универсальные — совместимы со всеми
        for (const carId of Object.values(slugToId)) {
            compatible.add(carId);
        }
    }

    return [...compatible];
}

// ============================================================
// Загрузка JSON с поддержкой комментариев (/* ... */)
// ============================================================
function readJsonWithComments(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    // Удаляем блочные комментарии /* ... */
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(cleaned);
}

// ============================================================
// 1. Категории
// ============================================================
async function importCategories() {
    console.log('🔄 Импорт категорий...');

    const categories = [
        { id: 'engine',            name: 'Двигатель',              slug: 'engine',            icon: '⚙️',  order: 1  },
        { id: 'turbo',             name: 'Турбина',                slug: 'turbo',             icon: '💨',  order: 2  },
        { id: 'exhaust',           name: 'Выхлопная система',      slug: 'exhaust',           icon: '💥',  order: 3  },
        { id: 'suspension',        name: 'Подвеска',               slug: 'suspension',        icon: '🔩',  order: 4  },
        { id: 'brakes',            name: 'Тормоза',                slug: 'brakes',            icon: '🛑',  order: 5  },
        { id: 'intake',            name: 'Впуск',                  slug: 'intake',            icon: '🌪️', order: 6  },
        { id: 'fuel',              name: 'Топливная система',      slug: 'fuel',              icon: '⛽',  order: 7  },
        { id: 'ecu',               name: 'ЭБУ и электроника',     slug: 'ecu',               icon: '💻',  order: 8  },
        { id: 'camshaft',          name: 'Распредвалы',            slug: 'camshaft',          icon: '⚙️',  order: 9  },
        { id: 'ignition',          name: 'Зажигание',              slug: 'ignition',          icon: '⚡',  order: 10 },
        { id: 'cooling',           name: 'Охлаждение',             slug: 'cooling',           icon: '❄️',  order: 11 },
        { id: 'engine_management', name: 'Управление двигателем',  slug: 'engine_management', icon: '🔧',  order: 12 },
        { id: 'other',             name: 'Другое',                 slug: 'other',             icon: '🔧',  order: 99 },
    ];

    for (const cat of categories) {
        await query(
            `INSERT INTO categories (id, name, slug, icon, order_index)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                icon = EXCLUDED.icon,
                order_index = EXCLUDED.order_index`,
            [cat.id, cat.name, cat.slug, cat.icon, cat.order]
        );
    }

    console.log(`✅ Импортировано категорий: ${categories.length}`);
    return categories;
}

// ============================================================
// 2. Автомобили — из DataBases/data/cars.json
// ============================================================
async function importCars() {
    console.log('🔄 Импорт автомобилей...');

    const carsPath = path.join(__dirname, '../DataBases/data/cars.json');
    const carsData = JSON.parse(fs.readFileSync(carsPath, 'utf8'));

    for (const car of carsData) {
        const fullName = car.fullName || `${car.brand} ${car.model} ${car.generation || ''}`.trim();
        const slug = car.slug || car.id;

        await query(
            `INSERT INTO cars (id, brand, model, generation, slug, full_name,
                               main_image_url, year_start, year_end,
                               base_power, base_torque, description, is_active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             ON CONFLICT (id) DO UPDATE SET
                brand         = EXCLUDED.brand,
                model         = EXCLUDED.model,
                generation    = EXCLUDED.generation,
                slug          = EXCLUDED.slug,
                full_name     = EXCLUDED.full_name,
                main_image_url= EXCLUDED.main_image_url,
                year_start    = EXCLUDED.year_start,
                year_end      = EXCLUDED.year_end,
                base_power    = EXCLUDED.base_power,
                base_torque   = EXCLUDED.base_torque,
                description   = EXCLUDED.description,
                is_active     = EXCLUDED.is_active`,
            [
                car.id,
                car.brand,
                car.model,
                car.generation || null,
                slug,
                fullName,
                car.mainImageUrl || null,
                car.yearStart || null,
                car.yearEnd || null,
                car.basePower || 0,
                car.baseTorque || 0,
                car.description || null,
                car.isActive !== false,
            ]
        );
    }

    console.log(`✅ Импортировано автомобилей: ${carsData.length}`);
    return carsData;
}

// ============================================================
// 3. Детали — из DataBases/parts/*.json
// ============================================================
async function importParts(carsData) {
    console.log('🔄 Импорт деталей...');

    const slugToId = buildCarCompatibilityMap(carsData);

    const partFiles = [
        path.join(__dirname, '../DataBases/parts/jdm.json'),
        path.join(__dirname, '../DataBases/parts/europe.json'),
        path.join(__dirname, '../DataBases/parts/global.json'),
    ];

    let totalImported = 0;

    // Сначала собираем все детали из всех файлов
    const allParts = [];
    for (const filePath of partFiles) {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  Файл не найден: ${filePath}`);
            continue;
        }
        const fileData = readJsonWithComments(filePath);
        const items = fileData.items || [];
        allParts.push(...items);
    }

    // Проход 1: вставляем все детали и их specs + совместимость
    for (const part of allParts) {
        const partId = part.id;
        const categorySlug = resolveCategorySlug(part.category);

        const catResult = await query('SELECT id FROM categories WHERE slug = $1', [categorySlug]);
        const categoryId = catResult.rows[0]?.id || 'other';

        const specs = part.specs || {};
        const compatibilityScore = specs.compatibilityScore != null ? specs.compatibilityScore : null;
        const complexityInstall  = specs.installDifficulty  != null ? specs.installDifficulty  : null;
        const priceApprox        = specs.price != null ? String(specs.price) : null;

        await query(
            `INSERT INTO parts (id, name, category_id, description,
                                price_approx, compatibility_score, complexity_install, is_active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,true)
             ON CONFLICT (id) DO UPDATE SET
                name                = EXCLUDED.name,
                category_id         = EXCLUDED.category_id,
                description         = EXCLUDED.description,
                price_approx        = EXCLUDED.price_approx,
                compatibility_score = EXCLUDED.compatibility_score,
                complexity_install  = EXCLUDED.complexity_install`,
            [partId, part.name, categoryId, part.instruction || null,
             priceApprox, compatibilityScore, complexityInstall]
        );

        // Specs
        for (const [key, value] of Object.entries(specs)) {
            await query(
                `INSERT INTO part_specs (part_id, spec_key, spec_value)
                 VALUES ($1,$2,$3)
                 ON CONFLICT (part_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value`,
                [partId, key, String(value)]
            );
        }

        // Совместимость с автомобилями
        const compatibleCarIds = getCompatibleCars(partId, slugToId);
        for (const carId of compatibleCarIds) {
            await query(
                `INSERT INTO part_compatibility (part_id, car_id)
                 VALUES ($1,$2)
                 ON CONFLICT (part_id, car_id) DO NOTHING`,
                [partId, carId]
            );
        }

        totalImported++;
    }

    // Проход 2: синергия (все детали уже в БД)
    console.log('🔄 Импорт синергии деталей...');
    let synergyCount = 0;
    for (const part of allParts) {
        const relatedIds = [...(part.requires || []), ...(part.synergy || [])];
        for (const relatedId of relatedIds) {
            // Проверяем, что связанная деталь существует
            const check = await query('SELECT id FROM parts WHERE id = $1', [relatedId]);
            if (check.rows.length > 0) {
                await query(
                    `INSERT INTO part_synergy (part_id, related_part_id)
                     VALUES ($1,$2)
                     ON CONFLICT (part_id, related_part_id) DO NOTHING`,
                    [part.id, relatedId]
                );
                synergyCount++;
            }
        }
    }
    console.log(`✅ Импортировано связей синергии: ${synergyCount}`);

    console.log(`✅ Импортировано деталей: ${totalImported}`);
}

// ============================================================
// 4. Комплекты — из DataBases/kits.json
// ============================================================
async function importKits() {
    console.log('🔄 Импорт комплектов...');

    const kitsPath = path.join(__dirname, '../DataBases/kits.json');
    if (!fs.existsSync(kitsPath)) {
        console.warn('⚠️  DataBases/kits.json не найден, пропускаем');
        return;
    }

    const kitsData = JSON.parse(fs.readFileSync(kitsPath, 'utf8'));

    for (const kit of kitsData) {
        // Нормализуем forCar: underscore → dash
        const forCarId = kit.forCar ? kit.forCar.replace(/_/g, '-') : null;

        // Проверяем, существует ли автомобиль
        let validCarId = null;
        if (forCarId) {
            const carCheck = await query('SELECT id FROM cars WHERE id = $1', [forCarId]);
            validCarId = carCheck.rows[0]?.id || null;
        }

        await query(
            `INSERT INTO kits (id, name, for_car_id, description)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (id) DO UPDATE SET
                name       = EXCLUDED.name,
                for_car_id = EXCLUDED.for_car_id,
                description= EXCLUDED.description`,
            [kit.id, kit.name, validCarId, kit.description || null]
        );

        // Детали в комплекте
        if (kit.partIds && Array.isArray(kit.partIds)) {
            for (let i = 0; i < kit.partIds.length; i++) {
                const partId = kit.partIds[i];
                // Проверяем, существует ли деталь
                const partCheck = await query('SELECT id FROM parts WHERE id = $1', [partId]);
                if (partCheck.rows.length > 0) {
                    await query(
                        `INSERT INTO kit_parts (kit_id, part_id, order_index)
                         VALUES ($1,$2,$3)
                         ON CONFLICT (kit_id, part_id) DO NOTHING`,
                        [kit.id, partId, i]
                    );
                }
            }
        }
    }

    console.log(`✅ Импортировано комплектов: ${kitsData.length}`);
}

// ============================================================
// 5. Формулы — из DataBases/formulas.json
// ============================================================
async function importFormulas() {
    console.log('🔄 Импорт формул...');

    const formulasPath = path.join(__dirname, '../DataBases/formulas.json');
    if (!fs.existsSync(formulasPath)) {
        console.warn('⚠️  DataBases/formulas.json не найден, пропускаем');
        return;
    }

    const formulasData = JSON.parse(fs.readFileSync(formulasPath, 'utf8'));
    let count = 0;

    // Display formulas
    if (formulasData.displayFormulas) {
        for (const [key, formula] of Object.entries(formulasData.displayFormulas)) {
            await query(
                `INSERT INTO formulas (formula_key, formula_type, formula_text, description)
                 VALUES ($1,'display',$2,$3)
                 ON CONFLICT (formula_key) DO UPDATE SET formula_text = EXCLUDED.formula_text`,
                [key, formula, `Display formula: ${key}`]
            );
            count++;
        }
    }

    // Chart formulas
    if (formulasData.charts) {
        for (const [chartType, chartData] of Object.entries(formulasData.charts)) {
            if (chartData.calculation) {
                for (const [key, formula] of Object.entries(chartData.calculation)) {
                    const fKey = `${chartType}_${key}`;
                    await query(
                        `INSERT INTO formulas (formula_key, formula_type, category, formula_text, description)
                         VALUES ($1,$2,$3,$4,$5)
                         ON CONFLICT (formula_key) DO UPDATE SET formula_text = EXCLUDED.formula_text`,
                        [fKey, 'chart', chartType, formula, `Chart formula: ${key}`]
                    );
                    count++;
                }
            }
        }
    }

    console.log(`✅ Импортировано формул: ${count}`);
}

// ============================================================
// Главная функция
// ============================================================
async function migrate() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   🚀 Миграция данных в PostgreSQL                   ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');

    try {
        // Тест подключения (ждём до 30 сек)
        let connected = false;
        for (let attempt = 1; attempt <= 10; attempt++) {
            connected = await testConnection();
            if (connected) break;
            console.log(`⏳ Попытка ${attempt}/10 — PostgreSQL ещё не готова, ждём 3 сек...`);
            await new Promise(r => setTimeout(r, 3000));
        }

        if (!connected) {
            throw new Error('Не удалось подключиться к PostgreSQL после 10 попыток');
        }

        await importCategories();
        const carsData = await importCars();
        await importParts(carsData);
        await importKits();
        await importFormulas();

        console.log('');
        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║   ✅ Миграция завершена успешно!                    ║');
        console.log('╚══════════════════════════════════════════════════════╝');
        console.log('');

    } catch (error) {
        console.error('❌ Ошибка миграции:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await closePool();
    }
}

if (require.main === module) {
    migrate();
}

module.exports = { migrate };
