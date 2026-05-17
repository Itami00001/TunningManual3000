/**
 * Контроллер для работы с автомобилями
 * Обрабатывает запросы к /api/cars
 */

const Car = require('../models/Car');
const Part = require('../models/Part');

/**
 * @desc    Получить все автомобили
 * @route   GET /api/cars
 * @access  Public
 */
exports.getAllCars = async (req, res) => {
    try {
        // Получаем все автомобили, сортируем по марке и модели
        const cars = await Car.find()
            .select('brand model generation slug mainImageUrl yearStart yearEnd')
            .sort({ brand: 1, model: 1 });

        res.status(200).json({
            success: true,
            count: cars.length,
            data: cars
        });

    } catch (error) {
        console.error('Ошибка при получении автомобилей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении списка автомобилей'
        });
    }
};

/**
 * @desc    Получить автомобиль по slug с совместимыми деталями
 * @route   GET /api/cars/:slug
 * @access  Public
 */
exports.getCarBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        // Находим автомобиль по slug
        const car = await Car.findOne({ slug });

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Автомобиль не найден'
            });
        }

        // Получаем детали, совместимые с этим автомобилем
        // Ищем по полю compatibility, которое содержит ID автомобилей
        console.log(`[carController] Ищем детали для автомобиля ID: ${car._id}`);
        const query = { compatibility: car._id, isActive: true };
        console.log('[carController] MongoDB query:', JSON.stringify(query, null, 2));
        const compatibleParts = await Part.find(query)
            .populate('categoryId', 'name slug icon order')
            .sort({ 'categoryId.order': 1, name: 1 });

        // Группируем детали по категориям для удобства
        const partsByCategory = {};
        compatibleParts.forEach(part => {
            const catSlug = part.categoryId?.slug || 'other';
            if (!partsByCategory[catSlug]) {
                partsByCategory[catSlug] = {
                    category: part.categoryId,
                    parts: []
                };
            }
            partsByCategory[catSlug].parts.push(part);
        });

        console.log(`[carController] Найдено деталей для ${car.fullName}: ${compatibleParts.length}`);

        res.status(200).json({
            success: true,
            data: {
                car,
                parts: compatibleParts,
                partsByCategory: Object.values(partsByCategory)
            }
        });

    } catch (error) {
        console.error('Ошибка при получении автомобиля:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении автомобиля'
        });
    }
};

/**
 * @desc    Создать новый автомобиль
 * @route   POST /api/cars
 * @access  Admin (TODO: добавить авторизацию)
 */
exports.createCar = async (req, res) => {
    try {
        const { brand, model, generation, mainImageUrl, description, yearStart, yearEnd } = req.body;

        // Генерируем slug если не передан
        const slug = req.body.slug || Car.generateSlug(brand, model, generation);

        // Проверяем уникальность slug
        const existingCar = await Car.findOne({ slug });
        if (existingCar) {
            return res.status(400).json({
                success: false,
                error: 'Автомобиль с таким slug уже существует'
            });
        }

        const car = await Car.create({
            brand,
            model,
            generation,
            slug,
            mainImageUrl,
            description,
            yearStart,
            yearEnd
        });

        res.status(201).json({
            success: true,
            data: car
        });

    } catch (error) {
        console.error('Ошибка при создании автомобиля:', error);

        // Обработка ошибок валидации Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при создании автомобиля'
        });
    }
};
