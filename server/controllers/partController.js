/**
 * Контроллер для работы с деталями
 * Обрабатывает запросы к /api/parts
 */

const Part = require('../models/Part');
const PartCategory = require('../models/PartCategory');
const mongoose = require('mongoose');

/**
 * @desc    Получить все детали с фильтрацией
 * @route   GET /api/parts
 * @query   categoryId - фильтр по категории
 * @query   carId - фильтр по совместимости с автомобилем
 * @access  Public
 */
exports.getAllParts = async (req, res) => {
    try {
        const { categoryId, carId, category } = req.query;

        // Строим фильтр
        const filter = { isActive: true };

        // Фильтр по категории (по ID или slug)
        if (categoryId) {
            filter.categoryId = categoryId;
        } else if (category) {
            // Если передан slug категории, сначала найдём её
            const cat = await PartCategory.findOne({ slug: category });
            if (cat) {
                filter.categoryId = cat._id;
            }
        }

        // Фильтр по совместимости с автомобилем
        if (carId) {
            filter.compatibility = carId;
        }

        // Получаем детали с populate категории
        const parts = await Part.find(filter)
            .populate('categoryId', 'name slug icon')
            .populate('compatibility', 'brand model generation slug')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: parts.length,
            data: parts
        });

    } catch (error) {
        console.error('Ошибка при получении деталей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении списка деталей'
        });
    }
};

/**
 * @desc    Получить деталь по ID
 * @route   GET /api/parts/:id
 * @access  Public
 */
exports.getPartById = async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем валидность ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат ID детали'
            });
        }

        const part = await Part.findById(id)
            .populate('categoryId', 'name slug icon')
            .populate('compatibility', 'brand model generation slug');

        if (!part) {
            return res.status(404).json({
                success: false,
                error: 'Деталь не найдена'
            });
        }

        res.status(200).json({
            success: true,
            data: part
        });

    } catch (error) {
        console.error('Ошибка при получении детали:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при получении детали'
        });
    }
};

/**
 * @desc    Создать новую деталь
 * @route   POST /api/parts
 * @access  Admin (TODO: добавить авторизацию)
 */
exports.createPart = async (req, res) => {
    try {
        const {
            name,
            categoryId,
            description,
            specs,
            compatibility,
            imageUrl,
            marketSearchQuery,
            manufacturer,
            sku,
            priceEstimate
        } = req.body;

        // Проверяем существование категории
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат ID категории'
            });
        }

        const categoryExists = await PartCategory.findById(categoryId);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                error: 'Категория не найдена'
            });
        }

        // Парсим specs если это строка JSON
        let parsedSpecs = specs;
        if (typeof specs === 'string') {
            try {
                parsedSpecs = JSON.parse(specs);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный формат JSON для характеристик (specs)'
                });
            }
        }

        // Парсим compatibility если это строка
        let parsedCompatibility = compatibility;
        if (typeof compatibility === 'string') {
            try {
                parsedCompatibility = JSON.parse(compatibility);
            } catch (e) {
                // Если не JSON, возможно это одиночный ID
                parsedCompatibility = [compatibility];
            }
        }

        const part = await Part.create({
            name,
            categoryId,
            description,
            specs: parsedSpecs || {},
            compatibility: parsedCompatibility || [],
            imageUrl,
            marketSearchQuery,
            manufacturer,
            sku,
            priceEstimate
        });

        // Возвращаем с populate
        const populatedPart = await Part.findById(part._id)
            .populate('categoryId', 'name slug icon')
            .populate('compatibility', 'brand model generation slug');

        res.status(201).json({
            success: true,
            data: populatedPart
        });

    } catch (error) {
        console.error('Ошибка при создании детали:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при создании детали'
        });
    }
};

/**
 * @desc    Обновить деталь
 * @route   PUT /api/parts/:id
 * @access  Admin (TODO: добавить авторизацию)
 */
exports.updatePart = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат ID детали'
            });
        }

        // Парсим specs если это строка
        if (typeof req.body.specs === 'string') {
            try {
                req.body.specs = JSON.parse(req.body.specs);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный формат JSON для характеристик'
                });
            }
        }

        const part = await Part.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('categoryId', 'name slug icon')
            .populate('compatibility', 'brand model generation slug');

        if (!part) {
            return res.status(404).json({
                success: false,
                error: 'Деталь не найдена'
            });
        }

        res.status(200).json({
            success: true,
            data: part
        });

    } catch (error) {
        console.error('Ошибка при обновлении детали:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при обновлении детали'
        });
    }
};

/**
 * @desc    Удалить деталь
 * @route   DELETE /api/parts/:id
 * @access  Admin (TODO: добавить авторизацию)
 */
exports.deletePart = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат ID детали'
            });
        }

        const part = await Part.findByIdAndDelete(id);

        if (!part) {
            return res.status(404).json({
                success: false,
                error: 'Деталь не найдена'
            });
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'Деталь успешно удалена'
        });

    } catch (error) {
        console.error('Ошибка при удалении детали:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при удалении детали'
        });
    }
};
