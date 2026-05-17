/**
 * Контроллер для деталей (файловая БД)
 */

const FileDB = require('../config/fileDB');
const fileDB = new FileDB();

/**
 * @desc    Получить детали для автомобиля
 * @route   GET /api/parts
 * @access  Public
 */
exports.getParts = async (req, res) => {
    try {
        const { carId } = req.query;
        
        if (!carId) {
            return res.status(400).json({
                success: false,
                error: 'Требуется параметр carId'
            });
        }

        // Получаем автомобиль по ID
        const cars = await fileDB.getCars();
        const car = cars.find(c => c.id === carId);
        
        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Автомобиль не найден'
            });
        }

        // Получаем детали для автомобиля
        const parts = await fileDB.getPartsByCarSlug(car.slug);
        
        res.status(200).json({
            success: true,
            count: parts.length,
            data: parts
        });

    } catch (error) {
        console.error('Ошибка при получении деталей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении деталей'
        });
    }
};
