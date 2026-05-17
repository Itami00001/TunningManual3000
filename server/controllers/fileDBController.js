/**
 * Контроллер для работы с файловой базой данных
 */

const FileDB = require('../config/fileDB');
const fileDB = new FileDB();

/**
 * @desc    Получить все автомобили
 * @route   GET /api/cars
 * @access  Public
 */
exports.getAllCars = async (req, res) => {
    try {
        const cars = await fileDB.getCars();
        
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

        const car = await fileDB.getCarBySlug(slug);

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Автомобиль не найден'
            });
        }

        // Получаем совместимые детали
        const compatibleParts = await fileDB.getPartsByCarSlug(slug);
        
        // Получаем категории
        const categories = await fileDB.readFile('categories.json') || [];
        
        // Группируем детали по категориям
        const partsByCategory = {};
        compatibleParts.forEach(part => {
            const categoryId = part.categoryId;
            if (!partsByCategory[categoryId]) {
                const category = categories.find(cat => cat.id === categoryId);
                partsByCategory[categoryId] = {
                    category: category || { id: 'other', name: 'Другое', slug: 'other' },
                    parts: []
                };
            }
            partsByCategory[categoryId].parts.push(part);
        });

        console.log(`[FileDB] Найдено деталей для ${car.fullName}: ${compatibleParts.length}`);

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
