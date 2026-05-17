/**
 * Контроллер деталей — PostgreSQL
 */

const { query } = require('../config/postgres');

/**
 * GET /api/parts?carId=...
 * Детали для конкретного автомобиля
 */
exports.getParts = async (req, res) => {
    try {
        const { carId } = req.query;

        if (!carId) {
            return res.status(400).json({ success: false, error: 'Требуется параметр carId' });
        }

        // Проверяем, существует ли автомобиль
        const carCheck = await query('SELECT id FROM cars WHERE id = $1', [carId]);
        if (carCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Автомобиль не найден' });
        }

        const result = await query(
            `SELECT
                p.id, p.name, p.category_id AS "categoryId",
                p.description, p.manufacturer, p.price_approx AS "price_approx",
                p.compatibility_score, p.compatibility_notes,
                p.complexity_install, p.image_url AS "imageUrl",
                p.market_search_query AS "marketSearchQuery",
                COALESCE(
                    json_object_agg(ps.spec_key, ps.spec_value) FILTER (WHERE ps.spec_key IS NOT NULL),
                    '{}'::json
                ) AS specs
             FROM parts p
             JOIN part_compatibility pc ON pc.part_id = p.id
             LEFT JOIN part_specs ps ON ps.part_id = p.id
             WHERE pc.car_id = $1 AND p.is_active = true
             GROUP BY p.id, p.name, p.category_id, p.description, p.manufacturer,
                      p.price_approx, p.compatibility_score, p.compatibility_notes,
                      p.complexity_install, p.image_url, p.market_search_query
             ORDER BY p.name`,
            [carId]
        );

        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('pgPartsController.getParts:', error.message);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении деталей' });
    }
};
