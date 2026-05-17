/**
 * Скрипт для заполнения БД тестовыми данными
 * Запуск: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Импортируем модели
const Car = require('../server/models/Car');
const PartCategory = require('../server/models/PartCategory');
const Part = require('../server/models/Part');

// Тестовые категории деталей
const categories = [
    { name: 'Двигатель', slug: 'engine', icon: '🔧', order: 1, description: 'Двигатели и моторы' },
    { name: 'Турбина', slug: 'turbo', icon: '💨', order: 2, description: 'Турбокомпрессоры и нагнетатели' },
    { name: 'Выхлопная система', slug: 'exhaust', icon: '💥', order: 3, description: 'Выхлопные коллекторы, даунпайпы, глушители' },
    { name: 'Подвеска', slug: 'suspension', icon: '🔩', order: 4, description: 'Койловеры, рычаги, стабилизаторы' },
    { name: 'Тормоза', slug: 'brakes', icon: '🛑', order: 5, description: 'Тормозные системы и компоненты' },
    { name: 'Трансмиссия', slug: 'transmission', icon: '⚙️', order: 6, description: 'КПП, сцепление, дифференциалы' },
    { name: 'Интерьер', slug: 'interior', icon: '🪑', order: 7, description: 'Сиденья, рули, приборные панели' },
    { name: 'Экстерьер', slug: 'exterior', icon: '🚗', order: 8, description: 'Бамперы, капоты, спойлеры, обвесы' },
];

// Тестовые автомобили
const cars = [
    {
        brand: 'Nissan',
        model: 'Silvia',
        generation: 'S14',
        slug: 'nissan-silvia-s14',
        mainImageUrl: '/assets/images/nissan-silvia-s14.png',
        description: 'Nissan Silvia S14 (1993-1998) - легендарный японский спорткар для дрифта',
        yearStart: 1993,
        yearEnd: 1998
    },
    {
        brand: 'Nissan',
        model: 'Silvia',
        generation: 'S15',
        slug: 'nissan-silvia-s15',
        mainImageUrl: '/assets/images/nissan-silvia-s15.png',
        description: 'Nissan Silvia S15 (1999-2002) - последнее поколение легендарной Silvia',
        yearStart: 1999,
        yearEnd: 2002
    },
    {
        brand: 'Nissan',
        model: 'Skyline',
        generation: 'R34 GT-R',
        slug: 'nissan-skyline-r34-gtr',
        mainImageUrl: '/assets/images/nissan-skyline-r34.png',
        description: 'Nissan Skyline R34 GT-R (1999-2002) - культовый японский суперкар',
        yearStart: 1999,
        yearEnd: 2002
    },
    {
        brand: 'Toyota',
        model: 'Supra',
        generation: 'A80',
        slug: 'toyota-supra-a80',
        mainImageUrl: '/assets/images/toyota-supra-a80.png',
        description: 'Toyota Supra A80 (1993-2002) - легендарный спорткар с 2JZ двигателем',
        yearStart: 1993,
        yearEnd: 2002
    },
    {
        brand: 'Mazda',
        model: 'RX-7',
        generation: 'FD3S',
        slug: 'mazda-rx7-fd3s',
        mainImageUrl: '/assets/images/mazda-rx7-fd3s.png',
        description: 'Mazda RX-7 FD3S (1992-2002) - роторный спорткар',
        yearStart: 1992,
        yearEnd: 2002
    }
];

// Функция создания деталей для автомобилей
const createParts = (carIds, categoryIds) => {
    // Находим ID нужных категорий
    const getCategory = (slug) => categoryIds.find(c => c.slug === slug)?._id;

    // Находим ID нужных автомобилей
    const getCar = (slug) => carIds.find(c => c.slug === slug)?._id;

    // Nissan S-chassis (S14, S15)
    const nissanSChassis = [getCar('nissan-silvia-s14'), getCar('nissan-silvia-s15')].filter(Boolean);

    // Все Nissan
    const allNissan = [
        getCar('nissan-silvia-s14'),
        getCar('nissan-silvia-s15'),
        getCar('nissan-skyline-r34-gtr')
    ].filter(Boolean);

    return [
        // Двигатели
        {
            name: 'SR20DET',
            categoryId: getCategory('engine'),
            description: 'Легендарный 2.0L турбо двигатель Nissan. Отличный потенциал для тюнинга, надёжный и распространённый.',
            specs: {
                displacement: '1998 cc',
                power: '250 л.с. (сток)',
                torque: '275 Нм',
                type: 'Рядный 4-цилиндровый турбо',
                tuningPotential: 'До 600+ л.с. с доработками'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/sr20det.png',
            marketSearchQuery: 'SR20DET двигатель купить',
            manufacturer: 'Nissan',
            priceEstimate: 150000
        },
        {
            name: 'RB26DETT',
            categoryId: getCategory('engine'),
            description: 'Культовый 2.6L twin-turbo двигатель от Nissan Skyline GT-R. Легенда японского автоспорта.',
            specs: {
                displacement: '2568 cc',
                power: '280 л.с. (заводское ограничение)',
                torque: '368 Нм',
                type: 'Рядный 6-цилиндровый twin-turbo',
                tuningPotential: 'До 1000+ л.с. с доработками'
            },
            compatibility: [getCar('nissan-skyline-r34-gtr')].filter(Boolean),
            imageUrl: '/assets/images/parts/rb26dett.png',
            marketSearchQuery: 'RB26DETT двигатель купить',
            manufacturer: 'Nissan',
            priceEstimate: 400000
        },
        {
            name: '2JZ-GTE',
            categoryId: getCategory('engine'),
            description: 'Легендарный 3.0L twin-turbo от Toyota. Известен невероятной прочностью и потенциалом.',
            specs: {
                displacement: '2997 cc',
                power: '280 л.с. (сток)',
                torque: '451 Нм',
                type: 'Рядный 6-цилиндровый twin-turbo',
                tuningPotential: 'До 2000! л.с. с доработками'
            },
            compatibility: [getCar('toyota-supra-a80')].filter(Boolean),
            imageUrl: '/assets/images/parts/2jz-gte.png',
            marketSearchQuery: '2JZ-GTE двигатель купить',
            manufacturer: 'Toyota',
            priceEstimate: 350000
        },

        // Турбины
        {
            name: 'Garrett GT2871R',
            categoryId: getCategory('turbo'),
            description: 'Популярный апгрейд турбины для SR20DET. Отличный баланс отклика и мощности.',
            specs: {
                maxPower: '400+ л.с.',
                compressorWheel: '71mm',
                bearing: 'Ball Bearing',
                type: 'Single Turbo'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/gt2871r.png',
            marketSearchQuery: 'Garrett GT2871R купить',
            manufacturer: 'Garrett',
            priceEstimate: 95000
        },
        {
            name: 'HKS GT-SS Turbo Kit',
            categoryId: getCategory('turbo'),
            description: 'Полный турбо-кит от HKS для RB26. Включает турбины, коллектор, пайпинг.',
            specs: {
                maxPower: '600+ л.с.',
                type: 'Twin Turbo Kit',
                includes: 'Турбины, коллектор, интеркулер, пайпинг'
            },
            compatibility: [getCar('nissan-skyline-r34-gtr')].filter(Boolean),
            imageUrl: '/assets/images/parts/hks-gt-ss.png',
            marketSearchQuery: 'HKS GT-SS RB26 турбо кит купить',
            manufacturer: 'HKS',
            priceEstimate: 450000
        },

        // Выхлоп
        {
            name: 'Tomei Expreme Ti',
            categoryId: getCategory('exhaust'),
            description: 'Титановая выхлопная система от Tomei. Агрессивный звук, минимальный вес.',
            specs: {
                material: 'Титан',
                diameter: '80mm',
                weight: '4.5 кг',
                sound: 'Агрессивный'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/tomei-ti.png',
            marketSearchQuery: 'Tomei Expreme Ti S14 S15 купить',
            manufacturer: 'Tomei',
            priceEstimate: 85000
        },
        {
            name: 'HKS Hi-Power Spec-L',
            categoryId: getCategory('exhaust'),
            description: 'Легендарная выхлопная система от HKS. Отличный баланс звука и производительности.',
            specs: {
                material: 'Нержавеющая сталь',
                diameter: '85mm',
                type: 'Cat-back'
            },
            compatibility: allNissan,
            imageUrl: '/assets/images/parts/hks-hipower.png',
            marketSearchQuery: 'HKS Hi-Power выхлоп Nissan купить',
            manufacturer: 'HKS',
            priceEstimate: 65000
        },

        // Подвеска
        {
            name: 'Tein Flex Z Coilovers',
            categoryId: getCategory('suspension'),
            description: 'Регулируемые койловеры от Tein. 16 настроек жёсткости, регулировка высоты.',
            specs: {
                adjustability: '16 положений',
                heightAdjustable: 'Да',
                type: 'Coilover'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/tein-flex-z.png',
            marketSearchQuery: 'Tein Flex Z S14 S15 койловеры купить',
            manufacturer: 'Tein',
            priceEstimate: 75000
        },
        {
            name: 'Cusco Adjustable Arms Set',
            categoryId: getCategory('suspension'),
            description: 'Комплект регулируемых рычагов Cusco для точной настройки развала и схождения.',
            specs: {
                includes: 'Передние + задние рычаги',
                material: 'Сталь',
                adjustability: 'Развал, схождение'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/cusco-arms.png',
            marketSearchQuery: 'Cusco рычаги S14 S15 купить',
            manufacturer: 'Cusco',
            priceEstimate: 55000
        },

        // Тормоза
        {
            name: 'Brembo GT Big Brake Kit',
            categoryId: getCategory('brakes'),
            description: 'Большой тормозной комплект Brembo. 4-поршневые суппорты, перфорированные диски.',
            specs: {
                pistons: '4',
                discSize: '345mm',
                includes: 'Суппорты, диски, колодки, шланги'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/brembo-gt.png',
            marketSearchQuery: 'Brembo GT тормоза S14 S15 купить',
            manufacturer: 'Brembo',
            priceEstimate: 180000
        },

        // Трансмиссия
        {
            name: 'Nismo 1.5 Way LSD',
            categoryId: getCategory('transmission'),
            description: 'Дифференциал повышенного трения от Nismo. 1.5 way для оптимального баланса.',
            specs: {
                type: '1.5 Way',
                ratio: 'Различные варианты',
                application: 'Дрифт / Трек'
            },
            compatibility: nissanSChassis,
            imageUrl: '/assets/images/parts/nismo-lsd.png',
            marketSearchQuery: 'Nismo LSD S14 S15 купить',
            manufacturer: 'Nismo',
            priceEstimate: 95000
        },
        {
            name: 'Exedy Stage 2 Clutch Kit',
            categoryId: getCategory('transmission'),
            description: 'Усиленный комплект сцепления Exedy. Держит до 450 л.с.',
            specs: {
                maxTorque: '450 Нм',
                disc: 'Керамика',
                includes: 'Диск, корзина, выжимной'
            },
            compatibility: [...nissanSChassis, getCar('toyota-supra-a80')].filter(Boolean),
            imageUrl: '/assets/images/parts/exedy-stage2.png',
            marketSearchQuery: 'Exedy Stage 2 сцепление купить',
            manufacturer: 'Exedy',
            priceEstimate: 45000
        },

        // Экстерьер
        {
            name: 'Origin Lab Racing Line Kit',
            categoryId: getCategory('exterior'),
            description: 'Полный аэродинамический обвес Origin Lab. Агрессивный стиль.',
            specs: {
                includes: 'Передний бампер, пороги, задний бампер',
                material: 'FRP (стеклопластик)'
            },
            compatibility: [getCar('nissan-silvia-s14')].filter(Boolean),
            imageUrl: '/assets/images/parts/origin-kit.png',
            marketSearchQuery: 'Origin Lab S14 обвес купить',
            manufacturer: 'Origin Lab',
            priceEstimate: 120000
        },
        {
            name: 'Vertex Ridge Wide Body',
            categoryId: getCategory('exterior'),
            description: 'Широкий обвес Vertex для S15. Легендарный агрессивный стиль.',
            specs: {
                includes: 'Расширители арок, бампера, пороги',
                material: 'FRP / Carbon опция',
                widening: '+50mm на сторону'
            },
            compatibility: [getCar('nissan-silvia-s15')].filter(Boolean),
            imageUrl: '/assets/images/parts/vertex-ridge.png',
            marketSearchQuery: 'Vertex Ridge S15 wide body купить',
            manufacturer: 'Vertex',
            priceEstimate: 250000
        }
    ];
};

// Главная функция сидинга
const seedDatabase = async () => {
    try {
        // Подключаемся к MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuning_manual';
        console.log('🔌 Подключение к MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Подключено к MongoDB');

        // Очищаем существующие данные
        console.log('🧹 Очистка существующих данных...');
        await Car.deleteMany({});
        await PartCategory.deleteMany({});
        await Part.deleteMany({});
        console.log('✅ Данные очищены');

        // Создаём категории
        console.log('📁 Создание категорий...');
        const createdCategories = await PartCategory.insertMany(categories);
        console.log(`✅ Создано ${createdCategories.length} категорий`);

        // Создаём автомобили
        console.log('🚗 Создание автомобилей...');
        const createdCars = await Car.insertMany(cars);
        console.log(`✅ Создано ${createdCars.length} автомобилей`);

        // Создаём детали
        console.log('🔧 Создание деталей...');
        const partsData = createParts(createdCars, createdCategories);
        const createdParts = await Part.insertMany(partsData);
        console.log(`✅ Создано ${createdParts.length} деталей`);

        console.log('');
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║   ✅ База данных успешно заполнена!               ║');
        console.log('╠════════════════════════════════════════════════════╣');
        console.log(`║   Категорий: ${createdCategories.length.toString().padEnd(35)}║`);
        console.log(`║   Автомобилей: ${createdCars.length.toString().padEnd(33)}║`);
        console.log(`║   Деталей: ${createdParts.length.toString().padEnd(37)}║`);
        console.log('╚════════════════════════════════════════════════════╝');
        console.log('');

        // Закрываем соединение
        await mongoose.connection.close();
        console.log('🔌 Соединение с MongoDB закрыто');

        process.exit(0);

    } catch (error) {
        console.error('❌ Ошибка при заполнении базы данных:', error);
        process.exit(1);
    }
};

// Запускаем сидинг
seedDatabase();
