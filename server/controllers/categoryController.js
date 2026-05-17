/**
 * Контроллер для работы с категориями деталей
 * Обрабатывает запросы к /api/categories
 */

const PartCategory = require('../models/PartCategory');

/**
 * @desc    Получить все категории
 * @route   GET /api/categories
 * @access  Public
 */
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await PartCategory.find()
            .sort({ order: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });

    } catch (error) {
        console.error('Ошибка при получении категорий:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении категорий'
        });
    }
};

/**
 * @desc    Получить категорию по slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
exports.getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const category = await PartCategory.findOne({ slug });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Категория не найдена'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error('Ошибка при получении категории:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении категории'
        });
    }
};

/**
 * @desc    Создать новую категорию
 * @route   POST /api/categories
 * @access  Admin
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, icon, order, description } = req.body;

        // Проверяем уникальность slug
        const existingCategory = await PartCategory.findOne({ slug });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Категория с таким slug уже существует'
            });
        }

        const category = await PartCategory.create({
            name,
            slug,
            icon,
            order,
            description
        });

        res.status(201).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error('Ошибка при создании категории:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при создании категории'
        });
    }
};
