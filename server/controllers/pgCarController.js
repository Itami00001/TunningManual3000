/**
 * Контроллер автомобилей — PostgreSQL
 */

const { query } = require('../config/postgres');

/**
 * GET /api/cars
 * Все автомобили
 */
exports.getAllCars = async (req, res) => {
    try {
        const result = await query(
            `SELECT id, brand, model, generation, slug, full_name AS "fullName",
                    main_image_url AS "mainImageUrl", year_start AS "yearStart",
                    year_end AS "yearEnd", base_power AS "basePower",
                    base_torque AS "baseTorque", description, is_active AS "isActive"
             FROM cars
             WHERE is_active = true
             ORDER BY brand, model, generation`
        );

        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('pgCarController.getAllCars:', error.message);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении автомобилей' });
    }
};

/**
 * GET /api/cars/:slug
 * Автомобиль по slug + совместимые детали, сгруппированные по категориям
 */
exports.getCarBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        // Автомобиль
        const carResult = await query(
            `SELECT id, brand, model, generation, slug, full_name AS "fullName",
                    main_image_url AS "mainImageUrl", year_start AS "yearStart",
                    year_end AS "yearEnd", base_power AS "basePower",
                    base_torque AS "baseTorque", description, is_active AS "isActive"
             FROM cars WHERE slug = $1`,
            [slug]
        );

        if (carResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Автомобиль не найден' });
        }

        const car = carResult.rows[0];

        // Совместимые детали с характеристиками
        const partsResult = await query(
            `SELECT
                p.id, p.name, p.category_id AS "categoryId",
                p.description, p.manufacturer, p.price_approx AS "price_approx",
                p.compatibility_score, p.compatibility_notes,
                p.complexity_install, p.image_url AS "imageUrl",
                p.market_search_query AS "marketSearchQuery",
                c.name AS "categoryName", c.slug AS "categorySlug", c.icon AS "categoryIcon",
                -- Собираем specs в JSON объект
                COALESCE(
                    json_object_agg(ps.spec_key, ps.spec_value) FILTER (WHERE ps.spec_key IS NOT NULL),
                    '{}'::json
                ) AS specs
             FROM parts p
             JOIN part_compatibility pc ON pc.part_id = p.id
             JOIN cars car ON car.id = pc.car_id
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN part_specs ps ON ps.part_id = p.id
             WHERE car.slug = $1 AND p.is_active = true
             GROUP BY p.id, p.name, p.category_id, p.description, p.manufacturer,
                      p.price_approx, p.compatibility_score, p.compatibility_notes,
                      p.complexity_install, p.image_url, p.market_search_query,
                      c.name, c.slug, c.icon
             ORDER BY c.name, p.name`,
            [slug]
        );

        const parts = partsResult.rows;

        // Группируем по категориям
        const byCategoryMap = {};
        for (const part of parts) {
            const catId = part.categoryId || 'other';
            if (!byCategoryMap[catId]) {
                byCategoryMap[catId] = {
                    category: {
                        id: catId,
                        name: part.categoryName || 'Другое',
                        slug: part.categorySlug || 'other',
                        icon: part.categoryIcon || '🔧',
                    },
                    parts: [],
                };
            }
            byCategoryMap[catId].parts.push(part);
        }

        console.log(`[PG] Найдено деталей для ${car.fullName}: ${parts.length}`);

        res.json({
            success: true,
            data: {
                car,
                parts,
                partsByCategory: Object.values(byCategoryMap),
            },
        });
    } catch (error) {
        console.error('pgCarController.getCarBySlug:', error.message);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении автомобиля' });
    }
};
