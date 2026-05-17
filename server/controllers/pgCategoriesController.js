/**
 * Контроллер категорий — PostgreSQL
 */

const { query } = require('../config/postgres');

/**
 * GET /api/categories
 * Все активные категории
 */
exports.getAllCategories = async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, slug, icon, order_index AS "order", description, is_active AS "isActive"
             FROM categories
             WHERE is_active = true
             ORDER BY order_index`
        );

        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('pgCategoriesController.getAllCategories:', error.message);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении категорий' });
    }
};
