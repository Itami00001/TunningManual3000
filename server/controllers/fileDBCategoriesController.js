/**
 * Контроллер для категорий (файловая БД)
 */

const FileDB = require('../config/fileDB');
const fileDB = new FileDB();

/**
 * @desc    Получить все категории
 * @route   GET /api/categories
 * @access  Public
 */
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await fileDB.readFile('categories.json');
        
        res.status(200).json({
            success: true,
            count: categories ? categories.length : 0,
            data: categories || []
        });

    } catch (error) {
        console.error('Ошибка при получении категорий:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении категорий'
        });
    }
};
